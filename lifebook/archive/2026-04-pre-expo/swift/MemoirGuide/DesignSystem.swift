import SwiftUI

// MARK: - Design System
struct DesignSystem {
    // Sizing
    static let primaryButtonHeight: CGFloat = 70
    static let recordButtonSize: CGFloat = 200
    
    // Typography
    static let largeTitle = Font.system(size: 34, weight: .semibold, design: .rounded)
    static let title = Font.system(size: 26, weight: .medium, design: .rounded)
    static let body = Font.system(size: 20, weight: .regular, design: .rounded)
    static let buttonText = Font.system(size: 22, weight: .semibold, design: .rounded)
    static let caption = Font.system(size: 18, weight: .regular, design: .rounded)
    
    // MARK: - California Beach Patina Palette

    // Primary Warmth Spectrum
    static let amber = Color(red: 255/255, green: 200/255, blue: 87/255)        // #FFC857
    static let sunsetOrange = Color(red: 247/255, green: 127/255, blue: 0/255)  // #F77F00
    static let cornYellow = Color(red: 252/255, green: 191/255, blue: 73/255)   // #FCBF49
    static let sunshine = Color(red: 255/255, green: 230/255, blue: 109/255)    // #FFE66D

    // Contrast Anchor
    static let deepNavy = Color(red: 0/255, green: 61/255, blue: 91/255)        // #003D5B

    // Gradient Helpers (for Phase 2)
    static let warmGradientStart = amber.opacity(0.05)
    static let warmGradientEnd = cornYellow.opacity(0.08)
    static let amberGlow = amber.opacity(0.1)

    // MARK: - Legacy Colors (Maintained)

    // Keep existing (per specification)
    static let backgroundBeige = Color(red: 250/255, green: 248/255, blue: 245/255)
    static let textPrimary = Color(red: 33/255, green: 33/255, blue: 33/255)
    static let textSecondary = Color(red: 107/255, green: 107/255, blue: 107/255)
    static let recordRed = Color(red: 239/255, green: 71/255, blue: 71/255)
    static let cardBackground = Color.white
    static let warmGray = Color(red: 245/255, green: 243/255, blue: 240/255)

    // Deprecated (marked for removal during migration)
    @available(*, deprecated, message: "Use deepNavy or amber instead")
    static let primaryTeal = Color(red: 91/255, green: 154/255, blue: 139/255)
    
    // Spacing
    static let padding: CGFloat = 20
    static let largePadding: CGFloat = 30
    static let cornerRadius: CGFloat = 20
    static let cardCornerRadius: CGFloat = 16
}
