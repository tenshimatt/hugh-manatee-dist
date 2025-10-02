// AccessibleRecordingView.swift
// Accessibility-first recording interface for elderly users
// WCAG AAA compliant with Dynamic Type and VoiceOver support

import SwiftUI
import AVFoundation

struct AccessibleRecordingView: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var recordingManager: RecordingManager
    @EnvironmentObject var ai: AIInterviewer
    @EnvironmentObject var cloudKit: CloudKitManager
    @EnvironmentObject var coreDataManager: CoreDataManager
    @EnvironmentObject var themeManager: ThemeManager

    @State private var isFirstTap = true
    @State private var showingPrompt = false
    @State private var currentPrompt = ""
    @State private var pulseAnimation = false
    @State private var hapticFeedback = UIImpactFeedbackGenerator(style: .medium)

    // Story assignment
    @State private var showingStoryAssignment = false
    @State private var completedSegment: MemoirSegmentEntity?
    @State private var completedTranscription = ""

    // Help popup (Bug 13)
    @State private var showingHelp = false

    // API key (should be moved to secure storage in production)
    private let anthropicAPIKey = "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"

    // Accessibility settings
    @Environment(\.appTheme) var theme
    @Environment(\.colorScheme) var colorScheme
    @Environment(\.dynamicTypeSize) var dynamicTypeSize
    @AccessibilityFocusState private var isRecordButtonFocused: Bool
    @ScaledMetric var baseFontSize: CGFloat = 17

    private var isLargeText: Bool {
        dynamicTypeSize >= .xLarge
    }

    private var primaryButtonColor: Color {
        recordingManager.isRecording ? .red : theme.primary
    }
    
    var body: some View {
        ZStack {
            // Modern gradient background
            LinearGradient(
                colors: [
                    theme.background,
                    theme.background.opacity(0.95)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: isLargeText ? 8 : 16) {
                // Header with theme switcher
                headerSection

                // Bug 18 fix: 10% space above Hello intro text (was 15%)
                Spacer()
                    .frame(height: UIScreen.main.bounds.height * 0.10)

                // AI Prompt Area - Top Priority for Screen Readers
                aiPromptSection
                    .accessibilityElement(children: .contain)
                    .accessibilityLabel("AI Conversation Guide")

                Spacer()

                // Main Recording Button - 120pt minimum touch target for elderly users
                recordingButtonSection
                    .accessibilityFocused($isRecordButtonFocused)

                Spacer()

                // Live Transcription Display
                transcriptionSection
                    .accessibilityElement(children: .contain)
                    .accessibilityLabel("Live transcription of your speech")

                // Status Information
                statusSection

                // Navigation Controls
                navigationSection
            }
            .padding(.horizontal, 20)
        }
        .onAppear {
            setupAccessibility()
            setupInitialPrompt()
            startPulseAnimation()
        }
        .onChange(of: recordingManager.isRecording) { _ in
            provideHapticFeedback()
            announceRecordingStateChange()
        }
        .onChange(of: themeManager.currentTheme) { _ in
            // Announce theme change for VoiceOver
            UIAccessibility.post(notification: .announcement, argument: "Theme changed to \(themeManager.currentTheme.name)")
        }
        .sheet(isPresented: $showingStoryAssignment) {
            if let segment = completedSegment {
                StoryAssignmentView(
                    segment: segment,
                    rawTranscription: completedTranscription,
                    apiKey: anthropicAPIKey
                )
                .environmentObject(appState)
                .environmentObject(coreDataManager)
                .environment(\.managedObjectContext, coreDataManager.context)
            }
        }
        .sheet(isPresented: $showingHelp) {
            HelpPopupView()
        }
    }

    // MARK: - Header Section with Theme Switcher
    private var headerSection: some View {
        HStack {
            Spacer()

            // Theme switcher button (Bug 20)
            ThemeSwitcherButton()
                .environmentObject(themeManager)
        }
        .padding(.top, 8)
        .padding(.horizontal, 4)
    }
    
    // MARK: - AI Prompt Section (Bug 1 & 2 fixes, Bug 19 modern styling)
    private var aiPromptSection: some View {
        VStack(spacing: 12) {
            // Bug 2 fix: Always show prompt (removed showingPrompt condition)
            if !currentPrompt.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    // Bug 19 fix: Modern card design with theme colors
                    Text(currentPrompt)
                        .font(.title3)
                        .fontWeight(.medium)
                        .foregroundColor(theme.textPrimary)
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: .infinity)
                        .padding(.horizontal, 24)
                        .padding(.vertical, 20)
                        .background(theme.surface)
                        .cornerRadius(20)
                        .shadow(color: theme.primary.opacity(0.15), radius: 12, x: 0, y: 6)
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
                        .accessibilityLabel("AI conversation prompt: \(currentPrompt)")
                        .accessibilityAddTraits(.isStaticText)
                }
                .animation(.spring(response: 0.5, dampingFraction: 0.7), value: currentPrompt)
                .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .frame(minHeight: 80)
    }
    
    // MARK: - Recording Button Section (Bug 4 & 6 fixes, Bug 19 modern styling)
    private var recordingButtonSection: some View {
        VStack(spacing: 16) {
            Button(action: handleButtonTap) {
                ZStack {
                    // Bug 19 fix: Modern gradient button with clean lines
                    RoundedRectangle(cornerRadius: 24)
                        .fill(
                            LinearGradient(
                                colors: recordingManager.isRecording ?
                                    [Color.red, Color.red.opacity(0.8)] :
                                    [theme.primary, theme.primary.opacity(0.85)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: UIScreen.main.bounds.width * 0.8, height: 120) // 80% width standard
                        .overlay(
                            RoundedRectangle(cornerRadius: 24)
                                .stroke(
                                    Color.white.opacity(0.2),
                                    lineWidth: 2
                                )
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 24)
                                .stroke(primaryButtonColor.opacity(0.4), lineWidth: 3)
                                .scaleEffect(pulseAnimation && !recordingManager.isRecording ? 1.05 : 1.0)
                                .opacity(pulseAnimation && !recordingManager.isRecording ? 0.0 : 1.0)
                        )
                        .shadow(color: primaryButtonColor.opacity(0.4), radius: 16, x: 0, y: 8)

                    // Button content (Bugs 10 & 11: new text, icon on right, 30% smaller)
                    if recordingManager.isRecording {
                        VStack(spacing: 8) {
                            Image(systemName: "stop.fill")
                                .font(.system(size: 48, weight: .regular))
                                .foregroundColor(.white)
                                .accessibilityHidden(true)

                            Text("Stop recording")
                                .font(.title2)  // iOS system font
                                .fontWeight(.semibold)
                                .foregroundColor(.white)

                            Text(formatTime(recordingManager.recordingDuration))
                                .font(.title3)  // iOS system font
                                .foregroundColor(.white.opacity(0.9))
                        }
                    } else {
                        // Bug 10 & 11 fix: Centered text with smaller icon on right
                        HStack(spacing: 12) {
                            Spacer()

                            Text(isFirstTap ? "Tap to start recording your story" : "Continue recording")
                                .font(.title3)  // iOS system font
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                                .multilineTextAlignment(.center)
                                .minimumScaleFactor(0.8)

                            Image(systemName: "mic.fill")
                                .font(.system(size: 33.6, weight: .regular))  // 30% smaller than 48 = 33.6
                                .foregroundColor(.white)
                                .accessibilityHidden(true)

                            Spacer()
                        }
                        .padding(.horizontal, 16)
                    }
                }
            }
            .accessibilityLabel(recordingManager.isRecording ?
                "Stop recording. Currently recording for \(formatTime(recordingManager.recordingDuration))" :
                (isFirstTap ? "Start recording your story" : "Continue recording"))
            .accessibilityHint(recordingManager.isRecording ?
                "Double tap to stop recording and save your story" :
                "Double tap to begin recording your story")
            .accessibilityAddTraits(.isButton)
            .buttonStyle(AccessibleButtonStyle())
            
            // Audio level indicator for recording
            if recordingManager.isRecording {
                AccessibleAudioLevelView(level: recordingManager.audioLevel)
                    .frame(width: 300, height: 12)
                    .accessibilityLabel("Audio level indicator")
                    .accessibilityValue("Audio level at \\(Int(recordingManager.audioLevel * 100)) percent")
            }
        }
    }
    
    // MARK: - Transcription Section (Bug 19 modern styling)
    private var transcriptionSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "text.alignleft")
                    .foregroundColor(theme.accent)
                    .accessibilityHidden(true)

                Text("Live Transcription")
                    .font(.headline)
                    .foregroundColor(theme.textPrimary)
            }

            ScrollViewReader { proxy in
                ScrollView {
                    VStack(alignment: .leading, spacing: 8) {
                        if recordingManager.currentTranscription.isEmpty && recordingManager.isRecording {
                            Text("Listening...")
                                .font(.body)
                                .foregroundColor(theme.textSecondary)
                                .italic()
                        } else if recordingManager.currentTranscription.isEmpty {
                            Text("Your words will appear here when you start recording")
                                .font(.body)
                                .foregroundColor(theme.textSecondary)
                        } else {
                            Text(recordingManager.currentTranscription)
                                .font(.body)
                                .foregroundColor(theme.textPrimary)
                                .textSelection(.enabled)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    .id("transcription")
                }
                .frame(minHeight: 100, maxHeight: 200)
                .background(theme.surface)
                .cornerRadius(16)
                .shadow(color: theme.primary.opacity(0.08), radius: 8, x: 0, y: 4)
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(
                            LinearGradient(
                                colors: [theme.primary.opacity(0.2), theme.secondary.opacity(0.2)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 1
                        )
                )
                .onChange(of: recordingManager.currentTranscription) { _ in
                    withAnimation(.easeInOut(duration: 0.3)) {
                        proxy.scrollTo("transcription", anchor: .bottom)
                    }
                }
            }
        }
        .accessibilityElement(children: .contain)
    }
    
    // MARK: - Status Section
    private var statusSection: some View {
        VStack(spacing: 8) {
            // Auto-save status
            if recordingManager.lastAutoSave != nil {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                        .accessibilityHidden(true)

                    Text("Auto-saved at \\(recordingManager.lastAutoSave!, style: .time)")
                        .font(.caption)
                        .foregroundColor(theme.textSecondary)
                }
                .accessibilityLabel("Last auto-save at \\(recordingManager.lastAutoSave!, style: .time)")
            }
            
            // Error status
            if let error = recordingManager.recordingError {
                HStack {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(.orange)
                        .accessibilityHidden(true)
                    
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.orange)
                }
                .accessibilityLabel("Warning: \\(error)")
            }
        }
    }
    
    // MARK: - Navigation Section (Bug 19 modern styling)
    private var navigationSection: some View {
        HStack(spacing: 40) {
            Button(action: {
                appState.currentView = .library
                announceNavigation("Stories library")
            }) {
                VStack(spacing: 6) {
                    Image(systemName: "books.vertical.fill")
                        .font(.title2)
                        .accessibilityHidden(true)
                    Text("My Stories")
                        .font(.caption)
                }
                .foregroundColor(theme.primary)
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(theme.primary.opacity(0.1))
                .cornerRadius(12)
            }
            .accessibilityLabel("View my stories")
            .accessibilityHint("Double tap to see your recorded stories")

            Spacer()

            Button(action: showHelp) {
                VStack(spacing: 6) {
                    Image(systemName: "questionmark.circle.fill")
                        .font(.title2)
                        .accessibilityHidden(true)
                    Text("Help")
                        .font(.caption)
                }
                .foregroundColor(theme.secondary)
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(theme.secondary.opacity(0.1))
                .cornerRadius(12)
            }
            .accessibilityLabel("Get help")
            .accessibilityHint("Double tap for help and support")
        }
        .padding(.bottom, 8)
    }
    
    // MARK: - Private Methods
    
    private func handleButtonTap() {
        hapticFeedback.impactOccurred()
        
        if recordingManager.isRecording {
            stopRecording()
        } else {
            startRecording()
        }
    }
    
    private func startRecording() {
        Task {
            do {
                try await recordingManager.startRecording()
                isFirstTap = false
                
                // Generate AI prompt
                if ai.conversationHistory.isEmpty {
                    currentPrompt = await ai.getInitialPrompt()
                } else {
                    currentPrompt = await ai.generateSilencePrompt(afterSeconds: 3)
                }
                
                showingPrompt = true
                speakPrompt(currentPrompt)
                
            } catch {
                appState.error = error as? AppError ?? AppError.recordingFailed
                announceError("Recording failed to start")
            }
        }
    }
    
    private func stopRecording() {
        Task {
            let transcription = recordingManager.currentTranscription
            _ = await recordingManager.stopRecording()

            // Get the most recent segment from Core Data
            let segments = coreDataManager.fetchRecentSegments(limit: 1)

            await MainActor.run {
                if let segment = segments.first {
                    completedSegment = segment
                    completedTranscription = transcription
                    showingStoryAssignment = true
                    announceSuccess("Recording complete. Creating your story...")
                }
            }
        }
    }
    
    private func setupInitialPrompt() {
        Task {
            currentPrompt = await ai.getInitialPrompt()
            withAnimation(.easeInOut(duration: 0.5)) {
                showingPrompt = true
            }
        }
    }
    
    private func setupAccessibility() {
        // Focus on record button for new users
        if isFirstTap {
            DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                isRecordButtonFocused = true
            }
        }
    }
    
    private func speakPrompt(_ text: String) {
        // Only speak if VoiceOver is not running to avoid conflicts
        guard !UIAccessibility.isVoiceOverRunning else { return }
        
        let utterance = AVSpeechUtterance(string: text)
        utterance.rate = AVSpeechUtteranceDefaultSpeechRate * 0.8 // Slower for elderly
        utterance.voice = AVSpeechSynthesisVoice(language: "en-US")
        
        let synthesizer = AVSpeechSynthesizer()
        synthesizer.speak(utterance)
    }
    
    private func startPulseAnimation() {
        withAnimation(.easeInOut(duration: 2).repeatForever(autoreverses: true)) {
            pulseAnimation = true
        }
    }
    
    private func formatTime(_ seconds: TimeInterval) -> String {
        let hours = Int(seconds) / 3600
        let minutes = Int(seconds) % 3600 / 60
        let seconds = Int(seconds) % 60
        
        if hours > 0 {
            return String(format: "%d:%02d:%02d", hours, minutes, seconds)
        } else {
            return String(format: "%02d:%02d", minutes, seconds)
        }
    }
    
    private func provideHapticFeedback() {
        hapticFeedback.impactOccurred()
    }
    
    private func announceRecordingStateChange() {
        let announcement = recordingManager.isRecording ? 
            "Recording started" : "Recording stopped"
        UIAccessibility.post(notification: .announcement, argument: announcement)
    }
    
    private func announceNavigation(_ destination: String) {
        UIAccessibility.post(notification: .announcement, argument: "Navigating to \\(destination)")
    }
    
    private func announceSuccess(_ message: String) {
        UIAccessibility.post(notification: .announcement, argument: message)
    }
    
    private func announceError(_ message: String) {
        UIAccessibility.post(notification: .announcement, argument: message)
    }
    
    private func showHelp() {
        showingHelp = true
        announceNavigation("Help system")
    }
}

// MARK: - Supporting Views and Styles

struct AccessibleButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

struct AccessibleAudioLevelView: View {
    let level: Float
    
    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                // Background
                RoundedRectangle(cornerRadius: 6)
                    .fill(Color.gray.opacity(0.3))
                
                // Active level
                RoundedRectangle(cornerRadius: 6)
                    .fill(LinearGradient(
                        colors: level < 0.3 ? [.green] : level < 0.7 ? [.green, .yellow] : [.green, .yellow, .red],
                        startPoint: .leading,
                        endPoint: .trailing
                    ))
                    .frame(width: max(4, geometry.size.width * CGFloat(level)))
                    .animation(.linear(duration: 0.1), value: level)
            }
        }
        .overlay(
            RoundedRectangle(cornerRadius: 6)
                .stroke(Color.gray.opacity(0.5), lineWidth: 1)
        )
    }
}

// Color extension already exists in Extensions.swift

// MARK: - Help Popup View (Bug 13, Bug 19 modern styling)

struct HelpPopupView: View {
    @Environment(\.dismiss) var dismiss
    @Environment(\.appTheme) var theme

    var body: some View {
        NavigationView {
            ZStack {
                // Modern gradient background
                LinearGradient(
                    colors: [theme.background, theme.background.opacity(0.95)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                VStack(spacing: 32) {
                    // Icon
                    ZStack {
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [theme.primary, theme.secondary],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 100, height: 100)
                            .shadow(color: theme.primary.opacity(0.3), radius: 16, x: 0, y: 8)

                        Image(systemName: "person.fill.questionmark")
                            .font(.system(size: 48))
                            .foregroundColor(.white)
                    }
                    .padding(.top, 40)

                    // Help message
                    VStack(spacing: 20) {
                        Text("Hi, I am here to help you.")
                            .font(.title2)
                            .foregroundColor(theme.textPrimary)
                            .multilineTextAlignment(.center)

                        VStack(spacing: 16) {
                            Text("I can only talk at the moment but I am building a help library that you can search soon.")
                                .font(.body)
                                .foregroundColor(theme.textSecondary)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 24)

                            Text("Till then, please explain what you are having trouble with and I will explain how I can help")
                                .font(.body)
                                .foregroundColor(theme.textSecondary)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 24)
                        }
                        .padding(.horizontal, 8)
                        .padding(.vertical, 20)
                        .background(theme.surface)
                        .cornerRadius(20)
                        .shadow(color: theme.primary.opacity(0.1), radius: 12, x: 0, y: 6)
                    }

                    Spacer()

                    // Close button
                    Button(action: { dismiss() }) {
                        Text("Got it")
                            .font(.title3)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(width: UIScreen.main.bounds.width * 0.8)
                            .padding(.vertical, 18)
                            .background(
                                LinearGradient(
                                    colors: [theme.primary, theme.primary.opacity(0.85)],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .cornerRadius(16)
                            .shadow(color: theme.primary.opacity(0.3), radius: 12, x: 0, y: 6)
                    }
                    .padding(.bottom, 40)
                    .accessibilityLabel("Close help")
                    .accessibilityHint("Double tap to close help screen")
                }
                .padding(.horizontal, 20)
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Close") {
                        dismiss()
                    }
                    .foregroundColor(theme.primary)
                }
            }
        }
    }
}

// MARK: - Theme Switcher Button (Bug 20)

struct ThemeSwitcherButton: View {
    @EnvironmentObject var themeManager: ThemeManager
    @State private var isAnimating = false

    var body: some View {
        Button(action: {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                isAnimating = true
                themeManager.nextTheme()
            }

            // Haptic feedback
            let generator = UIImpactFeedbackGenerator(style: .medium)
            generator.impactOccurred()

            // Reset animation
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                isAnimating = false
            }
        }) {
            ZStack {
                // Outer circle with current theme color
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [
                                themeManager.currentTheme.primary,
                                themeManager.currentTheme.secondary
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 44, height: 44)
                    .shadow(color: themeManager.currentTheme.primary.opacity(0.4), radius: 8, x: 0, y: 4)

                // Inner icon
                Image(systemName: "paintpalette.fill")
                    .font(.system(size: 20))
                    .foregroundColor(.white)
                    .rotationEffect(.degrees(isAnimating ? 360 : 0))
            }
        }
        .accessibilityLabel("Change color theme")
        .accessibilityHint("Cycles through 5 different color themes. Currently using \(themeManager.currentTheme.name)")
    }
}

// MARK: - Theme Preview Indicator

struct ThemeIndicator: View {
    @EnvironmentObject var themeManager: ThemeManager

    var body: some View {
        HStack(spacing: 6) {
            ForEach(Array(ThemeManager.themes.enumerated()), id: \.element.id) { index, theme in
                Circle()
                    .fill(theme.id == themeManager.currentTheme.id ? theme.primary : Color.gray.opacity(0.3))
                    .frame(width: 8, height: 8)
                    .scaleEffect(theme.id == themeManager.currentTheme.id ? 1.2 : 1.0)
                    .animation(.spring(response: 0.3), value: themeManager.currentTheme.id)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(Color.black.opacity(0.05))
        .cornerRadius(20)
    }
}