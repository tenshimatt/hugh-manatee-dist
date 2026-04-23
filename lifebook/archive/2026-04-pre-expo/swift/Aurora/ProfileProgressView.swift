// ProfileProgressView.swift
// Read-only view showing AI-discovered people and relationships

import SwiftUI

struct ProfileProgressView: View {
    @StateObject private var profileManager = ProfileChecklistManager.shared
    @StateObject private var populator = ProfileAutoPopulator.shared
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ZStack {
            DesignSystem.backgroundBeige
                .ignoresSafeArea()

            ScrollView {
                VStack(spacing: 20) {
                    // Header
                    VStack(spacing: 10) {
                        Image(systemName: "person.text.rectangle.fill")
                            .font(.system(size: 50))
                            .foregroundColor(DesignSystem.amber)

                        Text("About Me")
                            .font(DesignSystem.largeTitle)
                            .foregroundColor(DesignSystem.textPrimary)
                            .accessibilityIdentifier("aboutMeTitle")

                        Text("People discovered through your stories")
                            .font(DesignSystem.body)
                            .foregroundColor(DesignSystem.textSecondary)
                    }
                    .padding(.top, 20)

                    // About Me - People List
                    AboutMeView(profileManager: profileManager)
                        .padding(.horizontal, DesignSystem.largePadding)

                    // Progress Circle
                    if let profile = profileManager.profileInfo {
                        VStack(spacing: 15) {
                            ZStack {
                                Circle()
                                    .stroke(DesignSystem.warmGray, lineWidth: 20)
                                    .frame(width: 150, height: 150)

                                Circle()
                                    .trim(from: 0, to: profile.completionPercentageDouble)
                                    .stroke(DesignSystem.cornYellow, style: StrokeStyle(lineWidth: 20, lineCap: .round))
                                    .frame(width: 150, height: 150)
                                    .rotationEffect(.degrees(-90))
                                    .animation(.easeInOut(duration: 1.0), value: profile.completionPercentageDouble)

                                VStack {
                                    Text("\(profile.completionPercentage)%")
                                        .font(.system(size: 36, weight: .bold))
                                        .foregroundColor(DesignSystem.cornYellow)
                                    Text("Complete")
                                        .font(DesignSystem.caption)
                                        .foregroundColor(DesignSystem.textSecondary)
                                }
                            }

                            Text(populator.getNextSuggestedPrompt(profile: profile) ?? "Your family tree is complete!")
                                .font(DesignSystem.body)
                                .foregroundColor(DesignSystem.textSecondary)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal)
                        }
                        .padding()
                        .background(
                            RoundedRectangle(cornerRadius: DesignSystem.cardCornerRadius)
                                .fill(DesignSystem.warmCardGradient)
                        )
                        .shadow(color: DesignSystem.amberGlow, radius: 8, y: 4)
                        .padding(.horizontal, DesignSystem.largePadding)

                        // Discovered Information
                        VStack(alignment: .leading, spacing: 15) {
                            HStack {
                                Image(systemName: "sparkles")
                                    .foregroundColor(DesignSystem.amber)
                                Text("AI Discovered")
                                    .font(DesignSystem.buttonText)
                                    .foregroundColor(DesignSystem.textPrimary)
                            }

                            ForEach(profile.completedCriticalFields, id: \.self) { field in
                                HStack(spacing: 12) {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundColor(DesignSystem.sunshine)
                                        .font(.title3)

                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(field.rawValue)
                                            .font(DesignSystem.body)
                                            .foregroundColor(DesignSystem.textPrimary)

                                        if let value = profile.value(for: field) {
                                            Text(value)
                                                .font(DesignSystem.caption)
                                                .foregroundColor(DesignSystem.textSecondary)
                                        }
                                    }

                                    Spacer()
                                }
                                .padding()
                                .background(
                                    RoundedRectangle(cornerRadius: 12)
                                        .fill(DesignSystem.sunshine)
                                )
                                .shadow(color: DesignSystem.sunshine.opacity(0.3), radius: 6, y: 3)
                            }
                        }
                        .padding()
                        .background(
                            RoundedRectangle(cornerRadius: DesignSystem.cardCornerRadius)
                                .fill(DesignSystem.warmCardGradient)
                        )
                        .shadow(color: DesignSystem.amberGlow, radius: 8, y: 4)
                        .padding(.horizontal, DesignSystem.largePadding)

                        // Missing Information
                        let missingFields = ProfileInfoEntity.ProfileField.allCases.filter { field in
                            field.isCritical && !profile.completedCriticalFields.contains(field)
                        }

                        if !missingFields.isEmpty {
                            VStack(alignment: .leading, spacing: 15) {
                                HStack {
                                    Image(systemName: "info.circle")
                                        .foregroundColor(DesignSystem.textSecondary)
                                    Text("Still to Discover")
                                        .font(DesignSystem.buttonText)
                                        .foregroundColor(DesignSystem.textPrimary)
                                }

                                ForEach(missingFields, id: \.self) { field in
                                    HStack(spacing: 12) {
                                        Image(systemName: "circle")
                                            .foregroundColor(DesignSystem.textSecondary)
                                            .font(.title3)

                                        Text(field.rawValue)
                                            .font(DesignSystem.body)
                                            .foregroundColor(DesignSystem.textSecondary)

                                        Spacer()
                                    }
                                    .padding()
                                    .background(
                                        RoundedRectangle(cornerRadius: 12)
                                            .fill(
                                                LinearGradient(
                                                    colors: [DesignSystem.warmGray.opacity(0.4), DesignSystem.warmGray.opacity(0.5)],
                                                    startPoint: .topLeading,
                                                    endPoint: .bottomTrailing
                                                )
                                            )
                                    )
                                    .shadow(color: DesignSystem.warmGray.opacity(0.2), radius: 4, y: 2)
                                }

                                // AI Prompt for next recording - Tappable
                                if let prompt = populator.getNextSuggestedPrompt(profile: profile) {
                                    Button(action: {
                                        dismiss()
                                    }) {
                                        VStack(alignment: .leading, spacing: 8) {
                                            Text("💡 Suggested Next Story")
                                                .font(DesignSystem.caption)
                                                .foregroundColor(DesignSystem.textSecondary)

                                            Text("\"\(prompt)\"")
                                                .font(DesignSystem.body)
                                                .foregroundColor(DesignSystem.amber)
                                                .italic()

                                            HStack {
                                                Spacer()
                                                Image(systemName: "arrow.right.circle.fill")
                                                    .foregroundColor(DesignSystem.amber)
                                                    .font(.title2)
                                                Text("Tap to Record")
                                                    .font(DesignSystem.caption)
                                                    .foregroundColor(DesignSystem.amber)
                                            }
                                        }
                                        .padding()
                                        .background(
                                            RoundedRectangle(cornerRadius: 12)
                                                .fill(
                                                    LinearGradient(
                                                        colors: [DesignSystem.sunshine.opacity(0.15), DesignSystem.sunshine.opacity(0.25)],
                                                        startPoint: .topLeading,
                                                        endPoint: .bottomTrailing
                                                    )
                                                )
                                        )
                                        .shadow(color: DesignSystem.sunshine.opacity(0.3), radius: 6, y: 3)
                                    }
                                    .buttonStyle(PlainButtonStyle())
                                }

                                // How It Works - Only show for 1 week
                                if shouldShowHowItWorks() {
                                    VStack(alignment: .leading, spacing: 12) {
                                        HStack {
                                            Image(systemName: "lightbulb.fill")
                                                .foregroundColor(.orange)
                                            Text("How It Works")
                                                .font(DesignSystem.buttonText)
                                                .foregroundColor(DesignSystem.textPrimary)
                                        }

                                        Text("Our AI listens to your stories and automatically extracts family information. Just speak naturally about your memories, and watch your family tree grow!")
                                            .font(DesignSystem.caption)
                                            .foregroundColor(DesignSystem.textSecondary)
                                            .fixedSize(horizontal: false, vertical: true)
                                    }
                                    .padding()
                                    .background(
                                        RoundedRectangle(cornerRadius: DesignSystem.cardCornerRadius)
                                            .fill(
                                                LinearGradient(
                                                    colors: [Color.orange.opacity(0.08), Color.orange.opacity(0.12)],
                                                    startPoint: .topLeading,
                                                    endPoint: .bottomTrailing
                                                )
                                            )
                                    )
                                    .shadow(color: Color.orange.opacity(0.2), radius: 6, y: 3)
                                }
                            }
                            .padding()
                            .background(
                                RoundedRectangle(cornerRadius: DesignSystem.cardCornerRadius)
                                    .fill(DesignSystem.warmCardGradient)
                            )
                            .shadow(color: DesignSystem.amberGlow, radius: 8, y: 4)
                            .padding(.horizontal, DesignSystem.largePadding)
                        }
                    }

                    // Bottom padding
                    Color.clear.frame(height: 100)
                }
            }
        }
        .navigationBarBackButtonHidden(true)
        .navigationBarItems(leading: BackButton())
    }

    // MARK: - Helper Methods

    private func shouldShowHowItWorks() -> Bool {
        let key = "ProfileProgressView.HowItWorks.FirstShownDate"
        let now = Date()

        // Get or set the first shown date
        if let firstShownDate = UserDefaults.standard.object(forKey: key) as? Date {
            // Check if less than 1 week has passed
            let oneWeekAgo = Calendar.current.date(byAdding: .day, value: -7, to: now)!
            return firstShownDate > oneWeekAgo
        } else {
            // First time showing - record the date
            UserDefaults.standard.set(now, forKey: key)
            return true
        }
    }
}

// MARK: - ProfileInfoEntity Extensions for Display

extension ProfileInfoEntity {
    func value(for field: ProfileField) -> String? {
        switch field {
        case .fullName:
            return fullName
        case .dateOfBirth:
            if let date = dateOfBirth {
                let formatter = DateFormatter()
                formatter.dateStyle = .long
                return formatter.string(from: date)
            }
            return nil
        case .placeOfBirth:
            return placeOfBirth
        case .motherFullName:
            return motherFullName
        case .motherMaidenName:
            return motherMaidenName
        case .motherBirthplace:
            return motherBirthplace
        case .fatherFullName:
            return fatherFullName
        case .fatherBirthplace:
            return fatherBirthplace
        case .spouseName:
            return spouseName
        case .whereMetSpouse:
            return whereMetSpouse
        }
    }
}

// MARK: - Preview
struct ProfileProgressView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationStack {
            ProfileProgressView()
        }
    }
}
