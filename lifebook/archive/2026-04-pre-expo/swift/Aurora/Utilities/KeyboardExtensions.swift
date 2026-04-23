import SwiftUI

// MARK: - Keyboard Utilities for Aurora
// Ensures buttons remain accessible when keyboard is visible

extension View {
    /// Adds a "Done" button above the keyboard for easy dismissal
    /// Use on TextFields where action buttons might be covered by keyboard
    func keyboardDoneButton() -> some View {
        self.toolbar {
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("Done") {
                    hideKeyboard()
                }
                .font(DesignSystem.body)
                .foregroundColor(DesignSystem.primaryTeal)
            }
        }
    }

    /// Hides the keyboard programmatically
    func hideKeyboard() {
        UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
    }
}
