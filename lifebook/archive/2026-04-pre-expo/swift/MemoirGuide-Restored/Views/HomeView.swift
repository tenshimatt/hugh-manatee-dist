import SwiftUI
import AVFoundation

// MARK: - Home View
struct HomeView: View {
    @AppStorage("userName") private var userName = "Friend"
    @EnvironmentObject var recordingManager: RecordingManager
    @State private var showingRecordingComplete = false
    @State private var completedSegment: MemoirSegment?
    @State private var pulseAnimation = false
    @State private var showingPermissionAlert = false

    // Greeting based on time of day
    var greeting: String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 0..<12: return "Good Morning"
        case 12..<17: return "Good Afternoon"
        default: return "Good Evening"
        }
    }

    var body: some View {
        ZStack {
            DesignSystem.backgroundBeige
                .ignoresSafeArea()

            VStack(spacing: 0) {
                // Header
                VStack(spacing: 10) {
                    VStack(spacing: 4) {
                        Text(greeting + ",")
                            .font(DesignSystem.largeTitle)
                            .foregroundColor(DesignSystem.textPrimary)
                        Text(userName)
                            .font(DesignSystem.largeTitle)
                            .foregroundColor(DesignSystem.textPrimary)
                    }

                    Text("Ready to share a memory?")
                        .font(DesignSystem.body)
                        .foregroundColor(DesignSystem.textSecondary)
                }
                .padding(.top, 60)
                .padding(.bottom, 20)

                // Today's Prompt (Optional)
                if !recordingManager.isRecording {
                    VStack(spacing: 8) {
                        Text("Today's prompt:")
                            .font(DesignSystem.caption)
                            .foregroundColor(DesignSystem.textSecondary)
                        Text("Tell me about your favorite childhood game")
                            .font(DesignSystem.body)
                            .foregroundColor(DesignSystem.primaryTeal)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)
                    }
                    .padding()
                    .background(Color.white.opacity(0.8))
                    .cornerRadius(DesignSystem.cardCornerRadius)
                    .padding(.horizontal, DesignSystem.largePadding)
                    .transition(.opacity)
                }

                Spacer()

                // Record Button
                ZStack {
                    // Pulse animation circles
                    if recordingManager.isRecording {
                        Circle()
                            .fill(DesignSystem.recordRed.opacity(0.2))
                            .frame(width: DesignSystem.recordButtonSize + 60,
                                   height: DesignSystem.recordButtonSize + 60)
                            .scaleEffect(pulseAnimation ? 1.1 : 1.0)
                            .animation(
                                Animation.easeInOut(duration: 1.5)
                                    .repeatForever(autoreverses: true),
                                value: pulseAnimation
                            )

                        Circle()
                            .fill(DesignSystem.recordRed.opacity(0.1))
                            .frame(width: DesignSystem.recordButtonSize + 100,
                                   height: DesignSystem.recordButtonSize + 100)
                            .scaleEffect(pulseAnimation ? 1.2 : 1.0)
                            .animation(
                                Animation.easeInOut(duration: 1.5)
                                    .repeatForever(autoreverses: true)
                                    .delay(0.3),
                                value: pulseAnimation
                            )
                    }

                    Button(action: toggleRecording) {
                        VStack(spacing: 15) {
                            Image(systemName: recordingManager.isRecording ? "stop.circle.fill" : "mic.circle.fill")
                                .font(.system(size: 70))
                                .symbolRenderingMode(.hierarchical)

                            if recordingManager.isRecording {
                                // Recording indicator
                                VStack(spacing: 5) {
                                    Text("Recording...")
                                        .font(DesignSystem.buttonText)
                                        .accessibilityIdentifier("recordingLabel")
                                    Text(formatDuration(recordingManager.recordingDuration))
                                        .font(DesignSystem.body)
                                        .foregroundColor(.white.opacity(0.9))
                                        .accessibilityIdentifier("recordingDuration")
                                }
                            } else {
                                Text("Tap to Record")
                                    .font(DesignSystem.buttonText)
                            }
                        }
                        .foregroundColor(.white)
                        .frame(width: DesignSystem.recordButtonSize,
                               height: DesignSystem.recordButtonSize)
                        .background(
                            recordingManager.isRecording ? DesignSystem.recordRed : DesignSystem.primaryTeal
                        )
                        .clipShape(Circle())
                        .shadow(color: .black.opacity(0.2), radius: 10, y: 5)
                    }
                    .accessibilityIdentifier(recordingManager.isRecording ? "stopRecordingButton" : "startRecordingButton")
                    .scaleEffect(recordingManager.isRecording ? 1.05 : 1.0)
                    .animation(.easeInOut(duration: 0.3), value: recordingManager.isRecording)
                }
                .onAppear {
                    if recordingManager.isRecording {
                        pulseAnimation = true
                    }
                }

                // Live transcription display (shown while recording)
                if recordingManager.isRecording && !recordingManager.currentTranscription.isEmpty {
                    VStack(spacing: 8) {
                        Text("Live Transcription")
                            .font(DesignSystem.caption)
                            .foregroundColor(DesignSystem.textSecondary)

                        ScrollView {
                            Text(recordingManager.currentTranscription)
                                .font(DesignSystem.body)
                                .foregroundColor(DesignSystem.textPrimary)
                                .multilineTextAlignment(.leading)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .frame(height: 100)
                    }
                    .padding()
                    .background(Color.white.opacity(0.9))
                    .cornerRadius(DesignSystem.cardCornerRadius)
                    .padding(.horizontal, DesignSystem.largePadding)
                    .transition(.opacity)
                }

                Spacer()

                // Bottom Navigation
                VStack(spacing: 12) {
                    // Primary navigation row
                    HStack(spacing: 12) {
                        NavigationLink(destination: StoriesListView()) {
                            HStack(spacing: 12) {
                                Image(systemName: "book.fill")
                                    .font(.title2)
                                Text("My Stories")
                                    .font(DesignSystem.body)
                            }
                            .foregroundColor(DesignSystem.primaryTeal)
                            .frame(maxWidth: .infinity)
                            .frame(height: 60)
                            .background(Color.white)
                            .cornerRadius(DesignSystem.cardCornerRadius)
                            .shadow(color: .black.opacity(0.05), radius: 5, y: 2)
                        }
                        .accessibilityIdentifier("myStoriesButton")

                        NavigationLink(destination: ProfileProgressView()) {
                            HStack(spacing: 12) {
                                Image(systemName: "person.text.rectangle.fill")
                                    .font(.title2)
                                Text("Family Tree")
                                    .font(DesignSystem.body)
                            }
                            .foregroundColor(.purple)
                            .frame(maxWidth: .infinity)
                            .frame(height: 60)
                            .background(Color.white)
                            .cornerRadius(DesignSystem.cardCornerRadius)
                            .shadow(color: .black.opacity(0.05), radius: 5, y: 2)
                        }
                        .accessibilityIdentifier("familyTreeButton")
                    }

                    // Help button
                    NavigationLink(destination: HelpView()) {
                        HStack(spacing: 12) {
                            Image(systemName: "questionmark.circle.fill")
                                .font(.title2)
                            Text("Help")
                                .font(DesignSystem.body)
                        }
                        .foregroundColor(DesignSystem.textSecondary)
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .background(Color.white.opacity(0.7))
                        .cornerRadius(DesignSystem.cardCornerRadius)
                    }
                }
                .padding(.horizontal, DesignSystem.largePadding)
                .padding(.bottom, 40)
            }
        }
        .navigationBarHidden(true)
        .sheet(isPresented: $showingRecordingComplete) {
            if let segment = completedSegment {
                RecordingCompleteView(
                    transcription: segment.transcription,
                    audioURL: segment.audioURL,
                    duration: segment.duration
                )
            }
        }
        .alert("Microphone Permission Required", isPresented: $showingPermissionAlert) {
            Button("OK", role: .cancel) {}
            Button("Open Settings") {
                if let settingsURL = URL(string: UIApplication.openSettingsURLString) {
                    UIApplication.shared.open(settingsURL)
                }
            }
        } message: {
            Text("Please allow microphone and speech recognition access in Settings to record your memories.")
        }
    }

    func toggleRecording() {
        if recordingManager.isRecording {
            stopRecording()
        } else {
            startRecording()
        }
    }

    func startRecording() {
        pulseAnimation = true

        Task {
            do {
                try await recordingManager.startRecording()

                // Haptic feedback
                await MainActor.run {
                    let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
                    impactFeedback.impactOccurred()
                }
            } catch {
                await MainActor.run {
                    pulseAnimation = false
                    showingPermissionAlert = true
                }
            }
        }
    }

    func stopRecording() {
        pulseAnimation = false

        Task {
            let segment = await recordingManager.stopRecording()

            // Haptic feedback
            await MainActor.run {
                let impactFeedback = UIImpactFeedbackGenerator(style: .light)
                impactFeedback.impactOccurred()

                // Store segment
                completedSegment = segment

                // Validate we captured audio
                let hasAudio = segment != nil
                    && !segment!.transcription.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                    && segment!.duration > 1.0

                if hasAudio {
                    // Show recording complete screen
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                        showingRecordingComplete = true
                    }
                } else {
                    print("[HomeView] No audio captured")
                }
            }
        }
    }

    func formatDuration(_ duration: TimeInterval) -> String {
        let minutes = Int(duration) / 60
        let seconds = Int(duration) % 60
        return String(format: "%02d:%02d", minutes, seconds)
    }
}

// MARK: - Help View Placeholder
struct HelpView: View {
    @Environment(\.dismiss) var dismiss

    var body: some View {
        ZStack {
            DesignSystem.backgroundBeige
                .ignoresSafeArea()

            VStack(spacing: 20) {
                Text("Help & Support")
                    .font(DesignSystem.largeTitle)
                    .foregroundColor(DesignSystem.textPrimary)

                Text("This is the help view - coming soon!")
                    .font(DesignSystem.body)
                    .foregroundColor(DesignSystem.textSecondary)

                Spacer()
            }
            .padding()
        }
        .navigationBarBackButtonHidden(true)
        .navigationBarItems(leading: BackButton())
    }
}

// MARK: - Back Button Component
struct BackButton: View {
    @Environment(\.dismiss) var dismiss

    var body: some View {
        Button(action: { dismiss() }) {
            HStack(spacing: 8) {
                Image(systemName: "chevron.left")
                    .font(.system(size: 20, weight: .medium))
                Text("Back")
                    .font(DesignSystem.body)
            }
            .foregroundColor(DesignSystem.primaryTeal)
        }
    }
}

// MARK: - Preview
struct HomeView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationStack {
            HomeView()
                .environmentObject(RecordingManager())
        }
    }
}
