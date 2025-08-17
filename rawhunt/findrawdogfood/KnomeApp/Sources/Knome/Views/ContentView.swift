//
// ContentView.swift - Main Tab Controller
//
import SwiftUI

struct ContentView: View {
    @EnvironmentObject var appState: AppState
    @State private var selectedTab = 0
    @State private var showConnectionStatus = false
    @State private var showingSplashScreen = true
    
    var body: some View {
        if showingSplashScreen {
            SplashScreenView()
                .onAppear {
                    // Show splash screen for 2.5 seconds
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
                        withAnimation(.easeInOut(duration: 0.5)) {
                            showingSplashScreen = false
                        }
                    }
                }
        } else if appState.hasCompletedOnboarding {
            ZStack {
                TabView(selection: $selectedTab) {
                    ChatView()
                        .tabItem {
                            Image(systemName: "message")
                            Text("Chat")
                        }
                        .tag(0)
                    
                    JournalView()
                        .tabItem {
                            Image(systemName: "book")
                            Text("Journal")
                        }
                        .tag(1)
                    
                    MoreView()
                        .tabItem {
                            Image(systemName: "ellipsis")
                            Text("More")
                        }
                        .tag(2)
                }
                .accentColor(Color.blue)
                
                // Connection Status Indicator
                VStack {
                    HStack {
                        Spacer()
                        Button {
                            showConnectionStatus.toggle()
                        } label: {
                            HStack(spacing: 4) {
                                Circle()
                                    .fill(appState.isConnectedToOpenAI ? .green : .orange)
                                    .frame(width: 8, height: 8)
                                Text(appState.isConnectedToOpenAI ? "LIVE" : "DEMO")
                                    .font(.caption2)
                                    .fontWeight(.medium)
                            }
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
                        }
                        .padding(.trailing)
                    }
                    Spacer()
                }
                .allowsHitTesting(true)
            }
            .alert("Connection Status", isPresented: $showConnectionStatus) {
                Button("OK") {}
            } message: {
                Text(appState.connectionStatus + "\n\n" + 
                     (appState.isConnectedToOpenAI ? 
                      "🚀 Real AI responses with GPT-4\n🎙️ Voice input & output active" : 
                      "🧪 Demo responses for testing\n🎙️ Voice features still work"))
            }
        } else {
            OnboardingView()
        }
    }
}

struct SplashScreenView: View {
    @State private var isAnimating = false
    @State private var opacity = 0.0
    
    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                colors: [Color.blue.opacity(0.8), Color.blue.opacity(0.4)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            VStack(spacing: 30) {
                // Gnome image with animation
                Image("GnomeImages")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 150, height: 150)
                    .clipShape(RoundedRectangle(cornerRadius: 20))
                    .shadow(color: .black.opacity(0.2), radius: 10, x: 0, y: 5)
                    .scaleEffect(isAnimating ? 1.05 : 1.0)
                    .animation(.easeInOut(duration: 2.0).repeatForever(autoreverses: true), value: isAnimating)
                
                // App title
                Text("Knome")
                    .font(.system(size: 48, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                    .shadow(color: .black.opacity(0.3), radius: 2, x: 0, y: 2)
                
                // Subtitle
                Text("Your private wellness companion")
                    .font(.title3)
                    .foregroundColor(.white.opacity(0.9))
                    .multilineTextAlignment(.center)
            }
            .opacity(opacity)
            .animation(.easeInOut(duration: 0.8), value: opacity)
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 0.5)) {
                opacity = 1.0
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                isAnimating = true
            }
        }
    }
}
