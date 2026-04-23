// SettingsView.swift
// App settings and data management

import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var coreDataManager: CoreDataManager
    @Environment(\.dismiss) var dismiss

    @AppStorage("hasAcceptedPrivacyPolicy") private var hasAcceptedPrivacyPolicy = false

    @State private var showingDeleteConfirmation = false
    @State private var showingDeleteSuccess = false
    @State private var showingPrivacyPolicy = false
    @State private var isDeleting = false

    var body: some View {
        NavigationView {
            List {
                // App Info Section
                Section(header: Text("About")) {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(.gray)
                    }

                    HStack {
                        Text("Build")
                        Spacer()
                        Text("1")
                            .foregroundColor(.gray)
                    }
                }

                // Privacy Section
                Section(header: Text("Privacy")) {
                    Button(action: { showingPrivacyPolicy = true }) {
                        HStack {
                            Label("Privacy Policy", systemImage: "hand.raised.fill")
                            Spacer()
                            Image(systemName: "chevron.right")
                                .foregroundColor(.gray)
                                .font(.caption)
                        }
                    }
                    .foregroundColor(.primary)

                    HStack {
                        Label("iCloud Sync", systemImage: "icloud.fill")
                        Spacer()
                        Text("Managed in iOS Settings")
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                }

                // Data Management Section
                Section(header: Text("Data Management"),
                       footer: Text("This will permanently delete all recordings, transcriptions, stories, and settings. This action cannot be undone. iCloud data must be deleted separately in iOS Settings > iCloud > Manage Storage.")) {

                    Button(action: { showingDeleteConfirmation = true }) {
                        Label {
                            Text("Delete All Data")
                                .foregroundColor(.red)
                        } icon: {
                            Image(systemName: "trash.fill")
                                .foregroundColor(.red)
                        }
                    }
                }

                // Support Section
                Section(header: Text("Support")) {
                    Link(destination: URL(string: "mailto:tenshimatt@mac.com")!) {
                        HStack {
                            Label("Contact Support", systemImage: "envelope.fill")
                            Spacer()
                            Image(systemName: "chevron.right")
                                .foregroundColor(.gray)
                                .font(.caption)
                        }
                    }
                    .foregroundColor(.primary)

                    Link(destination: URL(string: "https://github.com/tenshimatt/memoirguide/issues")!) {
                        HStack {
                            Label("Report Issue", systemImage: "exclamationmark.bubble.fill")
                            Spacer()
                            Image(systemName: "chevron.right")
                                .foregroundColor(.gray)
                                .font(.caption)
                        }
                    }
                    .foregroundColor(.primary)
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
            .sheet(isPresented: $showingPrivacyPolicy) {
                FullPrivacyPolicyView()
            }
            .alert("Delete All Data?", isPresented: $showingDeleteConfirmation) {
                Button("Cancel", role: .cancel) { }
                Button("Delete Everything", role: .destructive) {
                    deleteAllData()
                }
            } message: {
                Text("This will permanently delete all your recordings, transcriptions, stories, and settings from this device. This cannot be undone.\n\nTo delete iCloud data, go to iOS Settings > iCloud > Manage Storage > MemoirGuide.")
            }
            .alert("Data Deleted", isPresented: $showingDeleteSuccess) {
                Button("OK") {
                    dismiss()
                }
            } message: {
                Text("All local data has been permanently deleted. iCloud data (if any) must be deleted separately in iOS Settings.")
            }
        }
    }

    private func deleteAllData() {
        isDeleting = true

        DispatchQueue.global(qos: .userInitiated).async {
            // 1. Delete all Core Data entities
            let context = coreDataManager.context

            // Delete all segments
            let segmentRequest: NSFetchRequest<NSFetchRequestResult> = MemoirSegmentEntity.fetchRequest()
            let deleteSegmentsRequest = NSBatchDeleteRequest(fetchRequest: segmentRequest)

            // Delete all sessions
            let sessionRequest: NSFetchRequest<NSFetchRequestResult> = MemoirSessionEntity.fetchRequest()
            let deleteSessionsRequest = NSBatchDeleteRequest(fetchRequest: sessionRequest)

            // Delete all chapters
            let chapterRequest: NSFetchRequest<NSFetchRequestResult> = ChapterEntity.fetchRequest()
            let deleteChaptersRequest = NSBatchDeleteRequest(fetchRequest: chapterRequest)

            // Delete all user profiles
            let profileRequest: NSFetchRequest<NSFetchRequestResult> = UserProfileEntity.fetchRequest()
            let deleteProfilesRequest = NSBatchDeleteRequest(fetchRequest: profileRequest)

            do {
                try context.execute(deleteSegmentsRequest)
                try context.execute(deleteSessionsRequest)
                try context.execute(deleteChaptersRequest)
                try context.execute(deleteProfilesRequest)
                try context.save()
            } catch {
                print("Error deleting Core Data: \(error)")
            }

            // 2. Delete all audio files
            let fileManager = FileManager.default
            let documentsURL = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first!

            // Delete secure audio directory
            let secureDirectory = documentsURL.appendingPathComponent("SecureAudio", isDirectory: true)
            try? fileManager.removeItem(at: secureDirectory)

            // Delete any legacy audio files in root documents
            if let files = try? fileManager.contentsOfDirectory(at: documentsURL, includingPropertiesForKeys: nil) {
                for file in files where file.pathExtension == "m4a" {
                    try? fileManager.removeItem(at: file)
                }
            }

            // 3. Reset UserDefaults (app settings)
            if let bundleID = Bundle.main.bundleIdentifier {
                UserDefaults.standard.removePersistentDomain(forName: bundleID)
            }

            // 4. Show success on main thread
            DispatchQueue.main.async {
                isDeleting = false
                showingDeleteSuccess = true
                hasAcceptedPrivacyPolicy = false // Reset for next launch
            }
        }
    }
}

// MARK: - Preview

struct SettingsView_Previews: PreviewProvider {
    static var previews: some View {
        SettingsView()
            .environmentObject(CoreDataManager.shared)
    }
}
