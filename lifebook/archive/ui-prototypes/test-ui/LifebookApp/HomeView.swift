import SwiftUI
import AVFoundation

// MARK: - Home View
struct HomeView: View {
    @AppStorage("userName") private var userName = ""
    @State private var isRecording = false
    @State private var recordingTime: Int = 0
    @State private var showingRecordingComplete = false
    @State private var transcription = ""
    @State private var timer: Timer?
    @State private var pulseAnimation = false
    
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
                    Text("\(greeting), \(userName)")
                        .font(DesignSystem.largeTitle)
                        .foregroundColor(DesignSystem.textPrimary)
                    
                    Text("Ready to share a memory?")
                        .font(DesignSystem.body)
                        .foregroundColor(DesignSystem.textSecondary)
                }
                .padding(.top, 60)
                .padding(.bottom, 20)
                
                // Today's Prompt (Optional)
                if !isRecording {
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
                    if isRecording {
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
                            Image(systemName: isRecording ? "stop.circle.fill" : "mic.circle.fill")
                                .font(.system(size: 70))
                                .symbolRenderingMode(.hierarchical)
                            
                            if isRecording {
                                // Recording indicator
                                VStack(spacing: 5) {
                                    Text("Recording...")
                                        .font(DesignSystem.buttonText)
                                    Text(timeString(from: recordingTime))
                                        .font(DesignSystem.body)
                                        .foregroundColor(.white.opacity(0.9))
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
                            isRecording ? DesignSystem.recordRed : DesignSystem.primaryTeal
                        )
                        .clipShape(Circle())
                        .shadow(color: .black.opacity(0.2), radius: 10, y: 5)
                    }
                    .scaleEffect(isRecording ? 1.05 : 1.0)
                    .animation(.easeInOut(duration: 0.3), value: isRecording)
                }
                .onAppear {
                    if isRecording {
                        pulseAnimation = true
                    }
                }
                
                Spacer()
                
                // Bottom Navigation
                HStack(spacing: 20) {
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
                    
                    NavigationLink(destination: HelpView()) {
                        Image(systemName: "questionmark.circle.fill")
                            .font(.title)
                            .foregroundColor(DesignSystem.textSecondary)
                            .frame(width: 60, height: 60)
                            .background(Color.white)
                            .cornerRadius(DesignSystem.cardCornerRadius)
                            .shadow(color: .black.opacity(0.05), radius: 5, y: 2)
                    }
                }
                .padding(.horizontal, DesignSystem.largePadding)
                .padding(.bottom, 40)
            }
        }
        .navigationBarHidden(true)
        .sheet(isPresented: $showingRecordingComplete) {
            RecordingCompleteView(transcription: transcription)
        }
    }
    
    func toggleRecording() {
        if isRecording {
            stopRecording()
        } else {
            startRecording()
        }
    }
    
    func startRecording() {
        isRecording = true
        pulseAnimation = true
        recordingTime = 0
        
        // Start timer
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
            recordingTime += 1
        }
        
        // Haptic feedback
        let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
        impactFeedback.impactOccurred()
    }
    
    func stopRecording() {
        isRecording = false
        pulseAnimation = false
        timer?.invalidate()
        timer = nil
        
        // Mock transcription
        transcription = "Today I want to tell you about when I was young, we used to play marbles in the schoolyard. It was such a simple game, but we had so much fun. We'd draw a circle in the dirt and try to knock each other's marbles out..."
        
        // Haptic feedback
        let impactFeedback = UIImpactFeedbackGenerator(style: .light)
        impactFeedback.impactOccurred()
        
        // Show recording complete screen
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            showingRecordingComplete = true
        }
    }
    
    func timeString(from seconds: Int) -> String {
        let minutes = seconds / 60
        let remainingSeconds = seconds % 60
        return String(format: "%02d:%02d", minutes, remainingSeconds)
    }
}

// MARK: - Preview
struct HomeView_Previews: PreviewProvider {
    static var previews: some View {
        HomeView()
    }
}
