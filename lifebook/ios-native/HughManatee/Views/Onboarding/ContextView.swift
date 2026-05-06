import SwiftUI

struct ContextView: View {
    @Bindable var vm: OnboardingViewModel
    let onNext: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            Spacer().frame(height: 60)

            Text("A little about you")
                .font(HughFont.headingLarge)
                .foregroundColor(HughColor.ink)

            Spacer().frame(height: HughSpacing.md)

            Text("This helps Hugh have better conversations. Both are optional.")
                .font(HughFont.body)
                .foregroundColor(HughColor.inkSoft)
                .multilineTextAlignment(.center)
                .padding(.horizontal, HughSpacing.xl)

            Spacer().frame(height: HughSpacing.xl)

            VStack(spacing: HughSpacing.lg) {
                TextField("Birth year (optional)", text: $vm.birthYear)
                    .font(HughFont.bodyLarge)
                    .keyboardType(.numberPad)
                    .textFieldStyle(.plain)
                    .padding()
                    .background(HughColor.surface)
                    .clipShape(RoundedRectangle(cornerRadius: HughSpacing.radiusMd))
                    .overlay(
                        RoundedRectangle(cornerRadius: HughSpacing.radiusMd)
                            .stroke(HughColor.divider, lineWidth: 1)
                    )
                    .onChange(of: vm.birthYear) { _, new in
                        vm.birthYear = String(new.filter { $0.isNumber }.prefix(4))
                    }

                TextField("Hometown (optional)", text: $vm.hometown)
                    .font(HughFont.bodyLarge)
                    .textFieldStyle(.plain)
                    .padding()
                    .background(HughColor.surface)
                    .clipShape(RoundedRectangle(cornerRadius: HughSpacing.radiusMd))
                    .overlay(
                        RoundedRectangle(cornerRadius: HughSpacing.radiusMd)
                            .stroke(HughColor.divider, lineWidth: 1)
                    )
                    .autocorrectionDisabled()
                    .textInputAutocapitalization(.words)
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
                    .background(HughColor.accent)
                    .clipShape(RoundedRectangle(cornerRadius: HughSpacing.radiusMd))
            }
            .padding(.horizontal, HughSpacing.xl)

            Spacer().frame(height: HughSpacing.lg)
        }
    }
}
