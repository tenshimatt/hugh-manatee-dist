// AudioPlaybackManager.swift
// Handles audio playback for stories and vault recordings

import Foundation
import AVFoundation
import Combine

@MainActor
class AudioPlaybackManager: NSObject, ObservableObject {
    static let shared = AudioPlaybackManager()

    @Published var isPlaying = false
    @Published var currentTime: TimeInterval = 0
    @Published var duration: TimeInterval = 0
    @Published var currentStory: ChapterEntity?
    @Published var currentSegment: MemoirSegmentEntity?
    @Published var playbackRate: Float = 1.0
    @Published var volume: Float = 1.0
    @Published var isLoading = false
    @Published var error: String?

    private var audioPlayer: AVAudioPlayer?
    private var playbackTimer: Timer?

    private override init() {
        super.init()
        setupAudioSession()
    }

    // MARK: - Audio Session Setup

    private func setupAudioSession() {
        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.playback, mode: .spokenAudio, options: [])
            try audioSession.setActive(true)
        } catch {
            self.error = "Failed to setup audio session: \(error.localizedDescription)"
        }
    }

    // MARK: - Playback Control

    func playStory(_ chapter: ChapterEntity) async {
        isLoading = true
        currentStory = chapter
        error = nil

        // Get all segments for this story
        let segments = chapter.sessionsArray.flatMap { $0.segmentsArray }
        guard let firstSegment = segments.first else {
            error = "No audio found for this story"
            isLoading = false
            return
        }

        await playSegment(firstSegment)
    }

    func playSegment(_ segment: MemoirSegmentEntity) async {
        isLoading = true
        currentSegment = segment
        error = nil

        guard let audioURL = segment.audioURL, audioURL.isFileExists else {
            error = "Audio file not found"
            isLoading = false
            return
        }

        do {
            audioPlayer?.stop()
            audioPlayer = try AVAudioPlayer(contentsOf: audioURL)
            audioPlayer?.delegate = self
            audioPlayer?.volume = volume
            audioPlayer?.rate = playbackRate
            audioPlayer?.prepareToPlay()

            duration = audioPlayer?.duration ?? 0
            currentTime = 0

            audioPlayer?.play()
            isPlaying = true
            startTimer()
            isLoading = false
        } catch {
            self.error = "Failed to play audio: \(error.localizedDescription)"
            isLoading = false
        }
    }

    func pause() {
        audioPlayer?.pause()
        isPlaying = false
        stopTimer()
    }

    func resume() {
        audioPlayer?.play()
        isPlaying = true
        startTimer()
    }

    func stop() {
        audioPlayer?.stop()
        audioPlayer?.currentTime = 0
        isPlaying = false
        currentTime = 0
        stopTimer()
        currentStory = nil
        currentSegment = nil
    }

    func seek(to time: TimeInterval) {
        guard let player = audioPlayer else { return }
        player.currentTime = time
        currentTime = time
    }

    func skipForward(_ seconds: TimeInterval = 10) {
        guard let player = audioPlayer else { return }
        let newTime = min(player.currentTime + seconds, duration)
        seek(to: newTime)
    }

    func skipBackward(_ seconds: TimeInterval = 10) {
        guard let player = audioPlayer else { return }
        let newTime = max(player.currentTime - seconds, 0)
        seek(to: newTime)
    }

    func setVolume(_ newVolume: Float) {
        volume = max(0.0, min(1.0, newVolume))
        audioPlayer?.volume = volume
    }

    func setPlaybackRate(_ rate: Float) {
        playbackRate = max(0.5, min(2.0, rate))
        audioPlayer?.rate = playbackRate
    }

    // MARK: - Timer Management

    private func startTimer() {
        stopTimer()
        playbackTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            Task { @MainActor [weak self] in
                guard let self = self, let player = self.audioPlayer else { return }
                self.currentTime = player.currentTime
            }
        }
    }

    private func stopTimer() {
        playbackTimer?.invalidate()
        playbackTimer = nil
    }

    // MARK: - Convenience Methods

    var isCurrentlyPlaying: Bool {
        return isPlaying
    }

    var progress: Double {
        guard duration > 0 else { return 0 }
        return currentTime / duration
    }

    var remainingTime: TimeInterval {
        return duration - currentTime
    }

    func formatTime(_ time: TimeInterval) -> String {
        let hours = Int(time) / 3600
        let minutes = Int(time) % 3600 / 60
        let seconds = Int(time) % 60

        if hours > 0 {
            return String(format: "%d:%02d:%02d", hours, minutes, seconds)
        } else {
            return String(format: "%d:%02d", minutes, seconds)
        }
    }
}

// MARK: - AVAudioPlayerDelegate

extension AudioPlaybackManager: AVAudioPlayerDelegate {
    nonisolated func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        Task { @MainActor in
            self.isPlaying = false
            self.stopTimer()

            // Auto-play next segment if available
            if let currentSegment = self.currentSegment,
               let session = currentSegment.session,
               let nextSegment = session.segmentsArray.first(where: { $0.sequenceNumber == currentSegment.sequenceNumber + 1 }) {
                await self.playSegment(nextSegment)
            } else {
                self.stop()
            }
        }
    }

    nonisolated func audioPlayerDecodeErrorDidOccur(_ player: AVAudioPlayer, error: Error?) {
        Task { @MainActor in
            self.error = "Audio playback error: \(error?.localizedDescription ?? "Unknown error")"
            self.isPlaying = false
            self.stopTimer()
        }
    }
}