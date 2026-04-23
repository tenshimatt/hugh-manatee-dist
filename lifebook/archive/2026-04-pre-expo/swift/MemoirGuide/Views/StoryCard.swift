// StoryCard.swift
// Card component for displaying stories with play button

import SwiftUI

struct StoryCard: View {
    let chapter: ChapterEntity
    @EnvironmentObject var audioPlayer: AudioPlaybackManager
    @EnvironmentObject var appState: AppState
    @State private var showDetail = false
    @State private var isPressed = false

    var isCurrentlyPlaying: Bool {
        audioPlayer.currentStory?.id == chapter.id && audioPlayer.isPlaying
    }

    var body: some View {
        Button(action: {
            showDetail = true
        }) {
            ZStack(alignment: .bottomTrailing) {
                // Card background
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color.white)
                    .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 4)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(isCurrentlyPlaying ? Color.primaryTheme : Color.clear, lineWidth: 3)
                    )

                VStack(alignment: .leading, spacing: 12) {
                    // Story title
                    Text(chapter.chapterTitle)
                        .font(.title3)
                        .fontWeight(.semibold)
                        .foregroundColor(.charcoal)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    // Story metadata
                    HStack(spacing: 16) {
                        Label("\(chapter.sessionsArray.count) recording\(chapter.sessionsArray.count == 1 ? "" : "s")", systemImage: "waveform")
                            .font(.caption)
                            .foregroundColor(.gray)

                        Label(chapter.formattedDuration, systemImage: "clock")
                            .font(.caption)
                            .foregroundColor(.gray)
                    }

                    // Word count
                    Text("\(chapter.computedWordCount) words")
                        .font(.caption)
                        .foregroundColor(.gray)

                    Spacer()
                }
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)

                // Play button overlay
                playButton
                    .padding(12)
            }
            .frame(height: 160)
        }
        .buttonStyle(CardButtonStyle(isPressed: $isPressed))
        .sheet(isPresented: $showDetail) {
            StoryDetailView(chapter: chapter)
                .environmentObject(audioPlayer)
                .environmentObject(appState)
        }
    }

    private var playButton: some View {
        Button(action: {
            handlePlayButton()
        }) {
            ZStack {
                Circle()
                    .fill(Color.accentInteractive)
                    .frame(width: 60, height: 60)
                    .shadow(color: .black.opacity(0.2), radius: 4, x: 0, y: 2)

                if audioPlayer.isLoading && audioPlayer.currentStory?.id == chapter.id {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                } else if isCurrentlyPlaying {
                    Image(systemName: "pause.fill")
                        .font(.system(size: 24))
                        .foregroundColor(.white)
                } else {
                    Image(systemName: "play.fill")
                        .font(.system(size: 24))
                        .foregroundColor(.white)
                        .offset(x: 2) // Optical alignment
                }
            }
        }
        .buttonStyle(PlayButtonStyle())
    }

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
}

// MARK: - Button Styles

struct CardButtonStyle: ButtonStyle {
    @Binding var isPressed: Bool

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
            .onChange(of: configuration.isPressed) { newValue in
                isPressed = newValue
            }
    }
}

struct PlayButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.9 : 1.0)
            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: configuration.isPressed)
    }
}

// MARK: - Preview

struct StoryCard_Previews: PreviewProvider {
    static var previews: some View {
        let context = CoreDataManager.shared.context
        let chapter = ChapterEntity(context: context)
        chapter.title = "My Childhood Adventures"
        chapter.chapterNumber = 1
        chapter.totalDuration = 1800
        chapter.totalWordCount = 2500

        return StoryCard(chapter: chapter)
            .environmentObject(AudioPlaybackManager.shared)
            .padding()
            .previewLayout(.sizeThatFits)
    }
}