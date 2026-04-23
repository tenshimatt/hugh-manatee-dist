// ContinuousRecordingService.swift
// Manages continuous audio recording that starts on app launch

import Foundation
import AVFoundation
import Speech
import Combine

@MainActor
class ContinuousRecordingService: NSObject, ObservableObject {
    static let shared = ContinuousRecordingService()

    @Published var isRecording = false
    @Published var currentTranscription = ""
    @Published var audioLevel: Float = 0.0
    @Published var recordingDuration: TimeInterval = 0
    @Published var conversationState: ConversationState = .listening

    // Expose audio recorder for silence detection
    var audioRecorder: AVAudioRecorder? { _audioRecorder }

    private var _audioRecorder: AVAudioRecorder?
    private var audioFile: URL?
    private var timer: Timer?
    private var levelTimer: Timer?
    private var segmentCounter = 0

    // Speech recognition
    private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private let audioEngine = AVAudioEngine()

    // Core Data integration
    private let coreDataManager = CoreDataManager.shared
    private var currentSession: MemoirSessionEntity?

    enum ConversationState {
        case listening      // User speaking, transcribing
        case silent         // User paused, analyzing
        case hughResponding // Hugh speaking, recording paused
        case saving         // Segment complete, saving
    }

    override init() {
        super.init()
    }

    /// Start continuous recording immediately
    func startContinuousRecording() async throws {
        print("[ContinuousRecordingService] Starting continuous recording...")

        // Configure audio session for recording + playback
        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(
                .playAndRecord,
                mode: .spokenAudio,
                options: [.defaultToSpeaker, .allowBluetooth, .duckOthers]
            )
            try audioSession.setActive(true)
            print("[ContinuousRecordingService] Audio session configured")
        } catch {
            print("[ContinuousRecordingService] Failed to setup audio session: \(error)")
            throw error
        }

        // Request permissions
        guard await requestSpeechPermission() else {
            throw NSError(domain: "ContinuousRecording", code: 1, userInfo: [NSLocalizedDescriptionKey: "Speech permission denied"])
        }
        guard await requestMicrophonePermission() else {
            throw NSError(domain: "ContinuousRecording", code: 2, userInfo: [NSLocalizedDescriptionKey: "Microphone permission denied"])
        }

        // Setup audio file
        segmentCounter += 1
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd_HH-mm-ss"
        let fileName = "continuous_\(dateFormatter.string(from: Date()))_\(segmentCounter).m4a"

        let secureDirectory = try getSecureAudioDirectory()
        audioFile = secureDirectory.appendingPathComponent(fileName)

        // Configure recorder with metering enabled for silence detection
        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
            AVSampleRateKey: 44100,
            AVNumberOfChannelsKey: 1,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
        ]

        _audioRecorder = try AVAudioRecorder(url: audioFile!, settings: settings)
        _audioRecorder?.delegate = self
        _audioRecorder?.isMeteringEnabled = true
        _audioRecorder?.prepareToRecord()

        // Start recording
        guard _audioRecorder?.record() == true else {
            throw NSError(domain: "ContinuousRecording", code: 3, userInfo: [NSLocalizedDescriptionKey: "Failed to start recording"])
        }

        isRecording = true
        conversationState = .listening

        // Create Core Data session
        currentSession = coreDataManager.createMemoirSession()
        try? coreDataManager.save()

        // Start transcription
        try startTranscription()

        // Start timers
        startTimers()

        print("[ContinuousRecordingService] Continuous recording started successfully")
    }

    /// Pause recording while Hugh speaks
    func pauseForHughResponse() async {
        print("[ContinuousRecordingService] Pausing for Hugh response...")
        conversationState = .hughResponding
        _audioRecorder?.pause()
        stopTranscription()
    }

    /// Resume recording after Hugh finishes
    func resumeAfterHugh() async {
        print("[ContinuousRecordingService] Resuming after Hugh...")
        conversationState = .listening
        _audioRecorder?.record()
        try? startTranscription()
    }

    /// Save current conversation segment
    func saveCurrentSegment() async {
        guard let audioFile = audioFile, let session = currentSession else { return }

        conversationState = .saving

        let finalTranscription = currentTranscription
        let finalDuration = recordingDuration
        let audioFileName = audioFile.lastPathComponent

        _ = coreDataManager.createMemoirSegment(
            for: session,
            transcription: finalTranscription,
            audioFileName: audioFileName,
            duration: finalDuration,
            aiPrompt: ""
        )

        try? coreDataManager.save()

        // Start new segment
        segmentCounter += 1
        conversationState = .listening
        currentTranscription = ""
        recordingDuration = 0
    }

    /// Handle app backgrounding
    func handleAppBackground() async {
        await saveCurrentSegment()
        stopTranscription()
    }

    /// Stop continuous recording completely
    func stopContinuousRecording() async {
        print("[ContinuousRecordingService] Stopping continuous recording...")
        _audioRecorder?.stop()
        isRecording = false
        stopTranscription()
        stopTimers()
        await saveCurrentSegment()
    }

    // MARK: - Private Methods

    private func startTranscription() throws {
        guard speechRecognizer?.isAvailable == true else {
            throw NSError(domain: "ContinuousRecording", code: 4, userInfo: [NSLocalizedDescriptionKey: "Speech recognition unavailable"])
        }

        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()

        let inputNode = audioEngine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)

        guard let recognitionRequest = recognitionRequest else { return }

        recognitionRequest.shouldReportPartialResults = true
        recognitionRequest.requiresOnDeviceRecognition = false

        recognitionTask = speechRecognizer?.recognitionTask(with: recognitionRequest) { [weak self] result, error in
            guard let self = self else { return }

            if let result = result {
                Task { @MainActor in
                    self.currentTranscription = result.bestTranscription.formattedString
                }
            }

            if error != nil || (result?.isFinal ?? false) {
                self.stopTranscription()
                if self.isRecording && self.conversationState == .listening {
                    try? self.startTranscription() // Restart for continuous recording
                }
            }
        }

        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
            self.recognitionRequest?.append(buffer)
        }

        audioEngine.prepare()
        try audioEngine.start()
    }

    private func stopTranscription() {
        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
        recognitionRequest?.endAudio()
        recognitionRequest = nil
        recognitionTask?.cancel()
        recognitionTask = nil
    }

    private func startTimers() {
        // Duration timer
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.recordingDuration += 1
            }
        }

        // Audio level timer (for silence detection)
        levelTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.updateAudioLevel()
            }
        }
    }

    private func stopTimers() {
        timer?.invalidate()
        levelTimer?.invalidate()
    }

    private func updateAudioLevel() {
        _audioRecorder?.updateMeters()
        let level = _audioRecorder?.averagePower(forChannel: 0) ?? -160
        audioLevel = level
    }

    private func requestSpeechPermission() async -> Bool {
        await withCheckedContinuation { continuation in
            SFSpeechRecognizer.requestAuthorization { status in
                continuation.resume(returning: status == .authorized)
            }
        }
    }

    private func requestMicrophonePermission() async -> Bool {
        await withCheckedContinuation { continuation in
            AVAudioSession.sharedInstance().requestRecordPermission { granted in
                continuation.resume(returning: granted)
            }
        }
    }

    private func getSecureAudioDirectory() throws -> URL {
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let secureDirectory = documentsPath.appendingPathComponent("SecureAudio", isDirectory: true)

        if !FileManager.default.fileExists(atPath: secureDirectory.path) {
            try FileManager.default.createDirectory(
                at: secureDirectory,
                withIntermediateDirectories: true,
                attributes: [.protectionKey: FileProtectionType.complete]
            )
        }

        return secureDirectory
    }
}

// MARK: - AVAudioRecorderDelegate
extension ContinuousRecordingService: AVAudioRecorderDelegate {
    nonisolated func audioRecorderDidFinishRecording(_ recorder: AVAudioRecorder, successfully flag: Bool) {
        Task { @MainActor in
            if !flag {
                print("[ContinuousRecordingService] Recording failed to complete")
            }
        }
    }
}
