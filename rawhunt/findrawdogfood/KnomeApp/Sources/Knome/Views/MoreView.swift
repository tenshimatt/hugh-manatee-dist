//
// MoreView.swift - Settings and Additional Features
//
import SwiftUI

struct MoreView: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var subscriptionManager: SubscriptionManager
    @EnvironmentObject var encryptionManager: EncryptionManager
    @StateObject private var voiceManager = SimpleVoiceManager()
    @State private var showingSubscriptions = false
    @State private var showingPrivacyPolicy = false
    @State private var showingDeleteConfirmation = false
    @State private var showingVoiceSettings = false
    
    var body: some View {
        NavigationView {
            List {
                Section {
                    HStack {
                        Image("GnomeImages")
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(width: 60, height: 60)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                        
                        VStack(alignment: .leading) {
                            Text("Hello!")
                                .font(.title2)
                                .bold()
                            Text("You are not alone")
                                .foregroundColor(.secondary)
                        }
                        
                        Spacer()
                    }
                    .padding(.vertical, 8)
                }
                
                Section("Subscription") {
                    Button {
                        showingSubscriptions = true
                    } label: {
                        HStack {
                            Text("Manage Subscription")
                            Spacer()
                            if appState.isSubscribed {
                                Text("Active")
                                    .foregroundColor(.green)
                                    .font(.caption)
                            }
                            Image(systemName: "chevron.right")
                                .foregroundColor(.secondary)
                        }
                    }
                    .foregroundColor(.primary)
                    
                    HStack {
                        Text("Daily Usage")
                        Spacer()
                        Text("\(appState.dailyUsageMinutes) min")
                            .foregroundColor(.secondary)
                    }
                    
                    HStack {
                        Text("Monthly Usage")
                        Spacer()
                        Text("\(appState.monthlyUsageMinutes) min")
                            .foregroundColor(.secondary)
                    }
                }
                
                Section("Voice Settings") {
                    Button {
                        showingVoiceSettings = true
                    } label: {
                        HStack {
                            Text("Voice Selection")
                            Spacer()
                            if let selectedVoice = voiceManager.selectedVoice {
                                Text(selectedVoice.displayName)
                                    .foregroundColor(.secondary)
                                    .font(.caption)
                            }
                            Image(systemName: "chevron.right")
                                .foregroundColor(.secondary)
                        }
                    }
                    .foregroundColor(.primary)
                    
                    HStack {
                        Text("Available Voices")
                        Spacer()
                        Text("\(voiceManager.availableVoices.count)")
                            .foregroundColor(.secondary)
                    }
                }
                
                Section("Support") {
                    NavigationLink("FAQ") {
                        FAQView()
                    }
                    
                    NavigationLink("Privacy Policy") {
                        PrivacyPolicyView()
                    }
                    
                    Button("Contact Support") {
                        // Open email client
                    }
                }
                
                Section("Data") {
                    Button("Export My Data") {
                        exportData()
                    }
                    
                    Button("Delete All Data") {
                        showingDeleteConfirmation = true
                    }
                    .foregroundColor(.red)
                }
            }
            .navigationTitle("More")
            .navigationBarTitleDisplayMode(.large)
        }
        .sheet(isPresented: $showingSubscriptions) {
            SubscriptionView()
        }
        .sheet(isPresented: $showingVoiceSettings) {
            VoiceSettingsView(voiceManager: voiceManager)
        }
        .alert("Delete All Data", isPresented: $showingDeleteConfirmation) {
            Button("Cancel", role: .cancel) { }
            Button("Delete", role: .destructive) {
                encryptionManager.deleteAllData()
                appState.hasCompletedOnboarding = false
                UserDefaults.standard.set(false, forKey: "hasCompletedOnboarding")
            }
        } message: {
            Text("This will permanently delete all your conversations, journal entries, and session data. This action cannot be undone.")
        }
    }
    
    private func exportData() {
        // Implementation for exporting user data
        // This would create a JSON file with all user data
    }
}

struct VoiceSettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var voiceManager: SimpleVoiceManager
    @State private var testText = "Hello! This is a test of the selected voice."
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Text("Choose your preferred voice for Knome responses")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
                
                List {
                    ForEach(voiceManager.availableVoices, id: \.id) { voiceOption in
                        VoiceOptionRow(
                            voiceOption: voiceOption,
                            isSelected: voiceManager.selectedVoice?.id == voiceOption.id,
                            onSelect: { 
                                voiceManager.selectVoice(voiceOption)
                            },
                            onTest: {
                                voiceManager.speak(testText)
                            }
                        )
                    }
                }
                .listStyle(.insetGrouped)
                
                VStack(spacing: 12) {
                    Text("Test Voice")
                        .font(.headline)
                    
                    TextField("Test message", text: $testText, axis: .vertical)
                        .textFieldStyle(.roundedBorder)
                        .lineLimit(2...4)
                    
                    Button("Play Test") {
                        if voiceManager.selectedVoice != nil {
                            voiceManager.speak(testText)
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(testText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
                .padding(.horizontal)
                .padding(.bottom)
            }
            .navigationTitle("Voice Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct VoiceOptionRow: View {
    let voiceOption: VoiceOption
    let isSelected: Bool
    let onSelect: () -> Void
    let onTest: () -> Void
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(voiceOption.displayName)
                    .font(.body)
                    .bold(isSelected)
                
                Text(voiceOption.language.uppercased())
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Button("Test") {
                onTest()
            }
            .buttonStyle(.bordered)
            .controlSize(.small)
            
            if isSelected {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.blue)
                    .font(.title3)
            }
        }
        .contentShape(Rectangle())
        .onTapGesture {
            onSelect()
        }
        .listRowBackground(isSelected ? Color.blue.opacity(0.1) : Color.clear)
    }
}
