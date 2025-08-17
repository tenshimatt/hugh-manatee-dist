//
// SimpleVoiceManager.swift - Basic Voice Recognition and TTS
//
import Foundation
import Speech
import AVFoundation
import SwiftUI

struct VoiceOption: Identifiable, Hashable {
    let id = UUID()
    let voice: AVSpeechSynthesisVoice
    let displayName: String
    let language: String
    let gender: String
    
    init(voice: AVSpeechSynthesisVoice) {
        self.voice = voice
        self.language = voice.language
        
        // Extract readable name and gender from voice identifier
        let identifier = voice.identifier
        if identifier.contains("Male") {
            self.gender = "Male"
        } else if identifier.contains("Female") {
            self.gender = "Female"
        } else {
            self.gender = "Default"
        }
        
        // Create display name from voice name or identifier
        if !voice.name.isEmpty {
            self.displayName = "\(voice.name) (\(gender))"
        } else {
            // Extract name from identifier (e.g., "com.apple.voice.compact.en-US.Samantha")
            let components = identifier.split(separator: ".")
            let name = components.last?.capitalized ?? "Unknown"
            self.displayName = "\(name) (\(gender))"
        }
    }
}

@MainActor
class SimpleVoiceManager: NSObject, ObservableObject {
    @Published var isListening = false
    @Published var recognizedText = ""
    @Published var isSpeaking = false
    @Published var hasPermission = false
    @Published var availableVoices: [VoiceOption] = []
    @Published var selectedVoice: VoiceOption?
    
    private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    private let audioEngine = AVAudioEngine()
    private let speechSynthesizer = AVSpeechSynthesizer()
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    
    override init() {
        super.init()
        speechSynthesizer.delegate = self
        setupAudio()
        checkPermissions()
        loadAvailableVoices()
    }
    
    private func checkPermissions() {
        let speechAuthorization = SFSpeechRecognizer.authorizationStatus()
        let micAuthorization = AVAudioSession.sharedInstance().recordPermission
        
        hasPermission = speechAuthorization == .authorized && micAuthorization == .granted
    }
    
    private func loadAvailableVoices() {
        let allVoices = AVSpeechSynthesisVoice.speechVoices()
        
        // Filter for English voices only
        let englishVoices = allVoices.filter { voice in
            voice.language.hasPrefix("en")
        }
        
        // Convert to VoiceOption and sort
        availableVoices = englishVoices.map { VoiceOption(voice: $0) }
            .sorted { $0.displayName < $1.displayName }
        
        // Set default voice - prefer Samantha or first available
        if let defaultVoice = availableVoices.first(where: { $0.displayName.contains("Samantha") }) {
            selectedVoice = defaultVoice
        } else {
            selectedVoice = availableVoices.first
        }
        
        print("🎙️ Loaded \(availableVoices.count) English voices")
        for voice in availableVoices.prefix(5) {
            print("🎙️ Available: \(voice.displayName)")
        }
    }
    
    func selectVoice(_ voiceOption: VoiceOption) {
        selectedVoice = voiceOption
        print("🎙️ Selected voice: \(voiceOption.displayName)")
    }
    
    private func setupAudio() {
        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.playAndRecord, mode: .measurement, options: .duckOthers)
            try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
            print("✅ Audio session setup successful")
        } catch {
            print("❌ Audio setup error: \(error)")
        }
    }
    
    func requestSpeechPermission() async -> Bool {
        let speechStatus = await withCheckedContinuation { continuation in
            SFSpeechRecognizer.requestAuthorization { status in
                continuation.resume(returning: status == .authorized)
            }
        }
        
        let micStatus = await withCheckedContinuation { continuation in
            AVAudioSession.sharedInstance().requestRecordPermission { granted in
                continuation.resume(returning: granted)
            }
        }
        
        hasPermission = speechStatus && micStatus
        return hasPermission
    }
    
    func startListening() {
        print("🎤 SimpleVoiceManager.startListening() called")
        guard !audioEngine.isRunning else { 
            print("🎤 Audio engine already running")
            return 
        }
        
        do {
            try startRecording()
            isListening = true
            print("🎤 Successfully started listening")
        } catch {
            print("❌ Failed to start listening: \(error)")
        }
    }
    
    func stopListening() {
        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
        
        recognitionRequest?.endAudio()
        recognitionRequest = nil
        recognitionTask?.cancel()
        recognitionTask = nil
        
        isListening = false
    }
    
    private func startRecording() throws {
        recognitionTask?.cancel()
        recognitionTask = nil
        
        let inputNode = audioEngine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        
        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        guard let recognitionRequest = recognitionRequest else { return }
        
        recognitionRequest.shouldReportPartialResults = true
        
        recognitionTask = speechRecognizer?.recognitionTask(with: recognitionRequest) { [weak self] result, error in
            guard let self = self else { return }
            
            if let result = result {
                Task { @MainActor in
                    let newText = result.bestTranscription.formattedString
                    print("🎤 Recognition result: '\(newText)'")
                    self.recognizedText = newText
                    
                    if result.isFinal {
                        print("🎤 Final result received")
                        self.stopListening()
                    }
                }
            }
            
            if let error = error {
                // Don't log cancellation errors - they're expected when we stop listening
                if (error as NSError).code != 301 { // kLSRErrorDomain Code=301 is cancellation
                    print("❌ Recognition error: \(error)")
                }
                Task { @MainActor in
                    if self.isListening {
                        self.stopListening()
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
    
    func speak(_ text: String) {
        let utterance = AVSpeechUtterance(string: text)
        
        // Use selected voice or fallback to default
        if let selected = selectedVoice {
            utterance.voice = selected.voice
            print("🎙️ Speaking with: \(selected.displayName)")
        } else {
            utterance.voice = AVSpeechSynthesisVoice(language: "en-US")
            print("🎙️ Speaking with default voice")
        }
        
        utterance.rate = 0.5
        utterance.pitchMultiplier = 1.0
        utterance.volume = 1.0
        
        isSpeaking = true
        speechSynthesizer.speak(utterance)
    }
    
    func stopSpeaking() {
        speechSynthesizer.stopSpeaking(at: .immediate)
        isSpeaking = false
    }
}

extension SimpleVoiceManager: AVSpeechSynthesizerDelegate {
    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        Task { @MainActor in
            isSpeaking = false
        }
    }
    
    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        Task { @MainActor in
            isSpeaking = false
        }
    }
}
