// SilenceDetectionService.swift
// Detects silence in audio stream and emits events

import Foundation
import AVFoundation
import Combine

@MainActor
class SilenceDetectionService: ObservableObject {
    static let shared = SilenceDetectionService()

    @Published var currentSilenceDuration: TimeInterval = 0
    @Published var isDetectingSilence = false

    // Configurable thresholds
    var silenceThreshold: Float = -50.0 // dB
    var shortPauseDuration: TimeInterval = 1.0
    var mediumPauseDuration: TimeInterval = 3.0
    var longPauseDuration: TimeInterval = 5.0

    private var monitoringTask: Task<Void, Never>?
    private var silenceStartTime: Date?
    private var audioRecorder: AVAudioRecorder?

    private var continuations: [AsyncStream<SilenceEvent>.Continuation] = []

    enum PauseType {
        case short  // 1-2s: Continue listening, no response
        case medium // 3-4s: Hugh encouragement or question
        case long   // 5+s: Save segment, suggest new topic
    }

    struct SilenceEvent {
        let pauseType: PauseType
        let duration: TimeInterval
        let timestamp: Date
    }

    init() {}

    /// Start monitoring audio levels from the recorder
    func startMonitoring(audioRecorder: AVAudioRecorder?) async {
        print("[SilenceDetectionService] Starting silence monitoring...")
        self.audioRecorder = audioRecorder
        isDetectingSilence = true

        // Cancel any existing monitoring
        monitoringTask?.cancel()

        // Start new monitoring task
        monitoringTask = Task {
            while !Task.isCancelled {
                await checkSilence()
                try? await Task.sleep(nanoseconds: 100_000_000) // Check every 100ms
            }
        }
    }

    /// Stop monitoring
    func stopMonitoring() {
        print("[SilenceDetectionService] Stopping silence monitoring...")
        monitoringTask?.cancel()
        monitoringTask = nil
        isDetectingSilence = false
        silenceStartTime = nil
        currentSilenceDuration = 0
    }

    /// Get stream of silence events
    func silenceEvents() -> AsyncStream<SilenceEvent> {
        AsyncStream { continuation in
            self.continuations.append(continuation)

            continuation.onTermination = { @Sendable [weak self] _ in
                guard let self = self else { return }
                Task { @MainActor in
                    // Remove all continuations on termination (simplified)
                    if self.continuations.count > 0 {
                        self.continuations.removeLast()
                    }
                }
            }
        }
    }

    /// Reset silence detection (called when user speaks)
    func reset() {
        silenceStartTime = nil
        currentSilenceDuration = 0
    }

    // MARK: - Private Methods

    private func checkSilence() async {
        guard let audioRecorder = audioRecorder else { return }

        // Update metering
        audioRecorder.updateMeters()
        let averagePower = audioRecorder.averagePower(forChannel: 0)

        // Check if audio level is below silence threshold
        if averagePower < silenceThreshold {
            // Silence detected
            if silenceStartTime == nil {
                silenceStartTime = Date()
            }

            // Calculate duration
            if let startTime = silenceStartTime {
                currentSilenceDuration = Date().timeIntervalSince(startTime)

                // Emit events based on duration thresholds
                await emitSilenceEventIfNeeded(duration: currentSilenceDuration)
            }
        } else {
            // Audio detected, reset silence
            if silenceStartTime != nil {
                // Silence ended
                reset()
            }
        }
    }

    private func emitSilenceEventIfNeeded(duration: TimeInterval) async {
        let pauseType: PauseType?

        if duration >= longPauseDuration {
            pauseType = .long
        } else if duration >= mediumPauseDuration {
            pauseType = .medium
        } else if duration >= shortPauseDuration {
            pauseType = .short
        } else {
            pauseType = nil
        }

        guard let pauseType = pauseType else { return }

        // Only emit once per threshold crossing
        let shouldEmit = await checkShouldEmit(for: pauseType, duration: duration)
        if shouldEmit {
            let event = SilenceEvent(
                pauseType: pauseType,
                duration: duration,
                timestamp: Date()
            )

            print("[SilenceDetectionService] Silence detected: \(pauseType) (\(String(format: "%.1f", duration))s)")

            // Emit to all listeners
            for continuation in continuations {
                continuation.yield(event)
            }
        }
    }

    private var lastEmittedPauseType: PauseType?

    private func checkShouldEmit(for pauseType: PauseType, duration: TimeInterval) async -> Bool {
        // Only emit once per pause type level
        if lastEmittedPauseType == pauseType {
            return false
        }

        // If we're at a higher level, emit
        switch pauseType {
        case .short:
            if lastEmittedPauseType == nil {
                lastEmittedPauseType = .short
                return true
            }
        case .medium:
            if lastEmittedPauseType == nil || lastEmittedPauseType == .short {
                lastEmittedPauseType = .medium
                return true
            }
        case .long:
            if lastEmittedPauseType != .long {
                lastEmittedPauseType = .long
                return true
            }
        }

        return false
    }
}
