// AudioRecordingManager.swift
// Real audio recording with iOS Speech Recognition

import Foundation
import AVFoundation
import Speech
import Combine

@MainActor
class AudioRecordingManager: NSObject, ObservableObject {
    // MARK: - Published Properties
    @Published var isRecording = false
    @Published var transcription = ""
    @Published var recordingDuration: TimeInterval = 0
    @Published var authorizationStatus: RecordingAuthStatus = .notDetermined

    // MARK: - Private Properties
    private var audioEngine: AVAudioEngine?
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))

    private var audioRecorder: AVAudioRecorder?
    private var recordingURL: URL?
    private var recordingTimer: Timer?
    private var topicDetectionTimer: Timer?
    private var startTime: Date?

    enum RecordingAuthStatus {
        case notDetermined
        case authorized
        case denied
    }

    // MARK: - Initialization
    override init() {
        super.init()
        checkAuthorization()
    }

    // MARK: - Authorization
    func checkAuthorization() {
        // Check both microphone and speech recognition permissions
        let micStatus = AVAudioSession.sharedInstance().recordPermission
        let speechStatus = SFSpeechRecognizer.authorizationStatus()

        if micStatus == .granted && speechStatus == .authorized {
            authorizationStatus = .authorized
        } else if micStatus == .denied || speechStatus == .denied {
            authorizationStatus = .denied
        } else {
            authorizationStatus = .notDetermined
        }
    }

    func requestAuthorization() async -> Bool {
        // Request microphone permission
        let micGranted = await withCheckedContinuation { continuation in
            AVAudioSession.sharedInstance().requestRecordPermission { granted in
                continuation.resume(returning: granted)
            }
        }

        guard micGranted else {
            await MainActor.run { authorizationStatus = .denied }
            return false
        }

        // Request speech recognition permission
        let speechGranted = await withCheckedContinuation { continuation in
            SFSpeechRecognizer.requestAuthorization { status in
                continuation.resume(returning: status == .authorized)
            }
        }

        let authorized = micGranted && speechGranted
        await MainActor.run {
            authorizationStatus = authorized ? .authorized : .denied
        }

        return authorized
    }

    // MARK: - Recording Control
    func startRecording() async throws {
        if authorizationStatus != .authorized {
            let authorized = await requestAuthorization()
            guard authorized else {
                throw RecordingError.authorizationDenied
            }
        }

        // Reset state
        transcription = ""
        recordingDuration = 0
        startTime = Date()

        // Configure audio session
        let audioSession = AVAudioSession.sharedInstance()
        try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
        try audioSession.setActive(true, options: .notifyOthersOnDeactivation)

        // Setup file URL for recording
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        recordingURL = documentsPath.appendingPathComponent("recording_\(UUID().uuidString).m4a")

        // Configure audio recorder
        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
            AVSampleRateKey: 44100.0,
            AVNumberOfChannelsKey: 1,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
        ]

        guard let url = recordingURL else {
            throw RecordingError.noRecordingURL
        }

        audioRecorder = try AVAudioRecorder(url: url, settings: settings)
        audioRecorder?.delegate = self
        audioRecorder?.record()

        // Start live transcription
        try await startLiveTranscription()

        // Start duration timer
        recordingTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { _ in
            Task { @MainActor [weak self] in
                guard let self = self, let start = self.startTime else { return }
                self.recordingDuration = Date().timeIntervalSince(start)
            }
        }

        // Start topic detection timer (every 30 seconds)
        topicDetectionTimer = Timer.scheduledTimer(withTimeInterval: 30.0, repeats: true) { [weak self] _ in
            Task { @MainActor [weak self] in
                guard let self = self else { return }
                await self.detectTopicAndUpdatePrompts()
            }
        }

        isRecording = true
    }

    func stopRecording() async -> (url: URL?, transcription: String, duration: TimeInterval) {
        isRecording = false
        recordingTimer?.invalidate()
        recordingTimer = nil
        topicDetectionTimer?.invalidate()
        topicDetectionTimer = nil

        // Stop audio recorder
        audioRecorder?.stop()

        // Stop live transcription
        recognitionTask?.cancel()
        recognitionTask = nil
        recognitionRequest?.endAudio()
        recognitionRequest = nil
        audioEngine?.stop()
        audioEngine?.inputNode.removeTap(onBus: 0)

        // Deactivate audio session
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)

        let finalTranscription = transcription
        let duration = recordingDuration
        let url = recordingURL

        return (url: url, transcription: finalTranscription, duration: duration)
    }

    // MARK: - Topic Detection

    private func detectTopicAndUpdatePrompts() async {
        guard !transcription.isEmpty else { return }

        // Detect topic from current transcription
        await TopicDetectionService.shared.detectTopic(from: transcription)

        // Update prompts if topic was detected with high confidence
        let topic = TopicDetectionService.shared.currentTopic
        let confidence = TopicDetectionService.shared.topicConfidence

        if confidence > 0.6 {
            // Update prompt service with detected topic
            await AIPromptService.shared.updatePromptsForTopic(topic)
        }
    }

    // MARK: - Live Transcription
    private func startLiveTranscription() async throws {
        // Cancel any existing task
        recognitionTask?.cancel()
        recognitionTask = nil

        // Create and configure recognition request
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
                    self.transcription = result.bestTranscription.formattedString
                }

                if error != nil {
                    // Recognition stopped - could be error or completion
                    self.audioEngine?.stop()
                    self.audioEngine?.inputNode.removeTap(onBus: 0)
                }
            }
        }
    }

    // MARK: - Utility
    func formatDuration(_ duration: TimeInterval) -> String {
        let minutes = Int(duration) / 60
        let seconds = Int(duration) % 60
        return String(format: "%02d:%02d", minutes, seconds)
    }

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
}

// MARK: - AVAudioRecorderDelegate
extension AudioRecordingManager: AVAudioRecorderDelegate {
    nonisolated func audioRecorderDidFinishRecording(_ recorder: AVAudioRecorder, successfully flag: Bool) {
        Task { @MainActor in
            if !flag {
                print("[AudioRecordingManager] Recording finished unsuccessfully")
            }
        }
    }

    nonisolated func audioRecorderEncodeErrorDidOccur(_ recorder: AVAudioRecorder, error: Error?) {
        Task { @MainActor in
            print("[AudioRecordingManager] Encoding error: \(error?.localizedDescription ?? "unknown")")
        }
    }
}
