//
// JournalView.swift - Personal Journal
//
import SwiftUI

struct JournalView: View {
    @EnvironmentObject var encryptionManager: EncryptionManager
    @State private var entries: [JournalEntry] = []
    @State private var showingNewEntry = false
    
    var body: some View {
        NavigationView {
            List {
                ForEach(entries.reversed()) { entry in
                    JournalEntryRow(entry: entry)
                }
                .onDelete(perform: deleteEntries)
            }
            .navigationTitle("Journal")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingNewEntry = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingNewEntry) {
                NewJournalEntryView { entry in
                    entries.append(entry)
                    saveEntries()
                }
            }
            .onAppear {
                loadEntries()
            }
        }
    }
    
    private func loadEntries() {
        entries = encryptionManager.loadJournalEntries()
    }
    
    private func saveEntries() {
        encryptionManager.saveJournalEntries(entries)
    }
    
    private func deleteEntries(offsets: IndexSet) {
        entries.remove(atOffsets: offsets)
        saveEntries()
    }
}

struct JournalEntryRow: View {
    let entry: JournalEntry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Spacer()
                Text(entry.timestamp, style: .date)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Text(entry.content)
                .lineLimit(3)
        }
        .padding(.vertical, 4)
    }
}

struct NewJournalEntryView: View {
    @Environment(\.dismiss) private var dismiss
    let onSave: (JournalEntry) -> Void
    
    @State private var content = ""
    
    var body: some View {
        NavigationView {
            VStack {
                TextEditor(text: $content)
                    .padding()
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color(.systemGray4), lineWidth: 1)
                    )
                
                Spacer()
            }
            .padding()
            .navigationTitle("New Entry")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        let entry = JournalEntry(content: content)
                        onSave(entry)
                        dismiss()
                    }
                    .disabled(content.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
    }
}