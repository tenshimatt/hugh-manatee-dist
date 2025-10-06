//
//  HughVoiceService.swift
//  Aurora
//
//  Hugh the Manatee - Text-to-Speech Service
//  Brings Hugh to life with a warm, friendly voice using ElevenLabs
//

import Foundation
import AVFoundation
import Combine

/// Hugh the Manatee's voice service
/// Handles all text-to-speech for Hugh's personality with dynamic voice/speed control
class HughVoiceService: NSObject, ObservableObject, AVAudioPlayerDelegate {
    static let shared = HughVoiceService()

    // Backend URL for secure TTS endpoint
    private let backendURL = "https://aurora-api.findrawdogfood.workers.dev"

    // Audio player
    private var audioPlayer: AVAudioPlayer?

    // State
    @Published var isSpeaking = false
    @Published var isEnabled = true

    // Voice preferences (conversationally adjustable, persisted via UserDefaults)
    var currentVoice: String {
        get { UserDefaults.standard.string(forKey: "hughVoice") ?? "echo" }
        set { UserDefaults.standard.set(newValue, forKey: "hughVoice") }
    }

    var currentSpeed: Double {
        get {
            let speed = UserDefaults.standard.double(forKey: "hughSpeed")
            return speed == 0 ? 1.0 : speed // Default: 1.0 (normal professional pace)
        }
        set { UserDefaults.standard.set(newValue, forKey: "hughSpeed") }
    }

    // Hugh's personality phrases (cached on backend)
    struct HughPhrases {
        static let welcome = "Hi! I'm Hugh, your memory companion. What's on your mind today?"
        static let memorySaved = "Wonderful! Your memory has been saved. I'm polishing it up to make it shine."
        static let enhancementComplete = "All done! Your story looks beautiful."
        static let readyToRecord = "Take your time... I'm here to listen."
        static let encouragement = "That's a lovely memory. Thank you for sharing."
        static let askMore = "I'd love to hear more about that. Can you tell me..."
    }

    // Phrase keys for backend caching
    enum CachedPhrase: String {
        case welcome = "welcome"
        case memorySaved = "memory_saved"
        case enhancementComplete = "enhancement_complete"
        case readyToRecord = "ready_to_record"
        case encouragement = "encouragement"
    }

    override private init() {
        super.init()
        setupAudioSession()
    }

    /// Setup audio session for playback
    private func setupAudioSession() {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .spokenAudio, options: [.duckOthers])
            try session.setActive(true)
        } catch {
            print("❌ [Hugh] Failed to setup audio session: \(error)")
        }
    }

    // MARK: - Public API

    /// Make Hugh speak (uses backend TTS if enabled)
    @MainActor
    func speak(_ text: String, phraseKey: CachedPhrase? = nil) async {
        guard isEnabled else { return }

        print("🦭 [Hugh] Speaking: \(text)")

        do {
            // Call backend TTS endpoint
            let audioData = try await fetchTTS(text: text, phraseKey: phraseKey)

            // Play audio
            try await playAudio(data: audioData)

        } catch {
            print("❌ [Hugh] TTS error: \(error)")
            // Fallback: Silent failure (user won't know Hugh wanted to speak)
            // Could add AVSpeechSynthesizer fallback here later
        }
    }

    /// Hugh welcomes the user (CACHED)
    @MainActor
    func welcomeUser() async {
        await speak(HughPhrases.welcome, phraseKey: .welcome)
    }

    /// Hugh confirms memory was saved (CACHED)
    @MainActor
    func confirmMemorySaved() async {
        await speak(HughPhrases.memorySaved, phraseKey: .memorySaved)
    }

    /// Hugh announces enhancement is complete (CACHED)
    @MainActor
    func announceEnhancementComplete() async {
        await speak(HughPhrases.enhancementComplete, phraseKey: .enhancementComplete)
    }

    /// Hugh reads a follow-up question (DYNAMIC - not cached)
    @MainActor
    func askQuestion(_ question: String) async {
        let hughQuestion = "I'd love to hear more about that. \(question)"
        await speak(hughQuestion)
    }

    /// Hugh encourages the user (CACHED)
    @MainActor
    func encourage() async {
        await speak(HughPhrases.encouragement, phraseKey: .encouragement)
    }

    /// Stop Hugh from speaking
    func stopSpeaking() {
        audioPlayer?.stop()
        isSpeaking = false
    }

    // MARK: - Conversational Voice Adjustments

    /// Slow down Hugh's speaking speed
    @MainActor
    func slowDown() async {
        let oldSpeed = currentSpeed
        currentSpeed = max(0.7, currentSpeed - 0.1)
        if oldSpeed != currentSpeed {
            await speak("I'll slow down for you.")
        }
    }

    /// Speed up Hugh's speaking speed
    @MainActor
    func speedUp() async {
        let oldSpeed = currentSpeed
        currentSpeed = min(1.0, currentSpeed + 0.1)
        if oldSpeed != currentSpeed {
            await speak("I'll speed up a bit.")
        }
    }

    /// Change to a deeper voice
    @MainActor
    func changeToDeeper() async {
        currentVoice = "onyx"
        await speak("How's this?")
    }

    /// Change to a lighter voice
    @MainActor
    func changeToLighter() async {
        currentVoice = "nova"
        await speak("How's this?")
    }

    /// Change to a clearer voice
    @MainActor
    func changeToClearer() async {
        currentVoice = "alloy"
        await speak("Is this clearer?")
    }

    /// Change to a softer voice
    @MainActor
    func changeToSofter() async {
        currentVoice = "shimmer"
        await speak("How about this?")
    }

    /// Cycle to next available voice
    @MainActor
    func cycleVoice() async {
        let voices = ["echo", "alloy", "nova", "shimmer", "onyx", "fable"]
        if let currentIndex = voices.firstIndex(of: currentVoice) {
            let nextIndex = (currentIndex + 1) % voices.count
            currentVoice = voices[nextIndex]
        }
        await speak("Is this better?")
    }

    /// Confirm preference saved
    @MainActor
    func confirmPreference() async {
        await speak("Great, I'll remember that.")
    }

    // MARK: - Backend Communication

    /// Fetch TTS audio from backend with dynamic voice/speed
    private func fetchTTS(text: String, phraseKey: CachedPhrase? = nil) async throws -> Data {
        let endpoint = "\(backendURL)/ai/speak"

        guard let url = URL(string: endpoint) else {
            throw HughError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 30 // TTS can take 5-10 seconds

        // Include voice preferences and phraseKey for caching if available
        var requestBody: [String: Any] = [
            "text": text,
            "voice": currentVoice,
            "speed": currentSpeed
        ]
        if let key = phraseKey {
            requestBody["phraseKey"] = key.rawValue
        }

        request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw HughError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            throw HughError.apiError(statusCode: httpResponse.statusCode)
        }

        // Log cache status
        if let cacheStatus = httpResponse.value(forHTTPHeaderField: "X-Cache") {
            print("🦭 [Hugh] Cache: \(cacheStatus)")
        }

        return data
    }

    // MARK: - Audio Playback

    /// Play audio data
    private func playAudio(data: Data) async throws {
        // Stop any current playback
        audioPlayer?.stop()

        // Create audio player
        audioPlayer = try AVAudioPlayer(data: data)
        audioPlayer?.delegate = self
        audioPlayer?.prepareToPlay()

        // Play
        DispatchQueue.main.async {
            self.isSpeaking = true
        }

        audioPlayer?.play()

        // Wait for playback to complete
        while audioPlayer?.isPlaying == true {
            try await Task.sleep(nanoseconds: 100_000_000) // 0.1s
        }

        DispatchQueue.main.async {
            self.isSpeaking = false
        }
    }

    // MARK: - AVAudioPlayerDelegate

    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        DispatchQueue.main.async {
            self.isSpeaking = false
        }
    }

    func audioPlayerDecodeErrorDidOccur(_ player: AVAudioPlayer, error: Error?) {
        print("❌ [Hugh] Audio decode error: \(error?.localizedDescription ?? "unknown")")
        DispatchQueue.main.async {
            self.isSpeaking = false
        }
    }
}

// MARK: - Hugh Errors

enum HughError: LocalizedError {
    case invalidURL
    case invalidResponse
    case apiError(statusCode: Int)
    case playbackFailed

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Hugh couldn't connect (invalid URL)"
        case .invalidResponse:
            return "Hugh couldn't understand the response"
        case .apiError(let code):
            return "Hugh encountered an error (status \(code))"
        case .playbackFailed:
            return "Hugh couldn't speak (playback failed)"
        }
    }
}
