// SilenceDetector.swift
// Detects silence in audio recording

import Foundation

class SilenceDetector {
    private var silenceStartTime: Date?
    private let threshold: TimeInterval = 3.0
    var onSilenceDetected: ((TimeInterval) -> Void)?
    
    func recordSilence() {
        if silenceStartTime == nil {
            silenceStartTime = Date()
        }
        
        if let start = silenceStartTime {
            let duration = Date().timeIntervalSince(start)
            if duration >= threshold {
                onSilenceDetected?(duration)
            }
        }
    }
    
    func reset() {
        silenceStartTime = nil
    }
    
    var currentSilenceDuration: TimeInterval {
        guard let start = silenceStartTime else { return 0 }
        return Date().timeIntervalSince(start)
    }
}
