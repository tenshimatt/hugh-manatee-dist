// RecordingView.swift
// Main recording interface for elderly users

import SwiftUI
import AVFoundation

struct RecordingView: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var recordingManager: RecordingManager
    @EnvironmentObject var ai: AIInterviewer
    @EnvironmentObject var cloudKit: CloudKitManager
    
    @State private var isFirstTap = true
    @State private var showingPrompt = false
    @State private var currentPrompt = ""
    @State private var pulseAnimation = false
    
    var body: some View {
        VStack(spacing: 0) {
            // AI Prompt Area
            VStack {
                if showingPrompt {
                    HStack {
                        Image(systemName: "mic.circle.fill")
                            .foregroundColor(.blue)
                            .font(.title2)
                        
                        Text(currentPrompt)
                            .font(.custom("Georgia", size: 20))
                            .foregroundColor(.primary)
                            .multilineTextAlignment(.leading)
                            .animation(.easeInOut, value: currentPrompt)
                    }
                    .padding()
                    .background(Color.white)
                    .cornerRadius(15)
                    .shadow(radius: 2)
                    .padding()
                }
                
                Spacer()
            }
            .frame(height: UIScreen.main.bounds.height * 0.25)
            
            // Transcription Area
            ScrollViewReader { proxy in
                ScrollView {
                    Text(recordingManager.currentTranscription)
                        .font(.custom("Georgia", size: 18))
                        .foregroundColor(.primary)
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .id("transcription")
                }
                .frame(height: UIScreen.main.bounds.height * 0.35)
                .background(Color.white.opacity(0.5))
                .onChange(of: recordingManager.currentTranscription) { _ in
                    withAnimation {
                        proxy.scrollTo("transcription", anchor: .bottom)
                    }
                }
            }
            
            // Recording Button
            VStack {
                Button(action: handleButtonTap) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 25)
                            .fill(recordingManager.isRecording ? Color.red : Color(hex: "4A7C59"))
                            .frame(width: 280, height: 120)
                            .overlay(
                                RoundedRectangle(cornerRadius: 25)
                                    .stroke(recordingManager.isRecording ? Color.red : Color.clear, lineWidth: 3)
                                    .scaleEffect(pulseAnimation ? 1.05 : 1.0)
                                    .opacity(pulseAnimation ? 0.5 : 1.0)
                            )
                        
                        VStack(spacing: 8) {
                            if recordingManager.isRecording {
                                Image(systemName: "pause.fill")
                                    .font(.system(size: 40))
                                    .foregroundColor(.white)
                                Text("Recording")
                                    .font(.title2)  // iOS system font
                                    .fontWeight(.semibold)
                                    .foregroundColor(.white)
                                Text(formatTime(recordingManager.recordingDuration))
                                    .font(.title3)  // iOS system font
                                    .foregroundColor(.white.opacity(0.9))
                            } else {
                                Text(isFirstTap ? "Tap to start" : "Tap to continue")
                                    .font(.title)  // iOS system font
                                    .fontWeight(.semibold)
                                    .foregroundColor(.white)
                            }
                        }
                    }
                }
                .buttonStyle(PressedButtonStyle())
                
                // Audio level indicator
                if recordingManager.isRecording {
                    AudioLevelView(level: recordingManager.audioLevel)
                        .frame(width: 280, height: 6)
                        .padding(.top, 10)
                }
            }
            .frame(height: UIScreen.main.bounds.height * 0.3)
            
            // Bottom navigation
            HStack {
                Button(action: { appState.currentView = .library }) {
                    HStack {
                        Image(systemName: "books.vertical")
                        Text("View Stories")
                    }
                    .font(.system(size: 18))
                    .foregroundColor(Color(hex: "5B8BA0"))
                    .padding()
                }
                
                Spacer()
                
                Button(action: showHelp) {
                    HStack {
                        Image(systemName: "questionmark.circle")
                        Text("Help")
                    }
                    .font(.system(size: 18))
                    .foregroundColor(Color(hex: "5B8BA0"))
                    .padding()
                }
            }
            .frame(height: UIScreen.main.bounds.height * 0.1)
            .padding(.horizontal)
        }
        .onAppear {
            setupInitialPrompt()
            startPulseAnimation()
        }
    }
    
    private func handleButtonTap() {
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
                    // Continue conversation
                    currentPrompt = "Let's continue where we left off..."
                }
                
                showingPrompt = true
                speakPrompt(currentPrompt)
                
            } catch {
                appState.error = error as? AppError ?? AppError.microphonePermissionDenied
            }
        }
    }
    
    private func stopRecording() {
        Task {
            if let segment = await recordingManager.stopRecording() {
                // Save to CloudKit
                try? await cloudKit.save(segment)
                
                // Generate follow-up
                let followUp = try? await ai.generateFollowUp(from: segment.transcription)
                currentPrompt = followUp ?? ""
                
                // Check for chapter break
                if await ai.shouldCreateChapterBreak(after: [segment]) {
                    await createNewChapter()
                }
            }
        }
    }
    
    private func setupInitialPrompt() {
        Task {
            currentPrompt = await ai.getInitialPrompt()
            showingPrompt = true
        }
    }
    
    private func speakPrompt(_ text: String) {
        let utterance = AVSpeechUtterance(string: text)
        utterance.rate = 0.5
        utterance.voice = AVSpeechSynthesisVoice(language: "en-US")
        
        let synthesizer = AVSpeechSynthesizer()
        synthesizer.speak(utterance)
    }
    
    private func startPulseAnimation() {
        withAnimation(.easeInOut(duration: 1).repeatForever(autoreverses: true)) {
            pulseAnimation = true
        }
    }
    
    private func formatTime(_ seconds: TimeInterval) -> String {
        let minutes = Int(seconds) / 60
        let seconds = Int(seconds) % 60
        return String(format: "%02d:%02d", minutes, seconds)
    }
    
    private func showHelp() {
        // Implement help/contact family
    }
    
    private func createNewChapter() async {
        // Create new chapter logic
    }
}

// MARK: - Supporting Views

struct PressedButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

struct AudioLevelView: View {
    let level: Float
    
    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 3)
                    .fill(Color.gray.opacity(0.3))
                
                RoundedRectangle(cornerRadius: 3)
                    .fill(LinearGradient(
                        colors: [.green, .yellow, .red],
                        startPoint: .leading,
                        endPoint: .trailing
                    ))
                    .frame(width: geometry.size.width * CGFloat(level))
                    .animation(.linear(duration: 0.1), value: level)
            }
        }
    }
}
