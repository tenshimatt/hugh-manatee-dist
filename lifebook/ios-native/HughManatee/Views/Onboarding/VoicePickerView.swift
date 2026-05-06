import SwiftUI

struct VoicePickerView: View {
    @Bindable var vm: OnboardingViewModel
    let onNext: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            Spacer().frame(height: 60)

            Text("Choose Hugh's voice")
                .font(HughFont.headingLarge)
                .foregroundColor(HughColor.ink)

            Spacer().frame(height: HughSpacing.md)

            Text("This is the voice that will guide your conversations.")
                .font(HughFont.body)
                .foregroundColor(HughColor.inkSoft)
                .multilineTextAlignment(.center)
                .padding(.horizontal, HughSpacing.xl)

            Spacer().frame(height: HughSpacing.xl)

            VStack(spacing: 12) {
                ForEach(placeholderVoices) { voice in
                    VoiceCard(
                        voice: voice,
                        isSelected: vm.selectedVoice?.id == voice.id,
                        onTap: { vm.selectVoice(voice) }
                    )
                }
            }
            .padding(.horizontal, HughSpacing.xl)

            Spacer()

            Button(action: onNext) {
                Text("Continue")
                    .font(HughFont.label)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: HughSpacing.touchMin)
                    .background(vm.selectedVoice == nil ? HughColor.inkFaint : HughColor.accent)
                    .clipShape(RoundedRectangle(cornerRadius: HughSpacing.radiusMd))
            }
            .disabled(vm.selectedVoice == nil)
            .padding(.horizontal, HughSpacing.xl)

            Spacer().frame(height: HughSpacing.lg)
        }
    }
}

struct VoiceCard: View {
    let voice: VoiceOption
    let isSelected: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(voice.label)
                        .font(HughFont.bodyLarge)
                        .foregroundColor(HughColor.ink)
                    Text(voice.description)
                        .font(HughFont.caption)
                        .foregroundColor(HughColor.inkSoft)
                }
                Spacer()
                if isSelected {
                    Circle()
                        .fill(HughColor.accent)
                        .frame(width: 16, height: 16)
                }
            }
            .padding(HughSpacing.md)
            .background(isSelected ? HughColor.surfaceAlt : HughColor.surface)
            .clipShape(RoundedRectangle(cornerRadius: HughSpacing.radiusMd))
            .overlay(
                RoundedRectangle(cornerRadius: HughSpacing.radiusMd)
                    .stroke(isSelected ? HughColor.accent : HughColor.divider, lineWidth: isSelected ? 2 : 1)
            )
        }
        .buttonStyle(.plain)
    }
}
