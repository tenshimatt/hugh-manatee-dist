import SwiftUI

struct PrivacyView: View {
    @Bindable var vm: OnboardingViewModel
    @AppStorage("hasProfile") private var hasProfile = false

    var body: some View {
        VStack(spacing: 0) {
            Spacer().frame(height: 80)

            Text("Your stories stay yours")
                .font(HughFont.headingLarge)
                .foregroundColor(HughColor.ink)
                .multilineTextAlignment(.center)

            Spacer().frame(height: HughSpacing.lg)

            Text("Everything stays on your phone. Hugh doesn't share your stories with anyone. No accounts, no cloud storage, no data collection. When you delete the app, everything is gone.")
                .font(HughFont.bodyLarge)
                .foregroundColor(HughColor.inkSoft)
                .multilineTextAlignment(.center)
                .padding(.horizontal, HughSpacing.xl)

            Spacer()

            if let error = vm.error {
                Text(error)
                    .font(HughFont.caption)
                    .foregroundColor(HughColor.danger)
                    .padding(.bottom, HughSpacing.md)
            }

            Button {
                if vm.completeOnboarding() {
                    // Navigation happens via @AppStorage change in HughManateeApp
                }
            } label: {
                Text(vm.isSubmitting ? "Setting up…" : "Meet Hugh")
                    .font(HughFont.label)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: HughSpacing.touchMin)
                    .background(vm.isSubmitting ? HughColor.inkFaint : HughColor.accent)
                    .clipShape(RoundedRectangle(cornerRadius: HughSpacing.radiusMd))
            }
            .disabled(vm.isSubmitting)
            .padding(.horizontal, HughSpacing.xl)

            Spacer().frame(height: HughSpacing.lg)
        }
    }
}
