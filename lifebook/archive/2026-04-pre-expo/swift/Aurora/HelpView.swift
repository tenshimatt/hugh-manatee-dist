import SwiftUI

// MARK: - Help View
struct HelpView: View {
    @State private var expandedSection: String? = nil
    
    let helpSections = [
        HelpSection(
            icon: "mic.circle.fill",
            title: "Recording a Memory",
            content: "Tap the big round button on the home screen to start recording. Talk naturally - there's no time limit. When you're done, tap the button again to stop."
        ),
        HelpSection(
            icon: "play.circle.fill",
            title: "Listening to Your Stories",
            content: "Go to 'My Stories' to see all your recordings. Tap the play button on any story to listen. You can pause anytime by tapping again."
        ),
        HelpSection(
            icon: "folder.fill",
            title: "Organizing Memories",
            content: "Your recordings are automatically saved and organized. You can add titles to make them easier to find later."
        ),
        HelpSection(
            icon: "person.2.fill",
            title: "Sharing with Family",
            content: "This feature is coming soon! You'll be able to share your stories with loved ones easily."
        )
    ]
    
    var body: some View {
        ZStack {
            DesignSystem.backgroundBeige
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Header
                VStack(spacing: 10) {
                    Image(systemName: "questionmark.circle.fill")
                        .font(.system(size: 60))
                        .foregroundColor(DesignSystem.amber)

                    Text("How Can We Help?")
                        .font(DesignSystem.largeTitle)
                        .foregroundColor(DesignSystem.textPrimary)
                    
                    Text("Tap any topic below to learn more")
                        .font(DesignSystem.body)
                        .foregroundColor(DesignSystem.textSecondary)
                }
                .padding(.top, 30)
                .padding(.bottom, 20)
                
                ScrollView {
                    VStack(spacing: 15) {
                        // Help Topics
                        ForEach(helpSections) { section in
                            HelpCard(
                                section: section,
                                isExpanded: expandedSection == section.id,
                                onTap: {
                                    withAnimation(.spring(response: 0.4)) {
                                        if expandedSection == section.id {
                                            expandedSection = nil
                                        } else {
                                            expandedSection = section.id
                                        }
                                    }
                                }
                            )
                        }
                        .padding(.horizontal, DesignSystem.largePadding)
                        
                        // Contact Section
                        VStack(spacing: 20) {
                            Text("Still need help?")
                                .font(DesignSystem.title)
                                .foregroundColor(DesignSystem.textPrimary)
                            
                            VStack(spacing: 15) {
                                ContactButton(
                                    icon: "phone.fill",
                                    title: "Call Support",
                                    subtitle: "Mon-Fri, 9am-5pm",
                                    action: {}
                                )
                                
                                ContactButton(
                                    icon: "envelope.fill",
                                    title: "Email Us",
                                    subtitle: "help@lifebook.com",
                                    action: {}
                                )
                            }
                            .padding(.horizontal, DesignSystem.largePadding)
                        }
                        .padding(.top, 30)
                        .padding(.bottom, 100)
                    }
                }
            }
        }
        .navigationBarBackButtonHidden(true)
        .navigationBarItems(leading: BackButton())
    }
}

// MARK: - Help Section Model
struct HelpSection: Identifiable {
    let id = UUID().uuidString
    let icon: String
    let title: String
    let content: String
}

// MARK: - Help Card
struct HelpCard: View {
    let section: HelpSection
    let isExpanded: Bool
    let onTap: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Button(action: onTap) {
                HStack {
                    Image(systemName: section.icon)
                        .font(.title2)
                        .foregroundColor(DesignSystem.amber)
                        .frame(width: 40)

                    Text(section.title)
                        .font(DesignSystem.buttonText)
                        .foregroundColor(DesignSystem.textPrimary)

                    Spacer()

                    Image(systemName: "chevron.down")
                        .font(.body.weight(.semibold))
                        .foregroundColor(DesignSystem.amber)
                        .rotationEffect(.degrees(isExpanded ? 180 : 0))
                }
                .padding(20)
            }
            
            if isExpanded {
                Text(section.content)
                    .font(DesignSystem.body)
                    .foregroundColor(DesignSystem.textPrimary)
                    .padding(.horizontal, 20)
                    .padding(.bottom, 20)
                    .padding(.top, -5)
                    .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .background(Color.white)
        .cornerRadius(DesignSystem.cardCornerRadius)
        .shadow(color: .black.opacity(0.05), radius: 5, y: 2)
    }
}

// MARK: - Contact Button
struct ContactButton: View {
    let icon: String
    let title: String
    let subtitle: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(DesignSystem.amber)
                    .frame(width: 40)

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(DesignSystem.buttonText)
                        .foregroundColor(DesignSystem.textPrimary)
                    Text(subtitle)
                        .font(DesignSystem.caption)
                        .foregroundColor(DesignSystem.textSecondary)
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.body)
                    .foregroundColor(DesignSystem.amber)
            }
            .padding()
            .background(Color.white)
            .cornerRadius(DesignSystem.cardCornerRadius)
            .shadow(color: .black.opacity(0.05), radius: 5, y: 2)
        }
    }
}

// MARK: - Preview
struct HelpView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationStack {
            HelpView()
        }
    }
}
