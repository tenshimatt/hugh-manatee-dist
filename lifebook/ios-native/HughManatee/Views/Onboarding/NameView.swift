import SwiftUI

struct NameView: View {
    @Bindable var vm: OnboardingViewModel
    let onNext: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            Spacer().frame(height: 80)

            Text("Welcome")
                .font(HughFont.display)
                .foregroundColor(HughColor.ink)

            Spacer().frame(height: HughSpacing.md)

            Text("What should Hugh call you?")
                .font(HughFont.heading)
                .foregroundColor(HughColor.inkSoft)
                .multilineTextAlignment(.center)

            Spacer().frame(height: HughSpacing.xl)

            TextField("Your first name", text: $vm.firstName)
                .font(HughFont.bodyLarge)
                .textFieldStyle(.plain)
                .padding()
                .background(HughColor.surface)
                .clipShape(RoundedRectangle(cornerRadius: HughSpacing.radiusMd))
                .overlay(
                    RoundedRectangle(cornerRadius: HughSpacing.radiusMd)
                        .stroke(vm.error != nil ? HughColor.danger : HughColor.divider, lineWidth: 1)
                )
                .autocorrectionDisabled()
                .textInputAutocapitalization(.words)
                .submitLabel(.done)
                .padding(.horizontal, HughSpacing.xl)

            if let error = vm.error {
                Text(error)
                    .font(HughFont.caption)
                    .foregroundColor(HughColor.danger)
                    .padding(.top, HughSpacing.md)
            }

            Spacer()

            Button(action: onNext) {
                Text("Continue")
                    .font(HughFont.label)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: HughSpacing.touchMin)
                    .background(vm.firstName.isBlank ? HughColor.inkFaint : HughColor.accent)
                    .clipShape(RoundedRectangle(cornerRadius: HughSpacing.radiusMd))
            }
            .disabled(vm.firstName.isBlank)
            .padding(.horizontal, HughSpacing.xl)

            Spacer().frame(height: HughSpacing.lg)
        }
    }
}
