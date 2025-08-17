//
// ChatView.swift - Main Chat Interface
//
import SwiftUI
import Speech
import AVFoundation

struct ChatView: View {
    @EnvironmentObject var chatManager: ChatManager
    @EnvironmentObject var appState: AppState
    @StateObject private var voiceManager = SimpleVoiceManager()
    @State private var messageText = ""
    // @State private var showingUsageAlert = false // Removed for unlimited use
    @State private var showingPermissionAlert = false
    
    var body: some View {
        NavigationView {
            VStack {
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack {
                            ForEach(chatManager.messages) { message in
                                ChatBubble(message: message)
                                    .id(message.id)
                            }
                            
                            if chatManager.isLoading {
                                HStack {
                                    ProgressView()
                                        .scaleEffect(0.8)
                                    Text("Knome is typing...")
                                        .foregroundColor(.secondary)
                                        .font(.caption)
                                }
                                .padding()
                            }
                        }
                    }
                    .onChange(of: chatManager.messages.count) { _ in
                        withAnimation {
                            proxy.scrollTo(chatManager.messages.last?.id)
                        }
                    }
                }
                
                HStack {
                    TextField(voiceManager.isListening ? "Listening..." : "Message or hold to speak", 
                             text: $messageText, axis: .vertical)
                        .textFieldStyle(.roundedBorder)
                        .lineLimit(1...4)
                        .disabled(voiceManager.isListening)
                    
                    // Voice button
                    Button {
                        handleVoiceInput()
                    } label: {
                        Image(systemName: voiceManager.isListening ? "mic.fill" : "mic")
                            .font(.title2)
                            .foregroundColor(voiceManager.isListening ? Color.red : Color.blue)
                    }
                    .scaleEffect(voiceManager.isListening ? 1.2 : 1.0)
                    .animation(.easeInOut(duration: 0.1), value: voiceManager.isListening)
                    
                    // Send button
                    Button {
                        sendMessage()
                    } label: {
                        Image(systemName: "arrow.up.circle.fill")
                            .font(.title2)
                    }
                    .disabled(messageText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
                .padding()
            }
            .navigationTitle("Chat")
            .navigationBarTitleDisplayMode(.inline)
            .onAppear {
                chatManager.loadSessionSummary()
            }
            .onChange(of: voiceManager.recognizedText) { transcription in
                if !transcription.isEmpty && !voiceManager.isListening {
                    messageText = transcription
                    voiceManager.recognizedText = ""
                }
            }
            .onChange(of: chatManager.messages) { messages in
                // Auto-speak Knome responses if user was using voice
                if let lastMessage = messages.last, 
                   !lastMessage.isUser,
                   voiceManager.hasPermission {
                    voiceManager.speak(lastMessage.content)
                }
            }
            .alert("Microphone Permission", isPresented: $showingPermissionAlert) {
                Button("Settings") {
                    if let settingsUrl = URL(string: UIApplication.openSettingsURLString) {
                        UIApplication.shared.open(settingsUrl)
                    }
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("Please enable microphone access in Settings to use voice input.")
            }
            // Usage alert removed - unlimited use enabled
            // .alert("Daily Limit Reached", isPresented: $showingUsageAlert) {
            //     Button("Upgrade") {
            //         // Navigate to subscription view
            //     }
            //     Button("OK", role: .cancel) {}
            // } message: {
            //     Text("You've reached your daily usage limit. Upgrade to continue using Knome unlimited.")
            // }
        }
    }
    
    private func handleVoiceInput() {
        print("🎤 Voice button tapped - hasPermission: \(voiceManager.hasPermission)")
        
        if !voiceManager.hasPermission {
            print("🎤 Requesting speech permission...")
            Task {
                let granted = await voiceManager.requestSpeechPermission()
                print("🎤 Permission granted: \(granted)")
                if granted {
                    voiceManager.startListening()
                } else {
                    showingPermissionAlert = true
                }
            }
            return
        }
        
        if voiceManager.isListening {
            print("🎤 Stopping listening...")
            voiceManager.stopListening()
        } else {
            print("🎤 Starting listening...")
            voiceManager.stopSpeaking() // Stop any current TTS
            voiceManager.startListening()
        }
    }
    
    private func sendMessage() {
        let text = messageText.trimmingCharacters(in: .whitespacesAndNewlines)
        print("💬 Send button tapped - text: '\(text)'")
        guard !text.isEmpty else { 
            print("💬 Text is empty, not sending")
            return 
        }
        
        // Usage limits disabled - unlimited use for now
        // if !appState.isSubscribed && appState.dailyUsageMinutes >= 5 {
        //     print("💬 Usage limit reached, showing alert")
        //     showingUsageAlert = true
        //     return
        // }
        
        print("💬 Sending message: '\(text)'")
        messageText = ""
        
        voiceManager.stopSpeaking() // Stop any current TTS
        
        Task {
            await chatManager.sendMessage(text)
            // Usage tracking disabled for unlimited use
            // appState.updateUsage(minutes: 1)
            print("💬 Message sent successfully")
        }
    }
}

struct ChatBubble: View {
    let message: ChatMessage
    
    var body: some View {
        HStack {
            if message.isUser {
                Spacer()
                Text(message.content)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
            } else {
                HStack(alignment: .top, spacing: 8) {
                    Image("GnomeImages")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 32, height: 32)
                        .clipShape(RoundedRectangle(cornerRadius: 4))
                    
                    Text(message.content)
                        .padding()
                        .background(Color(.systemGray6))
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                    
                    Spacer()
                }
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 2)
    }
}
