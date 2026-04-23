// RecordingManagerTests.swift
// Tests for RecordingManager

import XCTest
import AVFoundation
@testable import MemoirGuide

class RecordingManagerTests: XCTestCase {
    var sut: RecordingManager!
    var mockDelegate: MockRecordingDelegate!
    
    override func setUp() {
        super.setUp()
        sut = RecordingManager()
        mockDelegate = MockRecordingDelegate()
        sut.delegate = mockDelegate
    }
    
    // Test 1.1: Start Recording
    func test_startRecording_whenPermissionGranted_shouldBeginRecording() async {
        // Given
        let expectation = XCTestExpectation(description: "Recording started")
        mockDelegate.onRecordingStarted = { expectation.fulfill() }
        
        // When
        await sut.startRecording()
        
        // Then
        await fulfillment(of: [expectation], timeout: 1.0)
        XCTAssertTrue(sut.isRecording)
        XCTAssertNotNil(sut.currentRecordingURL)
    }
    
    // Test 1.2: Auto-save every 30 seconds
    func test_recording_after30Seconds_shouldAutoSave() async {
        // Given
        await sut.startRecording()
        let expectation = XCTestExpectation(description: "Auto-save triggered")
        mockDelegate.onSegmentSaved = { segment in
            XCTAssertGreaterThan(segment.duration, 29)
            expectation.fulfill()
        }
        
        // When - Wait 31 seconds
        try? await Task.sleep(nanoseconds: 31_000_000_000)
        
        // Then
        await fulfillment(of: [expectation], timeout: 1.0)
    }
    
    // Test 1.3: Silence Detection
    func test_silenceDetection_after5Seconds_shouldTriggerPrompt() async {
        // Given
        sut.silenceThreshold = 5.0
        await sut.startRecording()
        let expectation = XCTestExpectation(description: "Silence detected")
        
        mockDelegate.onSilenceDetected = { duration in
            XCTAssertGreaterThanOrEqual(duration, 5.0)
            expectation.fulfill()
        }
        
        // When - Simulate silence
        sut.simulateSilence(duration: 5.5)
        
        // Then
        await fulfillment(of: [expectation], timeout: 1.0)
    }
    
    // Test 1.4: Recording Permission Denied
    func test_startRecording_whenPermissionDenied_shouldShowError() async {
        // Given
        sut.mockPermissionStatus = .denied
        let expectation = XCTestExpectation(description: "Error shown")
        
        mockDelegate.onError = { error in
            XCTAssertEqual(error, .microphonePermissionDenied)
            expectation.fulfill()
        }
        
        // When
        await sut.startRecording()
        
        // Then
        await fulfillment(of: [expectation], timeout: 1.0)
        XCTAssertFalse(sut.isRecording)
    }
}

// MARK: - Mock Delegate

class MockRecordingDelegate: RecordingManagerDelegate {
    var onRecordingStarted: (() -> Void)?
    var onRecordingStop: ((MemoirSegment) -> Void)?
    var onSegmentSaved: ((MemoirSegment) -> Void)?
    var onSilenceDetected: ((TimeInterval) -> Void)?
    var onError: ((Error) -> Void)?
    
    func recordingDidStart() {
        onRecordingStarted?()
    }
    
    func recordingDidStop(segment: MemoirSegment) {
        onRecordingStop?(segment)
    }
    
    func segmentAutoSaved(segment: MemoirSegment) {
        onSegmentSaved?(segment)
    }
    
    func silenceDetected(duration: TimeInterval) {
        onSilenceDetected?(duration)
    }
    
    func errorOccurred(_ error: Error) {
        onError?(error)
    }
}
