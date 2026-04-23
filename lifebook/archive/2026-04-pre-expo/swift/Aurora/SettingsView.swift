import SwiftUI

// MARK: - Settings View
struct SettingsView: View {
    @AppStorage("autoSaveRecordings") private var autoSaveEnabled = true  // Default ON
    @AppStorage("userName") private var userName = ""
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ZStack {
            DesignSystem.backgroundBeige
                .ignoresSafeArea()

            VStack(spacing: 0) {
                // Header
                HStack {
                    Button("Done") {
                        dismiss()
                    }
                    .font(DesignSystem.body)
                    .foregroundColor(DesignSystem.deepNavy)

                    Spacer()

                    Text("Settings")
                        .font(DesignSystem.title)
                        .foregroundColor(DesignSystem.textPrimary)

                    Spacer()

                    // Invisible placeholder for balance
                    Text("Done")
                        .font(DesignSystem.body)
                        .foregroundColor(.clear)
                }
                .padding()

                ScrollView {
                    VStack(spacing: 25) {
                        // User Profile Section
                        VStack(alignment: .leading, spacing: 15) {
                            Text("Profile")
                                .font(DesignSystem.buttonText)
                                .foregroundColor(DesignSystem.textPrimary)

                            HStack {
                                Text("Name")
                                    .font(DesignSystem.body)
                                    .foregroundColor(DesignSystem.textSecondary)

                                Spacer()

                                Text(userName)
                                    .font(DesignSystem.body)
                                    .foregroundColor(DesignSystem.textPrimary)
                            }
                            .padding()
                            .background(Color.white)
                            .cornerRadius(DesignSystem.cardCornerRadius)
                        }
                        .padding(.horizontal, DesignSystem.largePadding)
                        .padding(.top, 20)

                        // Recording Settings Section
                        VStack(alignment: .leading, spacing: 15) {
                            Text("Recording")
                                .font(DesignSystem.buttonText)
                                .foregroundColor(DesignSystem.textPrimary)

                            VStack(spacing: 0) {
                                // Auto-Save Toggle
                                VStack(alignment: .leading, spacing: 8) {
                                    Toggle(isOn: $autoSaveEnabled) {
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text("Auto-save recordings")
                                                .font(DesignSystem.body)
                                                .foregroundColor(DesignSystem.textPrimary)

                                            Text("Save immediately after recording. AI enhancement happens in the background.")
                                                .font(DesignSystem.caption)
                                                .foregroundColor(DesignSystem.textSecondary)
                                                .fixedSize(horizontal: false, vertical: true)
                                        }
                                    }
                                    .tint(DesignSystem.cornYellow)
                                    .padding()
                                }

                                Divider()
                                    .padding(.leading)

                                // Info about manual mode
                                HStack(alignment: .top, spacing: 12) {
                                    Image(systemName: autoSaveEnabled ? "bolt.fill" : "hand.tap.fill")
                                        .font(.title3)
                                        .foregroundColor(autoSaveEnabled ? DesignSystem.sunsetOrange : DesignSystem.amber)

                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(autoSaveEnabled ? "Quick Mode" : "Review Mode")
                                            .font(DesignSystem.body)
                                            .foregroundColor(DesignSystem.textPrimary)

                                        Text(autoSaveEnabled ?
                                            "Recordings save instantly. You can edit and regenerate AI content anytime from your library." :
                                            "Review transcription and AI enhancement before saving each recording.")
                                            .font(DesignSystem.caption)
                                            .foregroundColor(DesignSystem.textSecondary)
                                            .fixedSize(horizontal: false, vertical: true)
                                    }
                                }
                                .padding()
                            }
                            .background(Color.white)
                            .cornerRadius(DesignSystem.cardCornerRadius)
                        }
                        .padding(.horizontal, DesignSystem.largePadding)

                        // AI Settings Section
                        VStack(alignment: .leading, spacing: 15) {
                            Text("AI Enhancement")
                                .font(DesignSystem.buttonText)
                                .foregroundColor(DesignSystem.textPrimary)

                            VStack(alignment: .leading, spacing: 12) {
                                HStack(alignment: .top, spacing: 12) {
                                    Image(systemName: "sparkles")
                                        .font(.title3)
                                        .foregroundColor(DesignSystem.amber)

                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Background Processing")
                                            .font(DesignSystem.body)
                                            .foregroundColor(DesignSystem.textPrimary)

                                        Text("AI enhances your recordings with professional editing while you continue using the app.")
                                            .font(DesignSystem.caption)
                                            .foregroundColor(DesignSystem.textSecondary)
                                            .fixedSize(horizontal: false, vertical: true)
                                    }
                                }

                                Divider()

                                HStack(alignment: .top, spacing: 12) {
                                    Image(systemName: "arrow.clockwise")
                                        .font(.title3)
                                        .foregroundColor(DesignSystem.amber)

                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Always Available")
                                            .font(DesignSystem.body)
                                            .foregroundColor(DesignSystem.textPrimary)

                                        Text("Your original audio is always saved. Regenerate AI content anytime with different styles.")
                                            .font(DesignSystem.caption)
                                            .foregroundColor(DesignSystem.textSecondary)
                                            .fixedSize(horizontal: false, vertical: true)
                                    }
                                }
                            }
                            .padding()
                            .background(Color.white)
                            .cornerRadius(DesignSystem.cardCornerRadius)
                        }
                        .padding(.horizontal, DesignSystem.largePadding)

                        // App Info
                        VStack(spacing: 8) {
                            Text("Aurora")
                                .font(DesignSystem.caption)
                                .foregroundColor(DesignSystem.textSecondary)

                            Text("Version 1.0")
                                .font(DesignSystem.caption)
                                .foregroundColor(DesignSystem.textSecondary.opacity(0.7))
                        }
                        .padding(.vertical, 30)
                    }
                }
            }
        }
        .navigationBarHidden(true)
    }
}

// MARK: - Preview
struct SettingsView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationStack {
            SettingsView()
        }
    }
}
