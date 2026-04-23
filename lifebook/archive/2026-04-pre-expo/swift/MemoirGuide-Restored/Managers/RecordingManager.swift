// RecordingManager.swift
// Handles audio recording and speech recognition

import AVFoundation
import Speech
import Combine
import UIKit

@MainActor
class RecordingManager: NSObject, ObservableObject {
    @Published var isRecording = false
    @Published var currentTranscription = ""
    @Published var audioLevel: Float = 0.0
    @Published var recordingDuration: TimeInterval = 0
    @Published var silenceDuration: TimeInterval = 0
    @Published var lastAutoSave: Date?
    @Published var recordingError: String?

    private var audioRecorder: AVAudioRecorder?
    private var audioFile: URL?
    private var timer: Timer?
    private var autoSaveTimer: Timer?
    private var silenceDetector: SilenceDetector
    private var levelTimer: Timer?
    private var backgroundTaskID: UIBackgroundTaskIdentifier = .invalid
    private var segmentCounter = 0

    // Core Data integration
    private var currentSession: MemoirSessionEntity?
    private let coreDataManager = CoreDataManager.shared
    
    // Delegate pattern replaced with Combine publishers for SwiftUI integration
    
    private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private let audioEngine = AVAudioEngine()
    
    override init() {
        self.silenceDetector = SilenceDetector()
        super.init()
        setupNotifications()
    }
    
    func startRecording() async throws {
        // Clear any previous errors
        recordingError = nil

        // Ensure audio session is properly configured
        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.playAndRecord, mode: .spokenAudio, options: [.defaultToSpeaker, .allowBluetoothA2DP])
            try audioSession.setActive(true)
            print("[RecordingManager] Audio session configured successfully")
        } catch {
            print("[RecordingManager] Failed to setup audio session: \(error)")
            throw AppError.audioSessionSetupFailed
        }

        // Check permissions
        print("[RecordingManager] Requesting speech permission...")
        guard await requestSpeechPermission() else {
            print("[RecordingManager] Speech permission denied")
            throw AppError.microphonePermissionDenied
        }
        print("[RecordingManager] Speech permission granted")

        print("[RecordingManager] Requesting microphone permission...")
        guard await requestMicrophonePermission() else {
            print("[RecordingManager] Microphone permission denied")
            throw AppError.microphonePermissionDenied
        }
        print("[RecordingManager] Microphone permission granted")

        // Request background time for extended recording
        requestBackgroundRecording()

        // Setup audio file with better naming in secure directory
        segmentCounter += 1
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd_HH-mm-ss"
        let fileName = "memoir_\(dateFormatter.string(from: Date()))_\(segmentCounter).m4a"

        // Save to secure directory with encryption
        print("[RecordingManager] Creating secure audio directory...")
        let secureDirectory: URL
        do {
            secureDirectory = try getSecureAudioDirectory()
            print("[RecordingManager] Secure directory created at: \(secureDirectory.path)")
        } catch {
            print("[RecordingManager] Failed to create secure directory: \(error)")
            throw error
        }

        audioFile = secureDirectory.appendingPathComponent(fileName)
        print("[RecordingManager] Audio file path: \(audioFile!.path)")

        // Configure recorder
        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
            AVSampleRateKey: 44100,
            AVNumberOfChannelsKey: 1,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
        ]

        print("[RecordingManager] Initializing audio recorder...")
        do {
            audioRecorder = try AVAudioRecorder(url: audioFile!, settings: settings)
            print("[RecordingManager] Audio recorder initialized successfully")
        } catch {
            print("[RecordingManager] Failed to initialize audio recorder: \(error)")
            throw error
        }

        audioRecorder?.delegate = self
        audioRecorder?.isMeteringEnabled = true
        audioRecorder?.prepareToRecord()

        // Start recording with error handling
        print("[RecordingManager] Starting recording...")
        guard audioRecorder?.record() == true else {
            print("[RecordingManager] Failed to start recording - recorder.record() returned false")
            throw AppError.recordingFailed
        }
        print("[RecordingManager] Recording started successfully")
        
        isRecording = true

        // Create Core Data session for this recording
        await MainActor.run {
            currentSession = coreDataManager.createMemoirSession()
            do {
                try coreDataManager.save()
            } catch {
                recordingError = "Failed to create recording session"
            }
        }

        // Start transcription with error handling
        do {
            try startTranscription()
        } catch {
            // Continue recording even if transcription fails
            recordingError = "Transcription unavailable, audio recording continues"
        }

        // Start timers
        startTimers()

        // Publishing state changes automatically notifies SwiftUI views
    }
    
    func stopRecording() async -> MemoirSegment? {
        // Stop recording
        audioRecorder?.stop()
        isRecording = false

        // Stop transcription
        stopTranscription()

        // Stop timers
        stopTimers()

        // End background task
        endBackgroundRecording()

        // Save final segment to Core Data
        guard let audioFile = audioFile, let session = currentSession else {
            currentSession = nil
            return nil
        }

        let finalTranscription = currentTranscription
        let finalDuration = recordingDuration
        let audioFileName = audioFile.lastPathComponent

        await MainActor.run {
            _ = coreDataManager.createMemoirSegment(
                for: session,
                transcription: finalTranscription,
                audioFileName: audioFileName,
                duration: finalDuration,
                aiPrompt: ""
            )

            do {
                try coreDataManager.save()
            } catch {
                self.recordingError = "Failed to save recording: \(error.localizedDescription)"
            }
        }

        // Create return struct for CloudKit sync
        let segment = MemoirSegment(
            transcription: finalTranscription,
            audioURL: audioFile,
            aiPrompt: "",
            timestamp: Date(),
            duration: finalDuration
        )

        // Reset state
        currentTranscription = ""
        recordingDuration = 0
        recordingError = nil
        currentSession = nil

        return segment
    }
    
    private func startTranscription() throws {
        guard speechRecognizer?.isAvailable == true else {
            throw AppError.speechRecognitionUnavailable
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
                DispatchQueue.main.async {
                    self.currentTranscription = result.bestTranscription.formattedString
                    
                    // Detect silence
                    if result.isFinal {
                        self.silenceDetector.recordSilence()
                    } else {
                        self.silenceDetector.reset()
                    }
                }
            }
            
            if error != nil || (result?.isFinal ?? false) {
                self.stopTranscription()
                if self.isRecording {
                    do {
                        try self.startTranscription() // Restart for continuous recording
                    } catch {
                        // Handle transcription restart failure silently
                        self.recordingError = "Transcription temporarily unavailable"
                    }
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

        // Auto-save timer (every 30 seconds)
        autoSaveTimer = Timer.scheduledTimer(withTimeInterval: 30.0, repeats: true) { [weak self] _ in
            Task {
                await self?.autoSave()
            }
        }

        // Audio level timer
        levelTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.updateAudioLevel()
            }
        }
    }
    
    private func stopTimers() {
        timer?.invalidate()
        autoSaveTimer?.invalidate()
        levelTimer?.invalidate()
    }
    
    private func updateAudioLevel() {
        audioRecorder?.updateMeters()
        let level = audioRecorder?.averagePower(forChannel: 0) ?? -160
        audioLevel = max(0, (level + 160) / 160) // Normalize to 0-1
    }
    
    private func autoSave() async {
        guard isRecording, let session = currentSession else { return }

        // Save segment to Core Data
        await MainActor.run {
            let audioFileName = audioFile?.lastPathComponent

            _ = coreDataManager.createMemoirSegment(
                for: session,
                transcription: currentTranscription,
                audioFileName: audioFileName,
                duration: recordingDuration,
                aiPrompt: ""
            )

            do {
                try coreDataManager.save()
                self.lastAutoSave = Date()
            } catch {
                self.recordingError = "Auto-save failed: \(error.localizedDescription)"
            }
        }
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
    
    private func requestBackgroundRecording() {
        backgroundTaskID = UIApplication.shared.beginBackgroundTask(withName: "MemoirRecording") { [weak self] in
            self?.endBackgroundRecording()
        }
    }
    
    private func endBackgroundRecording() {
        if backgroundTaskID != .invalid {
            UIApplication.shared.endBackgroundTask(backgroundTaskID)
            backgroundTaskID = .invalid
        }
    }

    // MARK: - Secure File Storage

    /// Creates and returns a secure directory for audio files with encryption at rest
    private func getSecureAudioDirectory() throws -> URL {
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let secureDirectory = documentsPath.appendingPathComponent("SecureAudio", isDirectory: true)

        // Create directory if it doesn't exist
        if !FileManager.default.fileExists(atPath: secureDirectory.path) {
            try FileManager.default.createDirectory(
                at: secureDirectory,
                withIntermediateDirectories: true,
                attributes: [
                    .protectionKey: FileProtectionType.complete
                ]
            )
        }

        return secureDirectory
    }

    private func setupNotifications() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleInterruption),
            name: AVAudioSession.interruptionNotification,
            object: nil
        )
    }
    
    @objc private func handleInterruption(notification: Notification) {
        guard let info = notification.userInfo,
              let typeValue = info[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: typeValue) else { return }
        
        if type == .began {
            Task {
                await autoSave()
            }
        }
    }
}



// MARK: - AVAudioRecorderDelegate

extension RecordingManager: AVAudioRecorderDelegate {
    nonisolated func audioRecorderDidFinishRecording(_ recorder: AVAudioRecorder, successfully flag: Bool) {
        Task { @MainActor in
            if !flag {
                self.recordingError = "Recording failed to complete"
            }
        }
    }
}
