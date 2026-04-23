// ReaderView.swift
// Read and playback recorded chapters

import SwiftUI
import AVFoundation

struct ReaderView: View {
    let chapter: Chapter
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var cloudKit: CloudKitManager
    @State private var segments: [MemoirSegment] = []
    @State private var fontSize: CGFloat = 20
    @State private var isPlaying = false
    @State private var currentSegmentIndex = 0
    @State private var showingShareSheet = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Chapter title
                    Text(chapter.title)
                        .font(.custom("Georgia", size: 32))
                        .padding(.bottom, 10)
                    
                    // Content
                    ForEach(segments) { segment in
                        VStack(alignment: .leading, spacing: 15) {
                            Text(segment.transcription)
                                .font(.custom("Georgia", size: fontSize))
                                .lineSpacing(8)
                            
                            HStack {
                                Text(formatDate(segment.timestamp))
                                    .font(.caption)
                                    .foregroundColor(.gray)
                                
                                Spacer()
                                
                                if segment.audioURL != nil {
                                    Button(action: { playAudio(segment) }) {
                                        Image(systemName: "play.circle")
                                            .foregroundColor(Color(hex: "5B8BA0"))
                                    }
                                }
                            }
                            
                            Divider()
                        }
                        .padding(.horizontal)
                    }
                }
                .padding()
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Library") {
                        appState.currentView = .library
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button(action: { fontSize = max(16, fontSize - 2) }) {
                            Label("Smaller Text", systemImage: "textformat.size.smaller")
                        }
                        
                        Button(action: { fontSize = min(32, fontSize + 2) }) {
                            Label("Larger Text", systemImage: "textformat.size.larger")
                        }
                        
                        Divider()
                        
                        Button(action: shareChapter) {
                            Label("Share", systemImage: "square.and.arrow.up")
                        }
                        
                        Button(action: { isPlaying.toggle() }) {
                            Label(isPlaying ? "Stop Reading" : "Read Aloud", 
                                  systemImage: isPlaying ? "stop.circle" : "play.circle")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
        }
        .onAppear {
            loadSegments()
        }
        .sheet(isPresented: $showingShareSheet) {
            ShareSheet(activityItems: [chapter.title, segments.map { $0.transcription }.joined(separator: "\n\n")])
        }
    }
    
    private func loadSegments() {
        Task {
            // Fetch segments for this chapter
            let allSegments = try? await cloudKit.fetchSegments()
            segments = allSegments?.filter { chapter.segments.contains($0.id.uuidString) } ?? []
        }
    }
    
    private func playAudio(_ segment: MemoirSegment) {
        // Implement audio playback
        guard let audioURL = segment.audioURL else { return }
        
        do {
            let audioPlayer = try AVAudioPlayer(contentsOf: audioURL)
            audioPlayer.play()
        } catch {
            print("Failed to play audio: \(error)")
        }
    }
    
    private func shareChapter() {
        // Share chapter as PDF or text
        showingShareSheet = true
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

// MARK: - ShareSheet Wrapper
struct ShareSheet: UIViewControllerRepresentable {
    let activityItems: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: activityItems, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {
        // No update needed
    }
}
