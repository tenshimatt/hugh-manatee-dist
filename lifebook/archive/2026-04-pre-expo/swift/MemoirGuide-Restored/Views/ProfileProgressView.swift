// ProfileProgressView.swift
// Read-only view showing AI-discovered family tree information

import SwiftUI

struct ProfileProgressView: View {
    @EnvironmentObject var profileManager: ProfileChecklistManager
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
                            .foregroundColor(DesignSystem.primaryTeal)

                        Text("Your Family Tree")
                            .font(DesignSystem.largeTitle)
                            .foregroundColor(DesignSystem.textPrimary)
                            .accessibilityIdentifier("familyTreeTitle")

                        Text("Discovered through your stories")
                            .font(DesignSystem.body)
                            .foregroundColor(DesignSystem.textSecondary)
                    }
                    .padding(.top, 20)

                    // Progress Circle
                    if let profile = profileManager.profileInfo {
                        VStack(spacing: 15) {
                            ZStack {
                                Circle()
                                    .stroke(DesignSystem.warmGray, lineWidth: 20)
                                    .frame(width: 150, height: 150)

                                Circle()
                                    .trim(from: 0, to: profile.completionPercentageDouble)
                                    .stroke(DesignSystem.primaryTeal, style: StrokeStyle(lineWidth: 20, lineCap: .round))
                                    .frame(width: 150, height: 150)
                                    .rotationEffect(.degrees(-90))
                                    .animation(.easeInOut(duration: 1.0), value: profile.completionPercentageDouble)

                                VStack {
                                    Text("\(profile.completionPercentage)%")
                                        .font(.system(size: 36, weight: .bold))
                                        .foregroundColor(DesignSystem.primaryTeal)
                                    Text("Complete")
                                        .font(DesignSystem.caption)
                                        .foregroundColor(DesignSystem.textSecondary)
                                }
                            }

                            Text(profileManager.progressMessage)
                                .font(DesignSystem.body)
                                .foregroundColor(DesignSystem.textSecondary)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal)
                        }
                        .padding()
                        .background(Color.white)
                        .cornerRadius(DesignSystem.cardCornerRadius)
                        .shadow(color: .black.opacity(0.05), radius: 5, y: 2)
                        .padding(.horizontal, DesignSystem.largePadding)

                        // Completed Fields
                        let completedFields = profile.completedCriticalFields
                        if !completedFields.isEmpty {
                            VStack(alignment: .leading, spacing: 15) {
                                HStack {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundColor(.green)
                                    Text("Discovered Information")
                                        .font(DesignSystem.buttonText)
                                        .foregroundColor(DesignSystem.textPrimary)
                                }

                                ForEach(completedFields, id: \.self) { field in
                                    HStack(spacing: 12) {
                                        Image(systemName: "checkmark.circle.fill")
                                            .foregroundColor(.green)
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
                                    .background(Color.green.opacity(0.05))
                                    .cornerRadius(12)
                                }
                            }
                            .padding()
                            .background(Color.white)
                            .cornerRadius(DesignSystem.cardCornerRadius)
                            .shadow(color: .black.opacity(0.05), radius: 5, y: 2)
                            .padding(.horizontal, DesignSystem.largePadding)
                        }

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
                                    .background(DesignSystem.warmGray.opacity(0.5))
                                    .cornerRadius(12)
                                }

                                // Suggested prompt
                                VStack(alignment: .leading, spacing: 8) {
                                    Text("💡 Suggested Next Story")
                                        .font(DesignSystem.caption)
                                        .foregroundColor(DesignSystem.textSecondary)

                                    Text(getSuggestedPrompt(for: missingFields.first))
                                        .font(DesignSystem.body)
                                        .foregroundColor(DesignSystem.primaryTeal)
                                        .italic()

                                    HStack {
                                        Spacer()
                                        Button(action: {
                                            dismiss()
                                        }) {
                                            HStack {
                                                Image(systemName: "arrow.right.circle.fill")
                                                    .foregroundColor(DesignSystem.primaryTeal)
                                                    .font(.title2)
                                                Text("Tap to Record")
                                                    .font(DesignSystem.caption)
                                                    .foregroundColor(DesignSystem.primaryTeal)
                                            }
                                        }
                                    }
                                }
                                .padding()
                                .background(DesignSystem.primaryTeal.opacity(0.1))
                                .cornerRadius(12)

                                // How It Works
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
                                .background(Color.orange.opacity(0.1))
                                .cornerRadius(DesignSystem.cardCornerRadius)
                            }
                            .padding()
                            .background(Color.white)
                            .cornerRadius(DesignSystem.cardCornerRadius)
                            .shadow(color: .black.opacity(0.05), radius: 5, y: 2)
                            .padding(.horizontal, DesignSystem.largePadding)
                        }
                    } else {
                        // Loading state
                        VStack(spacing: 15) {
                            ProgressView()
                                .scaleEffect(1.5)
                            Text("Loading profile...")
                                .font(DesignSystem.body)
                                .foregroundColor(DesignSystem.textSecondary)
                        }
                        .padding(.top, 60)
                    }

                    // Bottom padding
                    Color.clear.frame(height: 50)
                }
            }
        }
        .navigationBarBackButtonHidden(true)
        .navigationBarItems(leading: BackButton())
    }

    func getSuggestedPrompt(for field: ProfileInfoEntity.ProfileField?) -> String {
        guard let field = field else {
            return "Tell me about a favorite childhood memory."
        }

        switch field {
        case .fullName:
            return "Tell me about yourself - what's your full name and where were you born?"
        case .dateOfBirth:
            return "When were you born? Tell me about that day or what you know about it."
        case .placeOfBirth:
            return "Where were you born? Describe the place."
        case .motherFullName, .motherMaidenName:
            return "Tell me about your mother. What was her name?"
        case .motherBirthplace:
            return "Where was your mother born? What do you know about her hometown?"
        case .fatherFullName:
            return "Tell me about your father. What was his name?"
        case .fatherBirthplace:
            return "Where was your father born? What do you know about his hometown?"
        case .whereParentsMet:
            return "How did your parents meet? Tell me that story."
        case .spouseName:
            return "Tell me about your spouse. What's their name?"
        case .whereMetSpouse:
            return "How did you meet your spouse? Share that special memory."
        }
    }
}

// MARK: - Preview
struct ProfileProgressView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationStack {
            ProfileProgressView()
                .environmentObject(ProfileChecklistManager.shared)
        }
    }
}
