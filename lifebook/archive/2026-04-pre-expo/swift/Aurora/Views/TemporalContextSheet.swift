import SwiftUI

struct TemporalContextSheet: View {
    @Environment(\.dismiss) var dismiss
 
    @ObservedObject private var dataManager = RecordingDataManager.shared

    let story: Story
    let onEnhance: (TemporalContextService.TemporalEnhancement) -> Void

    @State private var selectedYear: Int = Calendar.current.component(.year, from: Date())
    @State private var location: String = ""
    @State private var isEnhancing = false

    var body: some View {
        NavigationView {
            ZStack {
                DesignSystem.backgroundBeige
                    .ignoresSafeArea()

                VStack(spacing: 24) {
                    // Header with WALL-E inspiration
                    VStack(spacing: 8) {
                        Image(systemName: "clock.arrow.circlepath")
                            .font(.system(size: 48))
                            .foregroundColor(DesignSystem.amber)

                        Text("Reconstruct the Era")
                            .font(DesignSystem.largeTitle)
                            .foregroundColor(DesignSystem.textPrimary)

                        Text("Help me paint the world your memory lived in")
                            .font(DesignSystem.body)
                            .foregroundColor(DesignSystem.textSecondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.top, 40)

                    // Year/Decade Picker
                    VStack(alignment: .leading, spacing: 12) {
                        Text("When did this happen?")
                            .font(DesignSystem.title)
                            .foregroundColor(DesignSystem.textPrimary)

                        Picker("Year", selection: $selectedYear) {
                            ForEach(1920...2024, id: \.self) { year in
                                Text(String(year))
                                    .tag(year)
                            }
                        }
                        .pickerStyle(.wheel)
                        .frame(height: 150)
                        .background(
                            RoundedRectangle(cornerRadius: 16)
                                .fill(DesignSystem.warmCardGradient)
                        )
                    }
                    .padding(.horizontal, 24)

                    // Location (Optional)
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Where? (Optional)")
                            .font(DesignSystem.title)
                            .foregroundColor(DesignSystem.textPrimary)

                        TextField("e.g., Brooklyn, New York", text: $location)
                            .textFieldStyle(.plain)
                            .font(DesignSystem.body)
                            .padding()
                            .background(
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(DesignSystem.whiteSubtleGradient)
                            )
                            .shadow(color: DesignSystem.amberGlow, radius: 4, y: 2)
                    }
                    .padding(.horizontal, 24)

                    Spacer()

                    // Action Buttons
                    VStack(spacing: 12) {
                        // Enhance Button
                        Button(action: enhanceStory) {
                            HStack(spacing: 12) {
                                if isEnhancing {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                } else {
                                    Image(systemName: "sparkles")
                                    Text("Reconstruct This Memory")
                                }
                            }
                            .font(DesignSystem.buttonText)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 60)
                            .background(DesignSystem.deepNavy)
                            .cornerRadius(DesignSystem.cornerRadius)
                            .shadow(color: DesignSystem.deepNavy.opacity(0.3), radius: 8, y: 4)
                        }
                        .disabled(isEnhancing)

                        // Skip Button
                        Button(action: { dismiss() }) {
                            Text("Skip for Now")
                                .font(DesignSystem.body)
                                .foregroundColor(DesignSystem.textSecondary)
                        }
                    }
                    .padding(.horizontal, 24)
                    .padding(.bottom, 40)
                }
            }
            .navigationBarHidden(true)
        }
    }

    func enhanceStory() {
        isEnhancing = true

        Task {
            do {
                // Get all recordings for this story and combine transcriptions
                let recordings = story.getRecordings(from: dataManager)
                let combinedTranscription = recordings
                    .compactMap { $0.transcription }
                    .joined(separator: "\n\n")

                // Create temporal context
                let context = TemporalContextService.TemporalContext(
                    year: selectedYear,
                    location: location.isEmpty ? nil : location,
                    keywords: []
                )

                // Enhance with temporal context
                let enhancement = try await TemporalContextService.shared.enhanceWithTemporalContext(
                    transcription: combinedTranscription,
                    context: context
                )

                await MainActor.run {
                    onEnhance(enhancement)
                    dismiss()
                }
            } catch {
                print("❌ [TemporalContext] Enhancement failed: \(error)")
                await MainActor.run {
                    isEnhancing = false
                }
            }
        }
    }
}

// MARK: - Preview
#if DEBUG
struct TemporalContextSheet_Previews: PreviewProvider {
    static var previews: some View {
        TemporalContextSheet(
            story: Story(
                title: "Summer of '65",
                emoji: "🌊",
                category: "Childhood"
            ),
            onEnhance: { enhancement in
                print("Enhanced: \(enhancement)")
            }
        )
    }
}
#endif
