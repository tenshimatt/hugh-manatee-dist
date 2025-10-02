// CameraPreviewView.swift
// SwiftUI view for camera preview with toggle functionality

import SwiftUI
import AVFoundation

struct CameraPreviewView: View {
    @EnvironmentObject var cameraManager: CameraManager
    @Environment(\.appTheme) var theme

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                if cameraManager.isCameraEnabled {
                    // Bug 34: Live camera preview
                    CameraPreviewLayer(previewLayer: cameraManager.previewLayer)
                        .frame(width: geometry.size.width, height: geometry.size.height)
                        .cornerRadius(20)
                } else {
                    // Bug 35: Background color when camera is off
                    Rectangle()
                        .fill(theme.surface)
                        .frame(width: geometry.size.width, height: geometry.size.height)
                        .cornerRadius(20)
                        .overlay(
                            VStack(spacing: 8) {
                                Image(systemName: "video.slash.fill")
                                    .font(.system(size: 40))
                                    .foregroundColor(theme.textSecondary)

                                Text("Camera Off")
                                    .font(.caption)
                                    .foregroundColor(theme.textSecondary)
                            }
                        )
                }
            }
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(
                        LinearGradient(
                            colors: [theme.primary.opacity(0.3), theme.secondary.opacity(0.3)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 1.5
                    )
            )
            .shadow(color: theme.primary.opacity(0.15), radius: 12, x: 0, y: 6)
            .onTapGesture {
                // Bug 35: Toggle camera on tap
                cameraManager.toggleCamera()
                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
            }
            .accessibilityLabel(cameraManager.isCameraEnabled ? "Camera preview active. Tap to turn off" : "Camera off. Tap to turn on")
            .accessibilityAddTraits(.isButton)
        }
    }
}

// UIViewRepresentable for AVCaptureVideoPreviewLayer
struct CameraPreviewLayer: UIViewRepresentable {
    let previewLayer: AVCaptureVideoPreviewLayer?

    func makeUIView(context: Context) -> UIView {
        let view = UIView()
        view.backgroundColor = .black

        guard let previewLayer = previewLayer else {
            return view
        }

        previewLayer.frame = view.bounds
        previewLayer.videoGravity = .resizeAspectFill
        view.layer.addSublayer(previewLayer)

        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        guard let previewLayer = previewLayer else { return }

        DispatchQueue.main.async {
            previewLayer.frame = uiView.bounds
        }
    }
}
