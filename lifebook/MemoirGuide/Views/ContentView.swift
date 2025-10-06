// ContentView.swift
// Main container view for the app

import SwiftUI

struct ContentView: View {
    @AppStorage("hasCompletedOnboarding") private var hasCompletedOnboarding = false
    @AppStorage("userName") private var userName = ""

    var body: some View {
        NavigationView {
            if hasCompletedOnboarding {
                HomeView()
            } else {
                OnboardingView()
            }
        }
        .navigationViewStyle(.stack)
    }
}

// MARK: - Onboarding View
struct OnboardingView: View {
    @AppStorage("hasCompletedOnboarding") private var hasCompletedOnboarding = false
    @AppStorage("userName") private var userName = ""
    @State private var nameInput = ""

    var body: some View {
        ZStack {
            DesignSystem.backgroundBeige
                .ignoresSafeArea()

            VStack(spacing: 30) {
                Spacer()

                // App Icon / Logo
                Image(systemName: "book.circle.fill")
                    .font(.system(size: 100))
                    .foregroundColor(DesignSystem.amber)

                VStack(spacing: 10) {
                    Text("Welcome to Hugh Manatee")
                        .font(DesignSystem.largeTitle)
                        .foregroundColor(DesignSystem.textPrimary)

                    Text("Your memory companion for capturing life stories")
                        .font(DesignSystem.body)
                        .foregroundColor(DesignSystem.textSecondary)
                        .multilineTextAlignment(.center)
                }

                Spacer()

                VStack(spacing: 20) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("What's your name?")
                            .font(DesignSystem.body)
                            .foregroundColor(DesignSystem.textPrimary)

                        TextField("Enter your name", text: $nameInput)
                            .font(DesignSystem.body)
                            .padding()
                            .frame(height: 55)
                            .background(Color.white)
                            .cornerRadius(DesignSystem.cardCornerRadius)
                            .overlay(
                                RoundedRectangle(cornerRadius: DesignSystem.cardCornerRadius)
                                    .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                            )
                    }

                    Button(action: {
                        if !nameInput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                            userName = nameInput.trimmingCharacters(in: .whitespacesAndNewlines)
                            hasCompletedOnboarding = true
                        }
                    }) {
                        Text("Get Started")
                            .font(DesignSystem.buttonText)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: DesignSystem.primaryButtonHeight)
                            .background(nameInput.isEmpty ? Color.gray : DesignSystem.amber)
                            .cornerRadius(DesignSystem.cornerRadius)
                    }
                    .disabled(nameInput.isEmpty)
                }
                .padding(.horizontal, DesignSystem.largePadding)

                Spacer()
            }
        }
    }
}

// MARK: - Preview
struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
            .environmentObject(RecordingManager())
            .environmentObject(CoreDataManager.shared)
            .environmentObject(ProfileChecklistManager.shared)
    }
}
