//
//  SilenceDetectionService.swift
//  Aurora
//
//  Silence Detection for Continuous Recording
//  Monitors audio levels to detect when user pauses speaking
//

import Foundation
import AVFoundation
import Combine

/// Service that monitors audio levels and detects silence for conversational pauses
@MainActor
class SilenceDetectionService: ObservableObject {
    static let shared = SilenceDetectionService()

    // MARK: - Published Properties

    /// Current audio level in decibels (-160 to 0)
    @Published var currentAudioLevel: Float = -160.0

    /// Whether silence is currently detected
    @Published var isSilent: Bool = false

    // MARK: - Configuration Properties

    /// Silence threshold in dB (default: -50.0)
    /// Audio below this level is considered silence
    var silenceThreshold: Float = -50.0

    /// Duration of silence required to trigger event (default: 3.0 seconds)
    var silenceDuration: TimeInterval = 3.0

    /// Sampling interval for audio level checks (default: 0.1 seconds)
    var samplingInterval: TimeInterval = 0.1

    // MARK: - Private Properties

    private var monitoringTimer: Timer?
    private var audioRecorder: AVAudioRecorder?
    private var silenceStartTime: Date?
    private var lastAudioLevel: Float = -160.0

    // Event stream continuation
    private var eventContinuation: AsyncStream<SilenceEvent>.Continuation?
    private var isMonitoring = false

    private init() {
        print("🔇 [SilenceDetection] Service initialized")
    }

    // MARK: - Public API

    /// Start monitoring audio levels for silence detection
    /// - Parameter audioRecorder: The AVAudioRecorder instance to monitor
    func startMonitoring(audioRecorder: AVAudioRecorder) {
        guard !isMonitoring else {
            print("⚠️ [SilenceDetection] Already monitoring")
            return
        }

        self.audioRecorder = audioRecorder

        // Enable metering on the recorder
        audioRecorder.isMeteringEnabled = true

        // Start monitoring timer
        monitoringTimer = Timer.scheduledTimer(
            withTimeInterval: samplingInterval,
            repeats: true
        ) { [weak self] _ in
            Task { @MainActor [weak self] in
                self?.checkAudioLevel()
            }
        }

        isMonitoring = true
        print("🔇 [SilenceDetection] Started monitoring (threshold: \(silenceThreshold) dB, duration: \(silenceDuration)s)")
    }

    /// Stop monitoring audio levels
    func stopMonitoring() {
        guard isMonitoring else { return }

        monitoringTimer?.invalidate()
        monitoringTimer = nil
        audioRecorder = nil
        silenceStartTime = nil
        isMonitoring = false
        isSilent = false

        // Complete the event stream
        eventContinuation?.finish()
        eventContinuation = nil

        print("🔇 [SilenceDetection] Stopped monitoring")
    }

    /// Get an async stream of silence events
    /// - Returns: AsyncStream that emits SilenceEvent when silence is detected
    func silenceEvents() -> AsyncStream<SilenceEvent> {
        return AsyncStream { continuation in
            self.eventContinuation = continuation

            continuation.onTermination = { @Sendable [weak self] _ in
                Task { @MainActor in
                    self?.eventContinuation = nil
                }
            }
        }
    }

    // MARK: - Private Methods

    /// Check current audio level and detect silence
    private func checkAudioLevel() {
        guard let recorder = audioRecorder, recorder.isRecording else {
            return
        }

        // Update metering
        recorder.updateMeters()

        // Get average power for channel 0 (mono recording)
        let averagePower = recorder.averagePower(forChannel: 0)
        currentAudioLevel = averagePower

        // Check if current level is below silence threshold
        let isBelowThreshold = averagePower < silenceThreshold

        if isBelowThreshold {
            // Silence detected
            if silenceStartTime == nil {
                // Start of silence
                silenceStartTime = Date()
                print("🔇 [SilenceDetection] Silence started (level: \(String(format: "%.1f", averagePower)) dB)")
            } else {
                // Continuing silence - check duration
                let silenceDurationSoFar = Date().timeIntervalSince(silenceStartTime!)

                if !isSilent && silenceDurationSoFar >= silenceDuration {
                    // Silence threshold reached
                    isSilent = true

                    // Calculate average silence level
                    let averageSilenceLevel = currentAudioLevel

                    // Determine pause type
                    let pauseType = determinePauseType(duration: silenceDurationSoFar)

                    // Create and emit silence event
                    let event = SilenceEvent(
                        pauseDuration: silenceDurationSoFar,
                        averageLevel: averageSilenceLevel,
                        pauseType: pauseType
                    )

                    print("🔇 [SilenceDetection] Silence detected: \(pauseType) pause (\(String(format: "%.1f", silenceDurationSoFar))s, \(String(format: "%.1f", averageSilenceLevel)) dB)")

                    // Emit event
                    eventContinuation?.yield(event)
                }
            }
        } else {
            // Audio detected (above threshold)
            if silenceStartTime != nil {
                // End of silence
                let finalDuration = Date().timeIntervalSince(silenceStartTime!)

                if isSilent {
                    print("🔇 [SilenceDetection] Silence ended after \(String(format: "%.1f", finalDuration))s (level: \(String(format: "%.1f", averagePower)) dB)")
                }

                silenceStartTime = nil
                isSilent = false
            }
        }

        lastAudioLevel = averagePower
    }

    /// Determine pause type based on duration
    /// - Parameter duration: Duration of the pause in seconds
    /// - Returns: PauseType classification
    private func determinePauseType(duration: TimeInterval) -> PauseType {
        switch duration {
        case 0..<3.0:
            return .short
        case 3.0..<5.0:
            return .medium
        default:
            return .long
        }
    }

    // MARK: - Configuration Helpers

    /// Update silence threshold
    /// - Parameter threshold: New threshold in dB (-160 to 0)
    func updateSilenceThreshold(_ threshold: Float) {
        let clampedThreshold = max(-160.0, min(0.0, threshold))
        silenceThreshold = clampedThreshold
        print("🔇 [SilenceDetection] Threshold updated to \(clampedThreshold) dB")
    }

    /// Update silence duration requirement
    /// - Parameter duration: New duration in seconds
    func updateSilenceDuration(_ duration: TimeInterval) {
        let clampedDuration = max(0.5, min(10.0, duration))
        silenceDuration = clampedDuration
        print("🔇 [SilenceDetection] Duration updated to \(clampedDuration)s")
    }

    /// Reset silence detection state (useful when conversation restarts)
    func resetState() {
        silenceStartTime = nil
        isSilent = false
        currentAudioLevel = -160.0
        print("🔇 [SilenceDetection] State reset")
    }
}

// MARK: - Data Models

/// Event emitted when silence is detected
struct SilenceEvent: Identifiable {
    let id = UUID()
    let timestamp = Date()

    /// Duration of the pause in seconds
    let pauseDuration: TimeInterval

    /// Average audio level during the silence (in dB)
    let averageLevel: Float

    /// Classification of pause length
    let pauseType: PauseType

    /// Human-readable description
    var description: String {
        return "\(pauseType) pause: \(String(format: "%.1f", pauseDuration))s at \(String(format: "%.1f", averageLevel)) dB"
    }
}

/// Classification of pause duration
enum PauseType: String, Codable {
    /// Short pause: 1-2 seconds (breathing pause, not actionable)
    case short = "short"

    /// Medium pause: 3-4 seconds (user finished thought, Hugh should respond)
    case medium = "medium"

    /// Long pause: 5+ seconds (user may need prompting or segment should be saved)
    case long = "long"

    var humanReadable: String {
        switch self {
        case .short:
            return "Short pause (1-2s)"
        case .medium:
            return "Medium pause (3-4s)"
        case .long:
            return "Long pause (5+s)"
        }
    }
}

// MARK: - Errors

enum SilenceDetectionError: LocalizedError {
    case notMonitoring
    case invalidRecorder
    case meteringNotEnabled

    var errorDescription: String? {
        switch self {
        case .notMonitoring:
            return "Silence detection is not currently monitoring"
        case .invalidRecorder:
            return "Invalid audio recorder provided"
        case .meteringNotEnabled:
            return "Audio metering must be enabled on the recorder"
        }
    }
}
