// ThemeSwitcherButton.swift
// Circular button to cycle through 5 color themes

import SwiftUI

struct ThemeSwitcherButton: View {
    @EnvironmentObject var themeManager: ThemeManager
    @State private var isAnimating = false

    var body: some View {
        Button(action: {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                isAnimating = true
                themeManager.nextTheme()
            }

            // Haptic feedback
            let generator = UIImpactFeedbackGenerator(style: .medium)
            generator.impactOccurred()

            // Reset animation
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                isAnimating = false
            }
        }) {
            ZStack {
                // Outer circle with current theme color
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [
                                themeManager.currentTheme.primary,
                                themeManager.currentTheme.secondary
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 44, height: 44)
                    .shadow(color: themeManager.currentTheme.primary.opacity(0.4), radius: 8, x: 0, y: 4)

                // Inner icon
                Image(systemName: "paintpalette.fill")
                    .font(.system(size: 20))
                    .foregroundColor(.white)
                    .rotationEffect(.degrees(isAnimating ? 360 : 0))
            }
        }
        .accessibilityLabel("Change color theme")
        .accessibilityHint("Cycles through 5 different color themes. Currently using \(themeManager.currentTheme.name)")
    }
}

// MARK: - Theme Preview Indicator

struct ThemeIndicator: View {
    @EnvironmentObject var themeManager: ThemeManager

    var body: some View {
        HStack(spacing: 6) {
            ForEach(Array(ThemeManager.themes.enumerated()), id: \.element.id) { index, theme in
                Circle()
                    .fill(theme.id == themeManager.currentTheme.id ? theme.primary : Color.gray.opacity(0.3))
                    .frame(width: 8, height: 8)
                    .scaleEffect(theme.id == themeManager.currentTheme.id ? 1.2 : 1.0)
                    .animation(.spring(response: 0.3), value: themeManager.currentTheme.id)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(Color.black.opacity(0.05))
        .cornerRadius(20)
    }
}
