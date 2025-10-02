// VideoPlayerManager.swift
// Manages video playback synced with audio

import Foundation
import AVKit
import Combine

@MainActor
class VideoPlayerManager: ObservableObject {
    @Published var player: AVPlayer?
    @Published var isPlaying = false

    func setupPlayer(with url: URL) {
        player = AVPlayer(url: url)
        player?.volume = 0.0 // Mute video, audio comes from AudioPlaybackManager
    }

    func play() {
        player?.play()
        isPlaying = true
    }

    func pause() {
        player?.pause()
        isPlaying = false
    }

    func seek(to time: TimeInterval) {
        let cmTime = CMTime(seconds: time, preferredTimescale: 600)
        player?.seek(to: cmTime)
    }

    func stop() {
        player?.pause()
        player?.seek(to: .zero)
        isPlaying = false
    }
}
