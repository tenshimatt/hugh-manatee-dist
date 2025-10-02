// CameraManager.swift
// Handles camera preview and video recording for memoir sessions

import AVFoundation
import SwiftUI
import UIKit

@MainActor
class CameraManager: NSObject, ObservableObject {
    @Published var isAuthorized = false
    @Published var isCameraEnabled = true // Bug 35: Toggle state
    @Published var isRecording = false
    @Published var error: String?

    private let captureSession = AVCaptureSession()
    private var videoOutput: AVCaptureMovieFileOutput?
    private var currentVideoURL: URL?
    private var videoDeviceInput: AVCaptureDeviceInput?

    // Preview layer for SwiftUI
    private(set) var previewLayer: AVCaptureVideoPreviewLayer?

    override init() {
        super.init()
        previewLayer = AVCaptureVideoPreviewLayer(session: captureSession)
        previewLayer?.videoGravity = .resizeAspectFill
    }

    // MARK: - Camera Setup

    func requestCameraPermission() async -> Bool {
        await withCheckedContinuation { continuation in
            AVCaptureDevice.requestAccess(for: .video) { granted in
                Task { @MainActor in
                    self.isAuthorized = granted
                    continuation.resume(returning: granted)
                }
            }
        }
    }

    func setupCamera() async throws {
        guard isAuthorized else {
            throw AppError.cameraPermissionDenied
        }

        captureSession.beginConfiguration()

        // Set session preset for quality
        captureSession.sessionPreset = .high

        // Add video input (front camera for selfie view)
        guard let videoDevice = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front) else {
            captureSession.commitConfiguration()
            throw AppError.cameraSetupFailed
        }

        do {
            videoDeviceInput = try AVCaptureDeviceInput(device: videoDevice)

            if captureSession.canAddInput(videoDeviceInput!) {
                captureSession.addInput(videoDeviceInput!)
            } else {
                captureSession.commitConfiguration()
                throw AppError.cameraSetupFailed
            }
        } catch {
            captureSession.commitConfiguration()
            throw AppError.cameraSetupFailed
        }

        // Add video output
        let movieOutput = AVCaptureMovieFileOutput()
        videoOutput = movieOutput

        if captureSession.canAddOutput(movieOutput) {
            captureSession.addOutput(movieOutput)
        } else {
            captureSession.commitConfiguration()
            throw AppError.cameraSetupFailed
        }

        captureSession.commitConfiguration()
    }

    func startSession() {
        guard !captureSession.isRunning else { return }

        Task {
            captureSession.startRunning()
        }
    }

    func stopSession() {
        guard captureSession.isRunning else { return }

        Task {
            captureSession.stopRunning()
        }
    }

    // MARK: - Bug 35: Toggle Camera

    func toggleCamera() {
        isCameraEnabled.toggle()

        if isCameraEnabled {
            startSession()
        } else {
            stopSession()
        }
    }

    // MARK: - Video Recording (Bug 36)

    func startVideoRecording(to url: URL) throws {
        guard let videoOutput = videoOutput else {
            throw AppError.cameraSetupFailed
        }

        guard !videoOutput.isRecording else {
            return
        }

        // Only record if camera is enabled (Bug 35)
        guard isCameraEnabled else {
            return
        }

        currentVideoURL = url
        videoOutput.startRecording(to: url, recordingDelegate: self)
        isRecording = true
    }

    func stopVideoRecording() -> URL? {
        guard let videoOutput = videoOutput else {
            return nil
        }

        guard videoOutput.isRecording else {
            return currentVideoURL
        }

        videoOutput.stopRecording()
        isRecording = false

        return currentVideoURL
    }
}

// MARK: - AVCaptureFileOutputRecordingDelegate

extension CameraManager: AVCaptureFileOutputRecordingDelegate {
    nonisolated func fileOutput(_ output: AVCaptureFileOutput, didStartRecordingTo fileURL: URL, from connections: [AVCaptureConnection]) {
        Task { @MainActor in
            print("[CameraManager] Started recording video to: \(fileURL)")
        }
    }

    nonisolated func fileOutput(_ output: AVCaptureFileOutput, didFinishRecordingTo outputFileURL: URL, from connections: [AVCaptureConnection], error: Error?) {
        Task { @MainActor in
            if let error = error {
                print("[CameraManager] Video recording error: \(error)")
                self.error = error.localizedDescription
            } else {
                print("[CameraManager] Finished recording video to: \(outputFileURL)")
            }
        }
    }
}
