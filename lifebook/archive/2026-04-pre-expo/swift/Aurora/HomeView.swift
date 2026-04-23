import SwiftUI
import AVFoundation

// MARK: - Home View
struct HomeView: View {
    @AppStorage("userName") private var userName = ""

    // Real Services
    @StateObject private var continuousRecording = ContinuousRecordingService.shared
    @StateObject private var conversationManager = ConversationManagerService.shared
    @StateObject private var silenceDetection = SilenceDetectionService.shared
    @StateObject private var promptService = AIPromptService.shared
    @StateObject private var hughVoice = HughVoiceService.shared

    @State private var hasGreetedUser = false
    
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
                    Color.clear
                        .frame(height: geometry.size.height * 0.10)

                    // Header - Greeting
                    VStack(spacing: 4) {
                        Text(greeting + ",")
                            .font(DesignSystem.largeTitle)
                            .foregroundColor(DesignSystem.textPrimary)
                        Text(userName)
                            .font(DesignSystem.largeTitle)
                            .foregroundColor(DesignSystem.textPrimary)
                    }
                    .padding(.vertical, 12)

                    // AI-Generated Rotating Prompt
                    VStack(spacing: 12) {
                        HStack(spacing: 8) {
                            Image(systemName: "sparkles")
                                .font(.caption)
                                .foregroundColor(DesignSystem.amber)

                            Text("Today's Prompt")
                                .font(DesignSystem.caption)
                                .foregroundColor(DesignSystem.textSecondary)

                            Spacer()

                            Image(systemName: "arrow.triangle.2.circlepath")
                                .font(.caption2)
                                .foregroundColor(DesignSystem.textSecondary.opacity(0.6))
                        }

                        Text(promptService.currentPrompt)
                            .font(DesignSystem.title)
                            .foregroundColor(DesignSystem.amber)
                            .multilineTextAlignment(.center)
                            .lineLimit(nil)
                            .fixedSize(horizontal: false, vertical: true)
                            .frame(maxWidth: .infinity)
                            .transition(.opacity.combined(with: .scale(scale: 0.95)))
                            .id(promptService.currentPrompt)
                    }
                    .padding(.horizontal, 20)
                    .padding(.vertical, 16)
                    .background(
                        RoundedRectangle(cornerRadius: DesignSystem.cardCornerRadius)
                            .fill(DesignSystem.warmCardGradient)
                    )
                    .shadow(color: DesignSystem.amberGlow, radius: 12, y: 6)
                    .padding(.horizontal, DesignSystem.largePadding)
                    .padding(.bottom, 16)

                    // Live Conversation Transcript
                    ScrollViewReader { proxy in
                        ScrollView {
                            VStack(alignment: .leading, spacing: 16) {
                                // Display conversation history
                                ForEach(conversationManager.conversationHistory) { message in
                                    if message.speaker == .user {
                                        UserMessageBubble(text: message.text)
                                            .id(message.id)
                                    } else {
                                        HughMessageBubble(
                                            text: message.text,
                                            isSpeaking: conversationManager.isHughSpeaking
                                        )
                                        .id(message.id)
                                    }
                                }

                                // Display live transcription as user speaks
                                if !continuousRecording.currentTranscription.isEmpty && !conversationManager.isHughSpeaking {
                                    UserMessageBubble(text: continuousRecording.currentTranscription)
                                        .opacity(0.7) // Show as in-progress
                                        .id("live-transcription")
                                }
                            }
                            .padding(.horizontal, DesignSystem.largePadding)
                            .padding(.vertical, 16)
                        }
                        .onChange(of: conversationManager.conversationHistory.count) { _ in
                            // Auto-scroll to latest message
                            if let lastMessage = conversationManager.conversationHistory.last {
                                withAnimation {
                                    proxy.scrollTo(lastMessage.id, anchor: .bottom)
                                }
                            }
                        }
                        .onChange(of: continuousRecording.currentTranscription) { _ in
                            // Auto-scroll during live transcription
                            if !continuousRecording.currentTranscription.isEmpty {
                                withAnimation {
                                    proxy.scrollTo("live-transcription", anchor: .bottom)
                                }
                            }
                        }
                    }

                    Spacer()

                    // Icon-Only Navigation
                    HStack(spacing: 60) {
                        NavigationLink(destination: StoriesListView()) {
                            Image(systemName: "book.fill")
                                .font(.system(size: 36))
                                .foregroundColor(DesignSystem.amber)
                                .frame(width: 60, height: 60)
                        }
                        .accessibilityLabel("My Stories")
                        .accessibilityIdentifier("myStoriesButton")

                        NavigationLink(destination: ProfileProgressView()) {
                            Image(systemName: "face.smiling.fill")
                                .font(.system(size: 36))
                                .foregroundColor(DesignSystem.sunsetOrange)
                                .frame(width: 60, height: 60)
                        }
                        .accessibilityLabel("About Me")
                        .accessibilityIdentifier("aboutMeButton")
                    }
                    .padding(.vertical, 20)

                    // 10% Bottom Safe Space
                    Color.clear
                        .frame(height: geometry.size.height * 0.10)
                }
            }
            .navigationBarHidden(true)
            .onAppear {
                // Start continuous recording and greet user (only once per session)
                if !hasGreetedUser {
                    hasGreetedUser = true
                    Task {
                        do {
                            // Start continuous recording first
                            print("🎙️ [HomeView] Starting continuous recording...")
                            try await continuousRecording.startContinuousRecording()

                            // Start silence detection monitoring
                            if let recorder = continuousRecording.audioRecorder {
                                print("🔇 [HomeView] Starting silence detection...")
                                await silenceDetection.startMonitoring(audioRecorder: recorder)
                            }

                            // Small delay so user sees the screen first
                            try? await Task.sleep(nanoseconds: 1_500_000_000) // 1.5 seconds

                            // Hugh welcomes the user
                            print("🦭 [HomeView] Hugh welcoming user...")
                            await hughVoice.welcomeUser()

                            print("✅ [HomeView] All services started successfully")
                        } catch {
                            print("❌ [HomeView] Failed to start services: \(error.localizedDescription)")
                        }
                    }
                }
            }
            .onDisappear {
                // Clean up when view disappears
                Task {
                    await continuousRecording.stopContinuousRecording()
                    await silenceDetection.stopMonitoring()
                }
            }
        }
    }

}

// MARK: - User Message Bubble Component
struct UserMessageBubble: View {
    let text: String

    var body: some View {
        HStack {
            Spacer(minLength: 60)

            Text(text)
                .font(DesignSystem.body)
                .foregroundColor(.white)
                .padding(.horizontal, 20)
                .padding(.vertical, 14)
                .background(
                    RoundedRectangle(cornerRadius: 20)
                        .fill(DesignSystem.amber)
                )
                .shadow(color: DesignSystem.amberGlow, radius: 4, y: 2)
                .frame(maxWidth: .infinity, alignment: .trailing)
        }
    }
}

// MARK: - Hugh Message Bubble Component
struct HughMessageBubble: View {
    let text: String
    let isSpeaking: Bool

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 8) {
                    Text("Hugh")
                        .font(DesignSystem.caption)
                        .foregroundColor(DesignSystem.textSecondary)

                    if isSpeaking {
                        if #available(iOS 17.0, *) {
                            Image(systemName: "waveform")
                                .font(.caption)
                                .foregroundColor(DesignSystem.amber)
                                .symbolEffect(.variableColor.iterative)
                        } else {
                            Image(systemName: "waveform")
                                .font(.caption)
                                .foregroundColor(DesignSystem.amber)
                        }
                    }
                }

                Text(text)
                    .font(DesignSystem.body)
                    .foregroundColor(DesignSystem.textPrimary)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 14)
                    .background(
                        RoundedRectangle(cornerRadius: 20)
                            .fill(DesignSystem.whiteSubtleGradient)
                    )
                    .shadow(color: DesignSystem.amberGlow, radius: 6, y: 3)
            }

            Spacer(minLength: 60)
        }
    }
}

// MARK: - Preview
struct HomeView_Previews: PreviewProvider {
    static var previews: some View {
        HomeView()
    }
}
