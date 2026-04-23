// ProfileChecklistView.swift
// Family Tree Basics Checklist for genealogy data

import SwiftUI

struct ProfileChecklistView: View {
    @EnvironmentObject var profileManager: ProfileChecklistManager
    @Environment(\.appTheme) var theme
    @Environment(\.dismiss) var dismiss

    @State private var editingField: ProfileInfoEntity.ProfileField?
    @State private var showingEditor = false

    var body: some View {
        NavigationView {
            ZStack {
                // Background
                theme.background.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 24) {
                        // Header
                        headerSection

                        // Progress Bar
                        progressSection

                        // Checklist Items
                        checklistSection

                        Spacer(minLength: 40)
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 20)
                }
            }
            .navigationTitle("Family Tree Basics")
            .navigationBarTitleDisplayMode(.large)
            .navigationBarItems(trailing: Button("Done") {
                dismiss()
            })
            .sheet(isPresented: $showingEditor) {
                if let field = editingField {
                    FieldEditorView(
                        field: field,
                        currentValue: profileManager.profileInfo?.getValue(for: field),
                        onSave: { value in
                            profileManager.updateField(field, value: value)
                            showingEditor = false
                        }
                    )
                }
            }
        }
    }

    // MARK: - Header Section

    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Complete Your Family Tree")
                .font(.system(size: 28, weight: .bold))
                .foregroundColor(theme.textPrimary)

            Text("Help your family remember your story by recording these important details. We'll use this information to make your memoir more complete.")
                .font(.system(size: 18))
                .foregroundColor(theme.textSecondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Progress Section

    private var progressSection: some View {
        VStack(spacing: 12) {
            // Progress Bar
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    // Background
                    RoundedRectangle(cornerRadius: 12)
                        .fill(theme.surface)
                        .frame(height: 24)

                    // Progress Fill
                    RoundedRectangle(cornerRadius: 12)
                        .fill(progressColor)
                        .frame(
                            width: geometry.size.width * CGFloat(profileManager.completionPercentage) / 100,
                            height: 24
                        )
                        .animation(.spring(), value: profileManager.completionPercentage)

                    // Percentage Text
                    Text("\(profileManager.completionPercentage)%")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                }
            }
            .frame(height: 24)

            // Progress Message
            Text(profileManager.progressMessage)
                .font(.system(size: 16, weight: .medium))
                .foregroundColor(theme.textPrimary)
        }
    }

    private var progressColor: Color {
        let percentage = profileManager.completionPercentage

        if percentage == 100 {
            return .green
        } else if percentage >= 50 {
            return .yellow
        } else {
            return .red
        }
    }

    // MARK: - Checklist Section

    private var checklistSection: some View {
        VStack(spacing: 16) {
            ForEach(profileManager.allChecklistItems, id: \.field) { item in
                ChecklistItemRow(
                    item: item,
                    onTap: {
                        editingField = item.field
                        showingEditor = true
                    }
                )
            }
        }
    }
}

// MARK: - Checklist Item Row

struct ChecklistItemRow: View {
    let item: ProfileInfoEntity.ChecklistItem
    let onTap: () -> Void

    @Environment(\.appTheme) var theme

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 16) {
                // Status Icon
                Image(systemName: item.isCompleted ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 32))
                    .foregroundColor(statusColor)

                // Content
                VStack(alignment: .leading, spacing: 4) {
                    Text(item.title)
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundColor(theme.textPrimary)

                    Text(item.subtitle)
                        .font(.system(size: 16))
                        .foregroundColor(theme.textSecondary)
                        .fixedSize(horizontal: false, vertical: true)
                }

                Spacer()

                // Chevron
                Image(systemName: "chevron.right")
                    .foregroundColor(theme.textSecondary)
            }
            .padding(20)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(theme.surface)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(borderColor, lineWidth: 2)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }

    private var statusColor: Color {
        if item.isCompleted {
            return .green
        } else if item.isCritical {
            return .red
        } else {
            return theme.textSecondary
        }
    }

    private var borderColor: Color {
        if item.isCompleted {
            return .green.opacity(0.3)
        } else if item.isCritical {
            return .red.opacity(0.3)
        } else {
            return .clear
        }
    }
}

// MARK: - Field Editor View

struct FieldEditorView: View {
    let field: ProfileInfoEntity.ProfileField
    let currentValue: Any?
    let onSave: (Any?) -> Void

    @Environment(\.dismiss) var dismiss
    @Environment(\.appTheme) var theme

    @State private var textValue: String = ""
    @State private var dateValue: Date = Date()
    @State private var errorMessage: String?

    var body: some View {
        NavigationView {
            ZStack {
                theme.background.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 24) {
                        // Instructions
                        Text(field.subtitle)
                            .font(.system(size: 18))
                            .foregroundColor(theme.textSecondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)

                        // Editor
                        if field == .dateOfBirth {
                            dateEditor
                        } else {
                            textEditor
                        }

                        // Error Message
                        if let error = errorMessage {
                            Text(error)
                                .font(.system(size: 16))
                                .foregroundColor(.red)
                                .multilineTextAlignment(.center)
                        }

                        Spacer()
                    }
                    .padding()
                }
            }
            .navigationTitle(field.rawValue)
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarItems(
                leading: Button("Cancel") {
                    dismiss()
                },
                trailing: Button(action: {
                    saveValue()
                }) {
                    Text("Save")
                        .fontWeight(.bold)
                }
            )
            .onAppear {
                loadCurrentValue()
            }
        }
    }

    // MARK: - Editors

    private var textEditor: some View {
        VStack(alignment: .leading, spacing: 8) {
            TextField("Enter \(field.rawValue.lowercased())", text: $textValue)
                .font(.system(size: 20))
                .padding(16)
                .background(theme.surface)
                .cornerRadius(12)
                .autocapitalization(.words)
        }
    }

    private var dateEditor: some View {
        VStack(spacing: 8) {
            DatePicker(
                "Select date",
                selection: $dateValue,
                in: ...Date(),
                displayedComponents: .date
            )
            .datePickerStyle(.graphical)
            .padding()
            .background(theme.surface)
            .cornerRadius(12)
        }
    }

    // MARK: - Actions

    private func loadCurrentValue() {
        if field == .dateOfBirth {
            dateValue = (currentValue as? Date) ?? Date()
        } else {
            textValue = (currentValue as? String) ?? ""
        }
    }

    private func saveValue() {
        let value: Any? = field == .dateOfBirth ? dateValue : textValue

        // Validate
        if let error = ProfileChecklistManager.shared.validateField(field, value: value) {
            errorMessage = error
            return
        }

        onSave(value)
        dismiss()
    }
}
