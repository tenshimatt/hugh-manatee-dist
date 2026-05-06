import SwiftUI

struct OnboardingView: View {
    @State private var vm = OnboardingViewModel()
    @State private var step = 0

    var body: some View {
        ZStack {
            HughColor.bgTop.ignoresSafeArea()

            Group {
                switch step {
                case 0: NameView(vm: vm, onNext: { step = 1 })
                case 1: VoicePickerView(vm: vm, onNext: { step = 2 })
                case 2: ContextView(vm: vm, onNext: { step = 3 })
                case 3: PrivacyView(vm: vm)
                default: EmptyView()
                }
            }
            .animation(.easeInOut, value: step)
        }
    }
}
