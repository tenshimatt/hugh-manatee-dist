// PrivacyConsentView.swift
// First-launch privacy consent and onboarding

import SwiftUI

struct PrivacyConsentView: View {
    @AppStorage("hasAcceptedPrivacyPolicy") private var hasAcceptedPrivacyPolicy = false
    @AppStorage("hasCompletedOnboarding") private var hasCompletedOnboarding = false

    @State private var agreedToTerms = false
    @State private var agreedToDataCollection = false
    @State private var showingFullPolicy = false
    @Binding var isPresented: Bool

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Header
                    VStack(spacing: 16) {
                        Image(systemName: "lock.shield.fill")
                            .font(.system(size: 60))
                            .foregroundColor(.primaryTheme)

                        Text("Your Privacy Matters")
                            .font(.system(size: 32))
                            .multilineTextAlignment(.center)

                        Text("Welcome to MemoirGuide")
                            .font(.title3)
                            .foregroundColor(.gray)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.top, 20)

                    // Privacy highlights
                    VStack(alignment: .leading, spacing: 20) {
                        Text("How We Protect Your Memories")
                            .font(.title2)
                            .fontWeight(.semibold)

                        PrivacyFeature(
                            icon: "lock.fill",
                            title: "Encrypted Storage",
                            description: "All recordings and transcriptions are encrypted on your device using iOS encryption."
                        )

                        PrivacyFeature(
                            icon: "icloud.fill",
                            title: "Your Private iCloud",
                            description: "Optional sync uses your personal iCloud account. We cannot access your data."
                        )

                        PrivacyFeature(
                            icon: "hand.raised.fill",
                            title: "No Sharing",
                            description: "We never sell, share, or analyze your data. No ads, no tracking, no analytics."
                        )

                        PrivacyFeature(
                            icon: "person.fill.checkmark",
                            title: "You're In Control",
                            description: "Export or delete your data anytime. Your memories belong to you alone."
                        )
                    }
                    .padding()
                    .background(Color.secondaryTheme.opacity(0.1))
                    .cornerRadius(16)

                    // Data collection notice
                    VStack(alignment: .leading, spacing: 12) {
                        Text("What We Collect")
                            .font(.headline)
                            .fontWeight(.semibold)

                        Text("""
                        MemoirGuide collects and stores:
                        • Audio recordings you create
                        • Text transcriptions (processed on-device)
                        • Your name and preferences
                        • Story organization and metadata

                        All data is stored securely on your device with encryption. \
                        You can optionally enable iCloud sync to backup to your \
                        private iCloud account.

                        We do NOT collect usage analytics, crash reports, or \
                        any tracking data. Your privacy is absolute.
                        """)
                        .font(.body)
                        .foregroundColor(.gray)
                        .lineSpacing(4)
                    }
                    .padding()
                    .background(Color.white)
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                    )

                    // Consent toggles
                    VStack(alignment: .leading, spacing: 16) {
                        Toggle(isOn: $agreedToTerms) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("I accept the Privacy Policy")
                                    .font(.body)
                                    .fontWeight(.medium)

                                Button(action: { showingFullPolicy = true }) {
                                    Text("Read Full Privacy Policy →")
                                        .font(.caption)
                                        .foregroundColor(.primaryTheme)
                                }
                            }
                        }
                        .toggleStyle(SwitchToggleStyle(tint: .primaryTheme))

                        Toggle(isOn: $agreedToDataCollection) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("I understand how my data is used")
                                    .font(.body)
                                    .fontWeight(.medium)

                                Text("Local storage with optional iCloud backup")
                                    .font(.caption)
                                    .foregroundColor(.gray)
                            }
                        }
                        .toggleStyle(SwitchToggleStyle(tint: .primaryTheme))
                    }
                    .padding()
                    .background(Color.primaryTheme.opacity(0.05))
                    .cornerRadius(12)

                    // Continue button
                    Button(action: acceptAndContinue) {
                        HStack {
                            Spacer()
                            Text("Continue to MemoirGuide")
                                .font(.title3)
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                            Spacer()
                        }
                        .padding()
                        .background(canContinue ? Color.primaryTheme : Color.gray)
                        .cornerRadius(12)
                    }
                    .disabled(!canContinue)

                    // Legal text
                    Text("By continuing, you agree to our Privacy Policy and Terms of Service. You can delete all data at any time from Settings.")
                        .font(.caption)
                        .foregroundColor(.gray)
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: .infinity)
                        .padding(.bottom, 20)
                }
                .padding()
            }
            .navigationBarHidden(true)
            .sheet(isPresented: $showingFullPolicy) {
                FullPrivacyPolicyView()
            }
        }
    }

    private var canContinue: Bool {
        agreedToTerms && agreedToDataCollection
    }

    private func acceptAndContinue() {
        hasAcceptedPrivacyPolicy = true
        hasCompletedOnboarding = true
        isPresented = false
    }
}

// MARK: - Privacy Feature Row

struct PrivacyFeature: View {
    let icon: String
    let title: String
    let description: String

    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 28))
                .foregroundColor(.primaryTheme)
                .frame(width: 44, height: 44)

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                    .fontWeight(.semibold)

                Text(description)
                    .font(.subheadline)
                    .foregroundColor(.gray)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }
}

// MARK: - Full Privacy Policy View

struct FullPrivacyPolicyView: View {
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("""
                    # Privacy Policy for MemoirGuide

                    **Last Updated:** September 30, 2025

                    ## Your Privacy is Our Priority

                    MemoirGuide is built with privacy as the foundation. Your memories \
                    are precious and personal - we take protecting them seriously.

                    ## What Data We Collect

                    • **Audio Recordings:** Your voice recordings are stored encrypted \
                    on your device using iOS FileProtectionType.complete

                    • **Transcriptions:** Generated on-device using Apple's Speech \
                    Recognition framework, stored encrypted in Core Data

                    • **Profile Information:** Your name and app preferences for \
                    personalization

                    • **Story Metadata:** Titles, dates, organization information

                    ## What We DON'T Collect

                    ❌ Usage analytics or telemetry
                    ❌ Crash reports
                    ❌ Device identifiers for tracking
                    ❌ Location data
                    ❌ Any third-party tracking

                    ## Data Storage & Security

                    **Encryption at Rest:**
                    - Core Data uses FileProtectionType.complete
                    - Audio files stored in secure directory with FileProtectionType.complete
                    - Data only accessible when device is unlocked

                    **Optional iCloud Sync:**
                    - Uses your private iCloud account
                    - Encrypted end-to-end by Apple CloudKit
                    - We cannot access your iCloud data
                    - Disable anytime in iOS Settings

                    ## Your Rights

                    ✅ Access all your data anytime in the app
                    ✅ Export stories as text or audio files
                    ✅ Delete individual recordings or entire stories
                    ✅ Delete all data from Settings
                    ✅ Disable iCloud sync anytime

                    ## Third-Party Services

                    We use ONLY Apple's built-in services:
                    - Speech Recognition (on-device)
                    - iCloud CloudKit (optional, your account)

                    We do NOT use:
                    - Google Analytics
                    - Facebook SDK
                    - Amazon Web Services
                    - Any third-party tracking SDKs

                    ## Data Sharing

                    We NEVER:
                    - Sell your data to third parties
                    - Share with advertisers
                    - Provide to analytics companies
                    - Send to external servers (except your iCloud if enabled)

                    YOU control sharing through:
                    - Export feature (share via iOS share sheet)
                    - Family sharing (future feature)

                    ## Children's Privacy

                    App designed for adults 65+. Not directed at children under 13. \
                    Parental consent required if children participate.

                    ## California & EU Rights

                    **CCPA (California):**
                    - Right to know: See above
                    - Right to delete: Use in-app features
                    - We do NOT sell personal information

                    **GDPR (EU/EEA):**
                    - All rights respected (access, rectification, erasure, etc.)
                    - Contact: tenshimatt@mac.com

                    ## Contact Us

                    Questions or concerns?
                    Email: tenshimatt@mac.com
                    Subject: "MemoirGuide Privacy Inquiry"

                    ## Consent

                    By using MemoirGuide, you consent to this Privacy Policy. \
                    Withdraw consent by deleting all data and uninstalling the app.

                    ---

                    **Your memories. Your privacy. Your control.**

                    For the complete Privacy Policy, see PRIVACY_POLICY.md in the \
                    app documentation or contact us.
                    """)
                    .font(.body)
                    .lineSpacing(4)
                    .padding()
                }
            }
            .navigationTitle("Privacy Policy")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Close") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Preview

struct PrivacyConsentView_Previews: PreviewProvider {
    static var previews: some View {
        PrivacyConsentView(isPresented: .constant(true))
    }
}
