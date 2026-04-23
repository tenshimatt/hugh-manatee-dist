import SwiftUI

// MARK: - About Me View
// Displays all people mentioned in stories: family, friends, and associates
struct AboutMeView: View {
    @ObservedObject var profileManager: ProfileChecklistManager

    var body: some View {
        if let profile = profileManager.profileInfo {
            // Collect all people mentioned
            let people = collectPeople(from: profile)

            if !people.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    ForEach(people, id: \.id) { person in
                        PersonRow(person: person)
                    }
                }
                .padding(.vertical, 12)
            } else {
                EmptyPeopleState()
            }
        } else {
            EmptyPeopleState()
        }
    }

    // MARK: - Collect People from Profile
    func collectPeople(from profile: ProfileInfoEntity) -> [Person] {
        var people: [Person] = []

        // Add mother
        if let name = profile.motherFullName, !name.isEmpty {
            let displayName = [name, profile.motherMaidenName.map { "née \($0)" }]
                .compactMap { $0 }
                .joined(separator: " ")
            people.append(Person(
                name: displayName,
                relationship: "Mother",
                icon: "figure.dress.line.vertical.figure",
                color: .pink
            ))
        }

        // Add father
        if let name = profile.fatherFullName, !name.isEmpty {
            people.append(Person(
                name: name,
                relationship: "Father",
                icon: "figure.arms.open",
                color: .blue
            ))
        }

        // Add spouse
        if let name = profile.spouseName, !name.isEmpty {
            let displayName = [name, profile.whereMetSpouse.map { "Met in \($0)" }]
                .compactMap { $0 }
                .joined(separator: " - ")
            people.append(Person(
                name: displayName,
                relationship: "Spouse",
                icon: "heart.fill",
                color: .red
            ))
        }

        // Add children
        for childName in profile.children where !childName.isEmpty {
            people.append(Person(
                name: childName,
                relationship: "Child",
                icon: "figure.wave",
                color: .green
            ))
        }

        // Add all other people (friends, colleagues, etc.)
        for personMention in profile.people {
            let displayName = personMention.notes != nil ?
                "\(personMention.name) - \(personMention.notes!)" :
                personMention.name

            let (icon, color) = iconForRelationship(personMention.relationship)

            people.append(Person(
                name: displayName,
                relationship: personMention.relationship,
                icon: icon,
                color: color
            ))
        }

        return people
    }

    // MARK: - Icon Mapping
    func iconForRelationship(_ relationship: String) -> (icon: String, color: Color) {
        let lowercased = relationship.lowercased()

        if lowercased.contains("friend") {
            return ("person.2.fill", .orange)
        } else if lowercased.contains("colleague") || lowercased.contains("coworker") {
            return ("person.badge.shield.checkmark", .purple)
        } else if lowercased.contains("teacher") || lowercased.contains("mentor") {
            return ("graduationcap.fill", .indigo)
        } else if lowercased.contains("neighbor") {
            return ("house.fill", .teal)
        } else if lowercased.contains("sibling") || lowercased.contains("brother") || lowercased.contains("sister") {
            return ("figure.2", .cyan)
        } else {
            return ("person.fill", .gray)
        }
    }
}

// MARK: - Person Model
struct Person: Identifiable {
    let id = UUID()
    let name: String
    let relationship: String
    let icon: String
    let color: Color
}

// MARK: - Person Row Component
struct PersonRow: View {
    let person: Person

    var body: some View {
        HStack(spacing: 12) {
            // Icon circle
            Image(systemName: person.icon)
                .font(.system(size: 20))
                .foregroundColor(person.color)
                .frame(width: 40, height: 40)
                .background(person.color.opacity(0.15))
                .cornerRadius(20)

            // Person info
            VStack(alignment: .leading, spacing: 4) {
                Text(person.name)
                    .font(DesignSystem.body)
                    .foregroundColor(DesignSystem.textPrimary)

                Text(person.relationship)
                    .font(DesignSystem.caption)
                    .foregroundColor(person.color)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(person.color.opacity(0.1))
                    .cornerRadius(6)
            }

            Spacer()
        }
        .padding(.vertical, 8)
        .padding(.horizontal, 12)
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.03), radius: 2, y: 1)
    }
}

// MARK: - Empty State
struct EmptyPeopleState: View {
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "person.2.fill")
                .font(.system(size: 50))
                .foregroundColor(DesignSystem.textSecondary.opacity(0.5))

            Text("No people discovered yet")
                .font(DesignSystem.body)
                .foregroundColor(DesignSystem.textSecondary)

            Text("Record stories about family and friends to build your world!")
                .font(DesignSystem.caption)
                .foregroundColor(DesignSystem.textSecondary.opacity(0.7))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 20)
        }
        .padding(40)
    }
}

// MARK: - Preview
struct AboutMeView_Previews: PreviewProvider {
    static var previews: some View {
        AboutMeView(profileManager: ProfileChecklistManager.shared)
            .padding()
            .background(DesignSystem.backgroundBeige)
    }
}
