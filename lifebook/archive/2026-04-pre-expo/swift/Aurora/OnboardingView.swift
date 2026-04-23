import SwiftUI

// MARK: - Onboarding View
struct OnboardingView: View {
    @AppStorage("hasCompletedOnboarding") private var hasCompletedOnboarding = false
    @AppStorage("userName") private var userName = ""
    @State private var firstNameInput = ""
    @State private var showingNextScreen = false
    @FocusState private var isTextFieldFocused: Bool
    
    var body: some View {
        ZStack {
            DesignSystem.backgroundBeige
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                Spacer()
                
                // Icon
                Image(systemName: "mic.circle.fill")
                    .font(.system(size: 80))
                    .foregroundColor(DesignSystem.primaryTeal)
                    .padding(.bottom, 30)
                
                // Welcome Text
                VStack(spacing: 15) {
                    Text("Welcome to\nLifebook")
                        .font(DesignSystem.largeTitle)
                        .multilineTextAlignment(.center)
                        .foregroundColor(DesignSystem.textPrimary)
                        .accessibilityIdentifier("welcomeTitle")

                    Text("Share your memories,\none story at a time")
                        .font(DesignSystem.body)
                        .foregroundColor(DesignSystem.textSecondary)
                        .multilineTextAlignment(.center)
                        .accessibilityIdentifier("welcomeSubtitle")
                }
                .padding(.bottom, 50)
                
                // Name Input
                VStack(alignment: .leading, spacing: 12) {
                    Text("What should I call you?")
                        .font(DesignSystem.body)
                        .foregroundColor(DesignSystem.textPrimary)
                        .padding(.horizontal, 5)
                    
                    TextField("First name", text: $firstNameInput)
                        .font(DesignSystem.title)
                        .padding()
                        .frame(height: 65)
                        .background(Color.white)
                        .cornerRadius(DesignSystem.cornerRadius)
                        .overlay(
                            RoundedRectangle(cornerRadius: DesignSystem.cornerRadius)
                                .stroke(isTextFieldFocused ? DesignSystem.primaryTeal : Color.gray.opacity(0.2), lineWidth: 2)
                        )
                        .focused($isTextFieldFocused)
                        .accessibilityIdentifier("firstNameTextField")
                }
                .padding(.horizontal, DesignSystem.largePadding)
                
                Spacer()
                Spacer()
                
                // Start Button
                Button(action: startApp) {
                    Text("Let's Begin")
                        .font(DesignSystem.buttonText)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: DesignSystem.primaryButtonHeight)
                        .background(
                            firstNameInput.isEmpty ?
                            Color.gray.opacity(0.3) :
                            DesignSystem.primaryTeal
                        )
                        .cornerRadius(DesignSystem.cornerRadius)
                        .animation(.easeInOut(duration: 0.2), value: firstNameInput.isEmpty)
                }
                .disabled(firstNameInput.isEmpty)
                .accessibilityIdentifier("letsBeginButton")
                .padding(.horizontal, DesignSystem.largePadding)
                .padding(.bottom, 50)
            }
        }
        .onTapGesture {
            isTextFieldFocused = false
        }
    }
    
    func startApp() {
        withAnimation(.easeInOut(duration: 0.3)) {
            userName = firstNameInput
            hasCompletedOnboarding = true
        }
    }
}

// MARK: - Preview
struct OnboardingView_Previews: PreviewProvider {
    static var previews: some View {
        OnboardingView()
    }
}
