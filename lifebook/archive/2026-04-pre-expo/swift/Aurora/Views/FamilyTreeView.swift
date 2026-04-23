import SwiftUI

// MARK: - Interactive Family Tree View
// Visualizes family relationships discovered through AI extraction
struct FamilyTreeView: View {
    @ObservedObject var profileManager: ProfileChecklistManager

    var body: some View {
        VStack(spacing: 20) {
            Text("My Family Tree")
                .font(DesignSystem.title)
                .foregroundColor(DesignSystem.textPrimary)

            if let profile = profileManager.profileInfo {
                // Parents Row
                HStack(spacing: 40) {
                    // Mother
                    FamilyMemberCard(
                        name: profile.motherFullName,
                        subtitle: profile.motherMaidenName.map { "née \($0)" },
                        relation: "Mother",
                        icon: "figure.dress.line.vertical.figure",
                        color: .pink
                    )

                    // Father
                    FamilyMemberCard(
                        name: profile.fatherFullName,
                        subtitle: nil,
                        relation: "Father",
                        icon: "figure.arms.open",
                        color: .blue
                    )
                }

                // Connection line to user
                Rectangle()
                    .fill(DesignSystem.primaryTeal.opacity(0.3))
                    .frame(width: 2, height: 30)

                // User (Center)
                FamilyMemberCard(
                    name: profile.fullName ?? "Me",
                    subtitle: profile.dateOfBirth.map { formatDate($0) },
                    relation: "Me",
                    icon: "person.fill.checkmark",
                    color: DesignSystem.primaryTeal,
                    isHighlighted: true
                )

                // Connection line to spouse
                if profile.spouseName != nil {
                    Rectangle()
                        .fill(DesignSystem.primaryTeal.opacity(0.3))
                        .frame(width: 2, height: 30)

                    // Spouse
                    FamilyMemberCard(
                        name: profile.spouseName,
                        subtitle: profile.whereMetSpouse.map { "Met in \($0)" },
                        relation: "Spouse",
                        icon: "heart.fill",
                        color: .red
                    )
                }

                // Children (if any)
                if !profile.children.isEmpty {
                    Rectangle()
                        .fill(DesignSystem.primaryTeal.opacity(0.3))
                        .frame(width: 2, height: 30)

                    Text("Children")
                        .font(DesignSystem.caption)
                        .foregroundColor(DesignSystem.textSecondary)
                        .padding(.bottom, 5)

                    // Display children in rows of 2
                    let childrenChunks = stride(from: 0, to: profile.children.count, by: 2).map {
                        Array(profile.children[$0..<min($0 + 2, profile.children.count)])
                    }

                    ForEach(Array(childrenChunks.enumerated()), id: \.offset) { index, chunk in
                        HStack(spacing: 20) {
                            ForEach(chunk, id: \.self) { childName in
                                FamilyMemberCard(
                                    name: childName,
                                    subtitle: nil,
                                    relation: "Child",
                                    icon: "figure.wave",
                                    color: .green
                                )
                            }
                        }
                    }
                }
            } else {
                // Empty state when no profile data
                VStack(spacing: 12) {
                    Image(systemName: "person.2.fill")
                        .font(.system(size: 50))
                        .foregroundColor(DesignSystem.textSecondary.opacity(0.5))

                    Text("Your family tree will appear here")
                        .font(DesignSystem.body)
                        .foregroundColor(DesignSystem.textSecondary)

                    Text("Start recording your memories to build it!")
                        .font(DesignSystem.caption)
                        .foregroundColor(DesignSystem.textSecondary.opacity(0.7))
                }
                .padding(40)
            }
        }
        .padding(20)
        .background(Color.white)
        .cornerRadius(DesignSystem.cardCornerRadius)
        .shadow(color: .black.opacity(0.05), radius: 5, y: 2)
    }

    func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }
}

// MARK: - Family Member Card Component
struct FamilyMemberCard: View {
    let name: String?
    let subtitle: String?
    let relation: String
    let icon: String
    let color: Color
    var isHighlighted: Bool = false

    var body: some View {
        VStack(spacing: 8) {
            // Icon
            Image(systemName: icon)
                .font(.system(size: isHighlighted ? 40 : 30))
                .foregroundColor(color)
                .frame(width: 60, height: 60)
                .background(color.opacity(0.15))
                .cornerRadius(30)

            // Name or placeholder
            if let name = name, !name.isEmpty {
                Text(name)
                    .font(isHighlighted ? DesignSystem.buttonText : DesignSystem.body)
                    .foregroundColor(DesignSystem.textPrimary)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
            } else {
                Text("Unknown")
                    .font(DesignSystem.body)
                    .foregroundColor(DesignSystem.textSecondary.opacity(0.5))
                    .italic()
            }

            // Subtitle (maiden name, birth date, etc.)
            if let subtitle = subtitle, !subtitle.isEmpty {
                Text(subtitle)
                    .font(DesignSystem.caption)
                    .foregroundColor(DesignSystem.textSecondary)
                    .multilineTextAlignment(.center)
                    .lineLimit(1)
            }

            // Relation label
            Text(relation)
                .font(DesignSystem.caption)
                .foregroundColor(color)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(color.opacity(0.1))
                .cornerRadius(8)
        }
        .frame(width: 140)
        .padding(.vertical, 10)
        .background(isHighlighted ? color.opacity(0.05) : Color.clear)
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(isHighlighted ? color.opacity(0.3) : Color.clear, lineWidth: 2)
        )
    }
}

// MARK: - Preview
struct FamilyTreeView_Previews: PreviewProvider {
    static var previews: some View {
        FamilyTreeView(profileManager: ProfileChecklistManager.shared)
            .padding()
            .background(DesignSystem.backgroundBeige)
    }
}
