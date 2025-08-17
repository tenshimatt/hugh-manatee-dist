//
// OnboardingView.swift - First Launch Experience
//
import SwiftUI

struct OnboardingView: View {
    @EnvironmentObject var appState: AppState
    @State private var currentPage = 0
    
    var body: some View {
        TabView(selection: $currentPage) {
            // Welcome Screen
            VStack(spacing: 30) {
                Image("GnomeImages")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 120, height: 120)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                
                Text("Knome")
                    .font(.largeTitle)
                    .bold()
                
                Text("Your private mental wellness companion")
                    .font(.title2)
                    .multilineTextAlignment(.center)
                    .foregroundColor(.secondary)
                
                Button("Get Started") {
                    currentPage = 1
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
            }
            .padding()
            .tag(0)
            
            // Privacy Screen
            VStack(spacing: 20) {
                Image(systemName: "lock.shield")
                    .font(.system(size: 80))
                    .foregroundColor(Color.blue)
                
                Text("Your Privacy Matters")
                    .font(.largeTitle)
                    .bold()
                
                VStack(alignment: .leading, spacing: 15) {
                    PrivacyPoint(text: "All conversations stay on your device")
                    PrivacyPoint(text: "No data is shared without your permission")
                    PrivacyPoint(text: "You can delete everything anytime")
                    PrivacyPoint(text: "GDPR & HIPAA compliant")
                }
                
                Button("Continue") {
                    currentPage = 2
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
            }
            .padding()
            .tag(1)
            
            // Introduction Screen
            VStack(spacing: 30) {
                Image("GnomeImages")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 100, height: 100)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                
                VStack(spacing: 15) {
                    Text("Hello! I'm Knome")
                        .font(.title)
                        .bold()
                    
                    Text("I'm here to be your helper, talk, answer questions, tell jokes, remind you of stuff and just be around")
                        .multilineTextAlignment(.center)
                        .foregroundColor(.secondary)
                    
                    Text("I don't judge anything and anything you share with me is safely stored right here. You can tell me anything and you will be heard.")
                        .multilineTextAlignment(.center)
                        .foregroundColor(.secondary)
                    
                    Text("I am not religious, political, and there is no judgement, just you and me")
                        .multilineTextAlignment(.center)
                        .foregroundColor(.secondary)
                }
                
                Button("Let's Start") {
                    appState.completeOnboarding()
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
            }
            .padding()
            .tag(2)
        }
        .tabViewStyle(.page)
        .indexViewStyle(.page(backgroundDisplayMode: .always))
    }
}

struct PrivacyPoint: View {
    let text: String
    
    var body: some View {
        HStack {
            Image(systemName: "checkmark.circle.fill")
                .foregroundColor(.green)
            Text(text)
        }
    }
}
