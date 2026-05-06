import SwiftUI

struct SettingsView: View {
    @State private var vm = SettingsViewModel()
    @AppStorage("hasProfile") private var hasProfile = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                // ── Profile ────────────────────────────
                sectionHeader("Profile")

                if vm.isEditing {
                    VStack(spacing: HughSpacing.md) {
                        TextField("Name", text: $vm.editFirstName)
                            .font(HughFont.bodyLarge)
                            .textFieldStyle(.roundedBorder)
                        TextField("Birth year", text: $vm.editBirthYear)
                            .font(HughFont.bodyLarge)
                            .textFieldStyle(.roundedBorder)
                            .keyboardType(.numberPad)
                        TextField("Hometown", text: $vm.editHometown)
                            .font(HughFont.bodyLarge)
                            .textFieldStyle(.roundedBorder)

                        HStack {
                            Button("Cancel") { vm.cancelEditing() }
                                .buttonStyle(.bordered)
                            Spacer()
                            Button(vm.isSaving ? "Saving…" : "Save") { vm.saveProfile() }
                                .buttonStyle(.borderedProminent)
                                .tint(HughColor.accent)
                                .disabled(vm.isSaving || vm.editFirstName.isBlank)
                        }
                    }
                } else {
                    profileRow("Name", vm.profile?.firstName ?? "")
                    profileRow("Birth year", vm.profile?.birthYear.map(String.init) ?? "Not set")
                    profileRow("Hometown", vm.profile?.hometown ?? "Not set")

                    Button("Edit profile") { vm.startEditing() }
                        .buttonStyle(.bordered)
                        .padding(.top, HughSpacing.sm)
                }

                Spacer().frame(height: HughSpacing.xl)

                // ── Voice ──────────────────────────────
                sectionHeader("Voice")

                if let voice = vm.selectedVoice {
                    Text(voice.label).font(HughFont.bodyLarge).foregroundColor(HughColor.ink)
                    Text(voice.description).font(HughFont.caption).foregroundColor(HughColor.inkSoft)
                }

                if vm.showVoicePicker {
                    ForEach(placeholderVoices) { voice in
                        Button {
                            vm.selectVoice(voice)
                        } label: {
                            HStack {
                                VStack(alignment: .leading) {
                                    Text(voice.label).font(HughFont.body).foregroundColor(HughColor.ink)
                                    Text(voice.description).font(HughFont.caption).foregroundColor(HughColor.inkSoft)
                                }
                                Spacer()
                                if voice.id == vm.selectedVoice?.id {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundColor(HughColor.accent)
                                }
                            }
                            .padding(HughSpacing.md)
                            .background(HughColor.surface)
                            .clipShape(RoundedRectangle(cornerRadius: HughSpacing.radiusSm))
                        }
                        .buttonStyle(.plain)
                    }
                }

                Button(vm.showVoicePicker ? "Cancel" : "Change voice") {
                    vm.showVoicePicker.toggle()
                }
                .buttonStyle(.bordered)
                .padding(.top, HughSpacing.sm)

                Spacer().frame(height: HughSpacing.xl)

                // ── Data ───────────────────────────────
                sectionHeader("Data")

                Button("Export all data (coming soon)") {}
                    .buttonStyle(.bordered)
                    .disabled(true)

                Button(role: .destructive) {
                    vm.showDeleteConfirm = true
                } label: {
                    Text("Delete all data")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(HughColor.danger)
                .padding(.top, HughSpacing.sm)

                Spacer().frame(height: 80)
            }
            .padding(.horizontal, HughSpacing.xl)
        }
        .background(HughColor.bgTop)
        .navigationTitle("Settings")
        .alert("Delete all data?", isPresented: $vm.showDeleteConfirm) {
            Button("Cancel", role: .cancel) {}
            Button("Delete everything", role: .destructive) {
                vm.deleteAll()
            }
        } message: {
            Text("This will permanently delete all your memories and profile.")
        }
    }

    private func sectionHeader(_ title: String) -> some View {
        Text(title)
            .font(HughFont.label)
            .foregroundColor(HughColor.inkSoft)
            .padding(.bottom, HughSpacing.sm)
    }

    private func profileRow(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label)
                .font(HughFont.body)
                .foregroundColor(HughColor.inkSoft)
                .frame(width: 120, alignment: .leading)
            Text(value)
                .font(HughFont.body)
                .foregroundColor(HughColor.ink)
        }
        .padding(.vertical, HughSpacing.sm)
    }
}
