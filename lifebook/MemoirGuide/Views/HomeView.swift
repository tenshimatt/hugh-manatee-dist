import SwiftUI
import AVFoundation

// MARK: - Home View (Continuous Recording Mode)
struct HomeView: View {
    @AppStorage("userName") private var userName = "Friend"

    // New Services for Continuous Recording
    @StateObject private var continuousRecording = ContinuousRecordingService.shared
    @StateObject private var silenceDetection = SilenceDetectionService.shared
    @StateObject private var conversationManager = ConversationManagerService.shared
    @StateObject private var hughVoice = HughVoiceService.shared

    @State private var showingPermissionAlert = false
    @State private var screenHeight: CGFloat = 0

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
        GeometryReader { geometry in
            ZStack {
                DesignSystem.backgroundBeige
                    .ignoresSafeArea()

                VStack(spacing: 0) {
                    // 10% Top Safe Space
                    Spacer()
                        .frame(height: geometry.size.height * 0.10)

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
                    }
                    .padding(.bottom, 20)

                    // Hugh Speaking Indicator
                    if hughVoice.isSpeaking {
                        HStack(spacing: 12) {
                            Image(systemName: "waveform")
                                .font(.title2)
                                .foregroundColor(DesignSystem.amber)
                            Text("Hugh is speaking...")
                                .font(DesignSystem.body)
                                .foregroundColor(DesignSystem.textSecondary)
                        }
                        .padding()
                        .background(Color.white.opacity(0.9))
                        .cornerRadius(DesignSystem.cardCornerRadius)
                        .padding(.horizontal, DesignSystem.largePadding)
                        .transition(.opacity)
                    }

                    // Live Conversation View
                    ScrollViewReader { proxy in
                        ScrollView {
                            VStack(alignment: .leading, spacing: 16) {
                                ForEach(conversationManager.conversationHistory) { message in
                                    if message.speaker == .user {
                                        UserMessageBubble(text: message.text)
                                    } else {
                                        HughMessageBubble(text: message.text)
                                    }
                                }

                                // Show current live transcription
                                if !continuousRecording.currentTranscription.isEmpty && continuousRecording.conversationState == .listening {
                                    UserMessageBubble(
                                        text: continuousRecording.currentTranscription,
                                        isLive: true
                                    )
                                    .id("live-transcription")
                                }
                            }
                            .padding()
                        }
                        .frame(maxHeight: geometry.size.height * 0.50)
                        .background(Color.white.opacity(0.5))
                        .cornerRadius(DesignSystem.cardCornerRadius)
                        .padding(.horizontal, DesignSystem.largePadding)
                        .onChange(of: conversationManager.conversationHistory.count) { _ in
                            // Auto-scroll to latest message
                            if let lastMessage = conversationManager.conversationHistory.last {
                                withAnimation {
                                    proxy.scrollTo(lastMessage.id, anchor: .bottom)
                                }
                            }
                        }
                        .onChange(of: continuousRecording.currentTranscription) { _ in
                            // Auto-scroll to live transcription
                            withAnimation {
                                proxy.scrollTo("live-transcription", anchor: .bottom)
                            }
                        }
                    }

                    Spacer()

                    // Icon-Only Navigation (📖 Stories, 😊 Me)
                    HStack(spacing: 60) {
                        NavigationLink(destination: StoriesListView()) {
                            VStack(spacing: 8) {
                                Image(systemName: "book.fill")
                                    .font(.system(size: 44))
                                    .foregroundColor(DesignSystem.amber)
                                Text("My Stories")
                                    .font(DesignSystem.caption)
                                    .foregroundColor(DesignSystem.textSecondary)
                            }
                        }
                        .accessibilityIdentifier("myStoriesButton")

                        NavigationLink(destination: ProfileProgressView()) {
                            VStack(spacing: 8) {
                                Image(systemName: "face.smiling.fill")
                                    .font(.system(size: 44))
                                    .foregroundColor(.purple)
                                Text("Me")
                                    .font(DesignSystem.caption)
                                    .foregroundColor(DesignSystem.textSecondary)
                            }
                        }
                        .accessibilityIdentifier("meButton")
                    }
                    .padding(.vertical, 20)

                    // 10% Bottom Safe Space
                    Spacer()
                        .frame(height: geometry.size.height * 0.10)
                }
            }
            .onAppear {
                screenHeight = geometry.size.height
                startContinuousRecording()
            }
            .onDisappear {
                stopContinuousRecording()
            }
        }
        .navigationBarHidden(true)
        .alert("Microphone Permission Required", isPresented: $showingPermissionAlert) {
            Button("OK", role: .cancel) {}
            Button("Open Settings") {
                if let settingsURL = URL(string: UIApplication.openSettingsURLString) {
                    UIApplication.shared.open(settingsURL)
                }
            }
        } message: {
            Text("Please allow microphone and speech recognition access in Settings to use Hugh Manatee.")
        }
    }

    // MARK: - Actions

    func startContinuousRecording() {
        Task {
            do {
                // Start continuous recording
                try await continuousRecording.startContinuousRecording()

                // Start silence detection
                await silenceDetection.startMonitoring(audioRecorder: continuousRecording.audioRecorder)

                // Start conversation flow
                await conversationManager.startConversationFlow()

                print("[HomeView] Continuous recording started successfully")
            } catch {
                print("[HomeView] Failed to start continuous recording: \(error)")
                await MainActor.run {
                    showingPermissionAlert = true
                }
            }
        }
    }

    func stopContinuousRecording() {
        Task {
            await continuousRecording.stopContinuousRecording()
            await silenceDetection.stopMonitoring()
            await conversationManager.stopConversationFlow()
            print("[HomeView] Continuous recording stopped")
        }
    }
}

// MARK: - Message Bubbles

struct UserMessageBubble: View {
    let text: String
    var isLive: Bool = false

    var body: some View {
        HStack {
            Spacer()
            VStack(alignment: .trailing, spacing: 4) {
                Text(text)
                    .font(DesignSystem.body)
                    .foregroundColor(.white)
                    .padding(12)
                    .background(DesignSystem.amber.opacity(isLive ? 0.7 : 1.0))
                    .cornerRadius(16)
                    .frame(maxWidth: 280, alignment: .trailing)

                if isLive {
                    Text("typing...")
                        .font(DesignSystem.caption)
                        .foregroundColor(DesignSystem.textSecondary)
                }
            }
        }
    }
}

struct HughMessageBubble: View {
    let text: String

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 8) {
                    Image(systemName: "face.smiling.fill")
                        .foregroundColor(.purple)
                    Text("Hugh")
                        .font(DesignSystem.caption)
                        .foregroundColor(DesignSystem.textSecondary)
                }

                Text(text)
                    .font(DesignSystem.body)
                    .foregroundColor(DesignSystem.textPrimary)
                    .padding(12)
                    .background(Color.white)
                    .cornerRadius(16)
                    .frame(maxWidth: 280, alignment: .leading)
            }
            Spacer()
        }
    }
}

// MARK: - Preview
struct HomeView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            HomeView()
        }
    }
}
