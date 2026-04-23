import SwiftUI

struct CreateStorySheet: View {
    @Environment(\.dismiss) var dismiss
    @Binding var stories: [Story]
    var onCreate: (Story) -> Void

    @State private var title = ""
    @State private var selectedEmoji = "📖"
    @State private var selectedCategory = "General"

    var body: some View {
        NavigationView {
            ZStack {
                DesignSystem.backgroundBeige
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 25) {
                        // Title field
                        TextField("Story Title", text: $title)
                            .font(DesignSystem.body)
                            .padding()
                            .frame(height: 55)
                            .background(Color.white)
                            .cornerRadius(12)


                        // Emoji picker
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Pick an Emoji")
                                .font(DesignSystem.body)
                                .foregroundColor(DesignSystem.textSecondary)

                            LazyVGrid(columns: [GridItem(.adaptive(minimum: 50))], spacing: 10) {
                                ForEach(Story.emojis, id: \.self) { emoji in
                                    Button(emoji) {
                                        selectedEmoji = emoji
                                    }
                                    .font(.system(size: 40))
                                    .frame(width: 50, height: 50)
                                    .background(selectedEmoji == emoji ? DesignSystem.primaryTeal.opacity(0.2) : Color.clear)
                                    .cornerRadius(8)
                                }
                            }
                        }

                        // Category picker
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Category")
                                .font(DesignSystem.body)
                                .foregroundColor(DesignSystem.textSecondary)

                            Picker("Category", selection: $selectedCategory) {
                                ForEach(SavedRecording.categories, id: \.self) { category in
                                    Text(category).tag(category)
                                }
                            }
                            .pickerStyle(.menu)
                            .frame(height: 55)
                            .background(Color.white)
                            .cornerRadius(12)
                        }

                        Spacer()
                            .frame(height: 100)

                        // Create button
                        Button(action: createStory) {
                            Text("CREATE STORY")
                                .font(DesignSystem.buttonText)
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .frame(height: 60)
                                .background(title.isEmpty ? Color.gray : DesignSystem.primaryTeal)
                                .cornerRadius(12)
                        }
                        .disabled(title.isEmpty)
                        .padding(.bottom, 30)
                    }
                    .padding(DesignSystem.largePadding)
                }
                .scrollDismissesKeyboard(.interactively)
            }
            .navigationTitle("Create New Story")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }

                ToolbarItemGroup(placement: .keyboard) {
                    Button("Cancel") {
                        hideKeyboard()
                    }
                    .foregroundColor(DesignSystem.textSecondary)

                    Spacer()

                    Button("Create Story") {
                        hideKeyboard()
                        if !title.isEmpty {
                            createStory()
                        }
                    }
                    .font(.headline)
                    .foregroundColor(title.isEmpty ? .gray : DesignSystem.primaryTeal)
                    .disabled(title.isEmpty)
                }
            }
        }
    }

    func hideKeyboard() {
        UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
    }

    func createStory() {
        let story = Story(
            title: title,
            emoji: selectedEmoji,
            category: selectedCategory
        )
        onCreate(story)
        dismiss()
    }
}
