// StoryDetailView.swift
// Detailed view for a single story with playback controls

import SwiftUI

struct StoryDetailView: View {
    let chapter: ChapterEntity
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var audioPlayer: AudioPlaybackManager
    @EnvironmentObject var appState: AppState
    @State private var showingAllSegments = false

    var isCurrentlyPlaying: Bool {
        audioPlayer.currentStory?.id == chapter.id && audioPlayer.isPlaying
    }

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Header section
                    headerSection

                    // Primary action buttons: Play and Record side by side
                    primaryActionsSection

                    // Playback controls (if playing)
                    if isCurrentlyPlaying || (audioPlayer.currentStory?.id == chapter.id && !audioPlayer.isPlaying) {
                        playbackControlsSection
                    }

                    // Story metadata
                    metadataSection

                    // Recordings list
                    recordingsSection

                    Spacer(minLength: 100)
                }
                .padding()
            }
            .background(Color(UIColor.systemGroupedBackground))
            .navigationBarItems(
                trailing: Button("Close") {
                    dismiss()
                }
            )
        }
    }

    // MARK: - Header Section

    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Story title
            Text(chapter.chapterTitle)
                .font(.largeTitle)
                .foregroundColor(.charcoal)

            // Status badge
            HStack {
                Image(systemName: "book.fill")
                    .foregroundColor(.primaryTheme)
                Text(chapter.chapterStatus.displayName)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.primaryTheme)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Color.primaryTheme.opacity(0.1))
            .cornerRadius(8)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Primary Actions Section (Play & Record buttons side by side)

    private var primaryActionsSection: some View {
        HStack(spacing: 16) {
            // Play Story button (left)
            Button(action: handlePlayButton) {
                VStack(spacing: 12) {
                    ZStack {
                        Circle()
                            .fill(Color.primaryTheme)
                            .frame(width: 80, height: 80)
                            .shadow(color: Color.primaryTheme.opacity(0.3), radius: 8, x: 0, y: 4)

                        if audioPlayer.isLoading && audioPlayer.currentStory?.id == chapter.id {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .scaleEffect(1.3)
                        } else if isCurrentlyPlaying {
                            Image(systemName: "pause.fill")
                                .font(.system(size: 32))
                                .foregroundColor(.white)
                        } else {
                            Image(systemName: "play.fill")
                                .font(.system(size: 32))
                                .foregroundColor(.white)
                                .offset(x: 2)
                        }
                    }

                    Text(isCurrentlyPlaying ? "Pause" : "Play Story")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.charcoal)
                }
            }
            .buttonStyle(ScaleButtonStyle())
            .frame(maxWidth: .infinity)
            .padding(.vertical, 20)
            .background(Color.white)
            .cornerRadius(16)
            .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
            .accessibilityLabel(isCurrentlyPlaying ? "Pause story" : "Play story")

            // Add Recording button (right)
            Button(action: handleAddRecording) {
                VStack(spacing: 12) {
                    ZStack {
                        Circle()
                            .fill(Color.red)
                            .frame(width: 80, height: 80)
                            .shadow(color: Color.red.opacity(0.3), radius: 8, x: 0, y: 4)

                        Image(systemName: "mic.fill")
                            .font(.system(size: 32))
                            .foregroundColor(.white)
                    }

                    Text("Add Recording")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.charcoal)
                        .multilineTextAlignment(.center)
                }
            }
            .buttonStyle(ScaleButtonStyle())
            .frame(maxWidth: .infinity)
            .padding(.vertical, 20)
            .background(Color.white)
            .cornerRadius(16)
            .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
            .accessibilityLabel("Add new recording to this story")
            .accessibilityHint("Tap to start recording and add to this story")
        }
    }

    // MARK: - Playback Controls Section (shown when playing)

    private var playbackControlsSection: some View {
        VStack(spacing: 16) {
            playbackControls
        }
        .padding(.vertical, 20)
        .padding(.horizontal, 16)
        .frame(maxWidth: .infinity)
        .background(Color.white)
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
    }

    private var playbackControls: some View {
        VStack(spacing: 16) {
            // Progress bar
            VStack(spacing: 8) {
                Slider(value: Binding(
                    get: { audioPlayer.currentTime },
                    set: { audioPlayer.seek(to: $0) }
                ), in: 0...max(audioPlayer.duration, 1))
                    .accentColor(.primaryTheme)

                HStack {
                    Text(audioPlayer.formatTime(audioPlayer.currentTime))
                        .font(.caption)
                        .foregroundColor(.gray)
                    Spacer()
                    Text(audioPlayer.formatTime(audioPlayer.duration))
                        .font(.caption)
                        .foregroundColor(.gray)
                }
            }
            .padding(.horizontal)

            // Skip buttons
            HStack(spacing: 40) {
                Button(action: { audioPlayer.skipBackward(10) }) {
                    Image(systemName: "gobackward.10")
                        .font(.title2)
                        .foregroundColor(.primaryTheme)
                }
                .frame(width: 44, height: 44)

                Button(action: { audioPlayer.skipForward(10) }) {
                    Image(systemName: "goforward.10")
                        .font(.title2)
                        .foregroundColor(.primaryTheme)
                }
                .frame(width: 44, height: 44)
            }

            // Playback speed
            HStack(spacing: 12) {
                Text("Speed:")
                    .font(.caption)
                    .foregroundColor(.gray)

                ForEach([0.5, 1.0, 1.5, 2.0], id: \.self) { speed in
                    Button(action: { audioPlayer.setPlaybackRate(Float(speed)) }) {
                        Text("\(speed, specifier: "%.1f")x")
                            .font(.caption)
                            .foregroundColor(audioPlayer.playbackRate == Float(speed) ? .primaryTheme : .gray)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(audioPlayer.playbackRate == Float(speed) ? Color.primaryTheme.opacity(0.1) : Color.clear)
                            .cornerRadius(8)
                    }
                }
            }
        }
    }

    // MARK: - Metadata Section

    private var metadataSection: some View {
        VStack(spacing: 12) {
            MetadataRow(icon: "calendar", label: "Created", value: chapter.createdAt?.timeAgoDisplay() ?? "Unknown")
            MetadataRow(icon: "waveform", label: "Recordings", value: "\(chapter.sessionsArray.count)")
            MetadataRow(icon: "clock", label: "Duration", value: chapter.formattedDuration)
            MetadataRow(icon: "text.alignleft", label: "Words", value: "\(chapter.computedWordCount)")
            MetadataRow(icon: "book.pages", label: "Reading Time", value: "\(max(1, chapter.computedWordCount / 250)) min")

            if let summary = chapter.aiGeneratedSummary, !summary.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Image(systemName: "sparkles")
                            .foregroundColor(.secondaryTheme)
                        Text("AI Summary")
                            .font(.headline)
                            .foregroundColor(.charcoal)
                    }
                    Text(summary)
                        .font(.body)
                        .foregroundColor(.gray)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding()
                .background(Color.secondaryTheme.opacity(0.1))
                .cornerRadius(12)
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
    }

    // MARK: - Recordings Section

    private var recordingsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Recordings")
                    .font(.headline)
                    .foregroundColor(.charcoal)
                Spacer()
                Text("\(chapter.sessionsArray.count) total")
                    .font(.caption)
                    .foregroundColor(.gray)
            }

            ForEach(chapter.sessionsArray.prefix(showingAllSegments ? 100 : 3), id: \.id) { session in
                SessionRow(session: session)
            }

            if chapter.sessionsArray.count > 3 {
                Button(action: { showingAllSegments.toggle() }) {
                    HStack {
                        Text(showingAllSegments ? "Show less" : "Show all \(chapter.sessionsArray.count) recordings")
                            .font(.subheadline)
                            .foregroundColor(.primaryTheme)
                        Image(systemName: showingAllSegments ? "chevron.up" : "chevron.down")
                            .foregroundColor(.primaryTheme)
                    }
                }
                .padding(.top, 8)
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
    }

    // MARK: - Actions

    private func handlePlayButton() {
        let generator = UIImpactFeedbackGenerator(style: .medium)
        generator.impactOccurred()

        if isCurrentlyPlaying {
            audioPlayer.pause()
        } else if audioPlayer.currentStory?.id == chapter.id && !audioPlayer.isPlaying {
            audioPlayer.resume()
        } else {
            Task {
                await audioPlayer.playStory(chapter)
            }
        }
    }

    private func handleAddRecording() {
        let generator = UIImpactFeedbackGenerator(style: .heavy)
        generator.impactOccurred()

        // Announce action for accessibility
        UIAccessibility.post(notification: .announcement, argument: "Opening recorder for \(chapter.chapterTitle)")

        // Navigate to recording view
        dismiss()
        // Small delay to allow dismiss animation
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            appState.currentView = .recording
        }
    }
}

// MARK: - Supporting Views

struct MetadataRow: View {
    let icon: String
    let label: String
    let value: String

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(.primaryTheme)
                .frame(width: 24)
            Text(label)
                .font(.subheadline)
                .foregroundColor(.gray)
            Spacer()
            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.charcoal)
        }
    }
}

struct SessionRow: View {
    let session: MemoirSessionEntity

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "waveform.circle.fill")
                .foregroundColor(.accentInteractive)
                .font(.title3)

            VStack(alignment: .leading, spacing: 4) {
                Text("Session \(session.sessionNumber)")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.charcoal)

                Text(session.createdAt?.timeAgoDisplay() ?? "Unknown")
                    .font(.caption)
                    .foregroundColor(.gray)
            }

            Spacer()

            Text(session.formattedDuration)
                .font(.caption)
                .foregroundColor(.gray)
        }
        .padding()
        .background(Color(UIColor.systemGray6))
        .cornerRadius(12)
    }
}

struct ScaleButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: configuration.isPressed)
    }
}