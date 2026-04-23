//
//  ContinuousRecordingService.swift
//  Aurora
//
//  Continuous Recording Service for Aurora's Voice-First Experience
//  Never stops recording while app is in foreground - ChatGPT voice mode style
//

import Foundation
import AVFoundation
import Speech
import Combine

/// Manages continuous recording for Aurora's always-listening experience
/// Segments conversations based on silence detection and Hugh's responses
@MainActor
class ContinuousRecordingService: NSObject, ObservableObject {
    static let shared = ContinuousRecordingService()

    // MARK: - Published State

    @Published var isRecording = false
    @Published var currentTranscription = ""
    @Published var conversationSegments: [ConversationSegment] = []
    @Published var currentAudioLevel: Float = -160.0 // dB
    @Published var conversationState: ConversationState = .idle

    // MARK: - Private Properties

    private var audioEngine: AVAudioEngine?
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))

    // Expose audioRecorder for external silence detection
    private(set) var audioRecorder: AVAudioRecorder?
    private var currentSegmentURL: URL?
    private var segmentStartTime: Date?

    // Audio level monitoring
    private var levelTimer: Timer?
    private var silenceDetectionTimer: Timer?
    private var currentSilenceDuration: TimeInterval = 0

    // Dependencies
    private let recordingDataManager = RecordingDataManager.shared
    private let hughVoiceService = HughVoiceService.shared

    // Configuration
    private let silenceThreshold: Float = -50.0 // dB
    private let shortPauseDuration: TimeInterval = 1.5
    private let mediumPauseDuration: TimeInterval = 3.0
    private let longPauseDuration: TimeInterval = 5.0
    private let maxSegmentDuration: TimeInterval = 300.0 // 5 minutes

    // State tracking
    private var isHughSpeaking = false
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Conversation State Machine

    enum ConversationState: Equatable {
        case idle
        case listening
        case detectingSilence(duration: TimeInterval)
        case hughResponding
        case savingSegment
    }

    // MARK: - Initialization

    override private init() {
        super.init()
        setupObservers()
    }

    /// Setup observers for Hugh's speaking state
    private func setupObservers() {
        hughVoiceService.$isSpeaking
            .sink { [weak self] isSpeaking in
                Task { @MainActor [weak self] in
                    guard let self = self else { return }
                    self.isHughSpeaking = isSpeaking

                    if isSpeaking {
                        await self.pauseForHughResponse()
                    } else if self.isRecording {
                        await self.resumeAfterHugh()
                    }
                }
            }
            .store(in: &cancellables)
    }

    // MARK: - Public API

    /// Start continuous recording (called on app launch)
    func startContinuousRecording() async throws {
        guard !isRecording else {
            print("🎙️ [ContinuousRecording] Already recording")
            return
        }

        print("🎙️ [ContinuousRecording] Starting continuous recording...")

        // Request authorization
        let authorized = await requestAuthorization()
        guard authorized else {
            throw RecordingError.authorizationDenied
        }

        // Configure audio session for continuous recording + playback
        try configureAudioSession()

        // Start recording and transcription
        try await startNewSegment()

        // Start audio level monitoring for silence detection
        startAudioLevelMonitoring()

        // Start silence detection
        startSilenceDetection()

        isRecording = true
        conversationState = .listening

        print("✅ [ContinuousRecording] Continuous recording started")
    }

    /// Stop continuous recording (called on app close or background)
    func stopContinuousRecording() async {
        guard isRecording else { return }

        print("🎙️ [ContinuousRecording] Stopping continuous recording...")

        // Stop monitoring
        stopAudioLevelMonitoring()
        stopSilenceDetection()

        // Save current segment
        await saveCurrentSegment()

        // Stop recording
        audioRecorder?.stop()

        // Stop transcription
        recognitionTask?.cancel()
        recognitionTask = nil
        recognitionRequest?.endAudio()
        recognitionRequest = nil
        audioEngine?.stop()
        audioEngine?.inputNode.removeTap(onBus: 0)

        // Deactivate audio session
        try? AVAudioSession.sharedInstance().setActive(false)

        isRecording = false
        conversationState = .idle
        currentTranscription = ""

        print("✅ [ContinuousRecording] Continuous recording stopped")
    }

    /// Pause recording when Hugh starts speaking
    func pauseForHughResponse() async {
        guard conversationState == .listening else { return }

        print("🦭 [ContinuousRecording] Pausing for Hugh's response")
        conversationState = .hughResponding

        // Stop silence detection while Hugh speaks
        stopSilenceDetection()

        // Keep audio engine running but pause recorder
        audioRecorder?.pause()
    }

    /// Resume recording after Hugh finishes speaking
    func resumeAfterHugh() async {
        guard conversationState == .hughResponding else { return }

        print("🎙️ [ContinuousRecording] Resuming after Hugh")

        // Resume recorder
        audioRecorder?.record()

        // Restart silence detection
        startSilenceDetection()

        conversationState = .listening
    }

    /// Save current segment to storage
    func saveCurrentSegment() async {
        guard !currentTranscription.isEmpty else {
            print("⚠️ [ContinuousRecording] No transcription to save")
            return
        }

        conversationState = .savingSegment

        print("💾 [ContinuousRecording] Saving segment...")

        // Stop current recording
        audioRecorder?.stop()

        // Create segment
        let segment = ConversationSegment(
            id: UUID(),
            transcription: currentTranscription,
            audioURL: currentSegmentURL ?? URL(fileURLWithPath: ""),
            duration: Date().timeIntervalSince(segmentStartTime ?? Date()),
            timestamp: segmentStartTime ?? Date()
        )

        conversationSegments.append(segment)

        // Save to RecordingDataManager
        recordingDataManager.saveRecording(
            title: generateSegmentTitle(from: currentTranscription),
            transcription: currentTranscription,
            duration: segment.duration,
            audioURL: segment.audioURL,
            category: "Conversation"
        )

        print("✅ [ContinuousRecording] Segment saved: \(segment.transcription.prefix(50))...")

        // Start new segment if still recording
        if isRecording && !isHughSpeaking {
            try? await startNewSegment()
            conversationState = .listening
        }
    }

    /// Handle app going to background
    func handleAppBackground() async {
        print("📱 [ContinuousRecording] App going to background")

        // Save current segment
        await saveCurrentSegment()

        // Pause transcription but keep audio recording if allowed
        recognitionTask?.cancel()
        recognitionTask = nil
        recognitionRequest?.endAudio()
        recognitionRequest = nil

        // Audio recording continues via background audio capability
        print("✅ [ContinuousRecording] Background transition complete")
    }

    /// Handle app returning to foreground
    func handleAppForeground() async {
        print("📱 [ContinuousRecording] App returning to foreground")

        if isRecording {
            // Restart transcription
            try? await startLiveTranscription()
            conversationState = .listening
        }
    }

    // MARK: - Private Methods - Recording

    /// Start a new recording segment
    private func startNewSegment() async throws {
        // Reset state
        currentTranscription = ""
        currentSilenceDuration = 0
        segmentStartTime = Date()

        // Generate new file URL
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        currentSegmentURL = documentsPath.appendingPathComponent("segment_\(UUID().uuidString).m4a")

        guard let url = currentSegmentURL else {
            throw RecordingError.noRecordingURL
        }

        // Configure audio recorder with metering for silence detection
        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatLinearPCM),
            AVSampleRateKey: 44100.0,
            AVNumberOfChannelsKey: 1,
            AVEncoderBitDepthHintKey: 16,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
        ]

        audioRecorder = try AVAudioRecorder(url: url, settings: settings)
        audioRecorder?.delegate = self
        audioRecorder?.isMeteringEnabled = true
        audioRecorder?.record()

        // Start live transcription
        try await startLiveTranscription()

        print("🎙️ [ContinuousRecording] New segment started")
    }

    /// Start live transcription
    private func startLiveTranscription() async throws {
        // Cancel any existing task
        recognitionTask?.cancel()
        recognitionTask = nil

        // Create recognition request
        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        guard let recognitionRequest = recognitionRequest else {
            throw RecordingError.recognitionRequestFailed
        }

        recognitionRequest.shouldReportPartialResults = true
        recognitionRequest.requiresOnDeviceRecognition = false // Use cloud for better accuracy

        // Setup audio engine
        audioEngine = AVAudioEngine()
        guard let audioEngine = audioEngine else {
            throw RecordingError.audioEngineFailed
        }

        let inputNode = audioEngine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)

        // Install tap on audio input
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { [weak self] buffer, _ in
            self?.recognitionRequest?.append(buffer)
        }

        // Start audio engine
        audioEngine.prepare()
        try audioEngine.start()

        // Start recognition task
        recognitionTask = speechRecognizer?.recognitionTask(with: recognitionRequest) { [weak self] result, error in
            Task { @MainActor in
                guard let self = self else { return }

                if let result = result {
                    self.currentTranscription = result.bestTranscription.formattedString

                    // Check if segment is too long
                    if let startTime = self.segmentStartTime,
                       Date().timeIntervalSince(startTime) > self.maxSegmentDuration {
                        await self.saveCurrentSegment()
                    }
                }

                if error != nil {
                    print("⚠️ [ContinuousRecording] Recognition error: \(error!.localizedDescription)")
                }
            }
        }
    }

    // MARK: - Private Methods - Silence Detection

    /// Start monitoring audio levels for silence detection
    private func startAudioLevelMonitoring() {
        levelTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            Task { @MainActor [weak self] in
                guard let self = self else { return }

                // Update metering
                self.audioRecorder?.updateMeters()

                // Get average power level in dB
                if let recorder = self.audioRecorder {
                    let avgPower = recorder.averagePower(forChannel: 0)
                    self.currentAudioLevel = avgPower
                }
            }
        }
    }

    /// Stop monitoring audio levels
    private func stopAudioLevelMonitoring() {
        levelTimer?.invalidate()
        levelTimer = nil
    }

    /// Start silence detection timer
    private func startSilenceDetection() {
        silenceDetectionTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            Task { @MainActor [weak self] in
                guard let self = self else { return }
                await self.checkForSilence()
            }
        }
    }

    /// Stop silence detection timer
    private func stopSilenceDetection() {
        silenceDetectionTimer?.invalidate()
        silenceDetectionTimer = nil
        currentSilenceDuration = 0
    }

    /// Check if user is silent and update state
    private func checkForSilence() async {
        guard conversationState == .listening else { return }

        // Check if current level is below silence threshold
        if currentAudioLevel < silenceThreshold {
            currentSilenceDuration += 0.1
            conversationState = .detectingSilence(duration: currentSilenceDuration)

            // Handle different silence durations
            if currentSilenceDuration >= longPauseDuration {
                // Long pause - save segment
                print("🔇 [ContinuousRecording] Long pause detected - saving segment")
                await saveCurrentSegment()
                currentSilenceDuration = 0

            } else if currentSilenceDuration >= mediumPauseDuration {
                // Medium pause - trigger Hugh response (once per pause)
                if currentSilenceDuration < mediumPauseDuration + 0.2 {
                    print("🔇 [ContinuousRecording] Medium pause detected - Hugh should respond")
                    // Post notification for conversation manager to handle
                    NotificationCenter.default.post(
                        name: .userPauseDetected,
                        object: nil,
                        userInfo: [
                            "transcription": currentTranscription,
                            "pauseDuration": currentSilenceDuration
                        ]
                    )
                }
            }
            // Short pause - continue listening, no action

        } else {
            // User is speaking - reset silence counter
            if currentSilenceDuration > 0 {
                currentSilenceDuration = 0
                conversationState = .listening
            }
        }
    }

    // MARK: - Private Methods - Authorization

    /// Request microphone and speech recognition permissions
    private func requestAuthorization() async -> Bool {
        // Request microphone permission
        let micGranted = await withCheckedContinuation { continuation in
            AVAudioSession.sharedInstance().requestRecordPermission { granted in
                continuation.resume(returning: granted)
            }
        }

        guard micGranted else {
            print("❌ [ContinuousRecording] Microphone permission denied")
            return false
        }

        // Request speech recognition permission
        let speechGranted = await withCheckedContinuation { continuation in
            SFSpeechRecognizer.requestAuthorization { status in
                continuation.resume(returning: status == .authorized)
            }
        }

        guard speechGranted else {
            print("❌ [ContinuousRecording] Speech recognition permission denied")
            return false
        }

        return true
    }

    /// Configure audio session for continuous recording and playback
    private func configureAudioSession() throws {
        let session = AVAudioSession.sharedInstance()

        // Configure for simultaneous recording and playback
        try session.setCategory(
            .playAndRecord,
            mode: .spokenAudio,
            options: [.defaultToSpeaker, .allowBluetooth, .duckOthers]
        )

        try session.setActive(true, options: .notifyOthersOnDeactivation)

        print("✅ [ContinuousRecording] Audio session configured")
    }

    // MARK: - Private Methods - Utilities

    /// Generate a title for a segment based on transcription
    private func generateSegmentTitle(from transcription: String) -> String {
        let words = transcription.split(separator: " ")
        let prefix = words.prefix(5).joined(separator: " ")
        return prefix.isEmpty ? "Conversation Segment" : prefix + "..."
    }
}

// MARK: - AVAudioRecorderDelegate

extension ContinuousRecordingService: AVAudioRecorderDelegate {
    nonisolated func audioRecorderDidFinishRecording(_ recorder: AVAudioRecorder, successfully flag: Bool) {
        Task { @MainActor in
            if !flag {
                print("⚠️ [ContinuousRecording] Recording finished unsuccessfully")
            }
        }
    }

    nonisolated func audioRecorderEncodeErrorDidOccur(_ recorder: AVAudioRecorder, error: Error?) {
        Task { @MainActor in
            print("❌ [ContinuousRecording] Encoding error: \(error?.localizedDescription ?? "unknown")")
        }
    }
}

// MARK: - Models

/// Represents a segment of conversation
struct ConversationSegment: Identifiable, Codable {
    let id: UUID
    let transcription: String
    let audioURL: URL
    let duration: TimeInterval
    let timestamp: Date

    var formattedDuration: String {
        let minutes = Int(duration) / 60
        let seconds = Int(duration) % 60
        return String(format: "%d:%02d", minutes, seconds)
    }

    var formattedTimestamp: String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: timestamp)
    }
}

// MARK: - Errors

enum RecordingError: LocalizedError {
    case authorizationDenied
    case noRecordingURL
    case recognitionRequestFailed
    case audioEngineFailed

    var errorDescription: String? {
        switch self {
        case .authorizationDenied:
            return "Microphone and speech recognition permissions are required"
        case .noRecordingURL:
            return "Failed to create recording file"
        case .recognitionRequestFailed:
            return "Failed to create speech recognition request"
        case .audioEngineFailed:
            return "Failed to initialize audio engine"
        }
    }
}

// MARK: - Notifications

extension Notification.Name {
    static let userPauseDetected = Notification.Name("userPauseDetected")
}
