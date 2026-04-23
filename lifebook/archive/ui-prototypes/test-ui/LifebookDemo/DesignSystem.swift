import SwiftUI

// MARK: - Design System
struct DesignSystem {
    // Sizing
    static let primaryButtonHeight: CGFloat = 70
    static let recordButtonSize: CGFloat = 200
    
    // Typography
    static let largeTitle = Font.system(size: 32, weight: .semibold, design: .rounded)
    static let title = Font.system(size: 24, weight: .medium, design: .rounded)
    static let body = Font.system(size: 18, weight: .regular, design: .rounded)
    static let buttonText = Font.system(size: 20, weight: .semibold, design: .rounded)
    static let caption = Font.system(size: 16, weight: .regular, design: .rounded)
    
    // Colors
    static let primaryTeal = Color(red: 91/255, green: 154/255, blue: 139/255)
    static let recordRed = Color(red: 239/255, green: 71/255, blue: 71/255)
    static let warmGray = Color(red: 245/255, green: 243/255, blue: 240/255)
    static let textPrimary = Color(red: 33/255, green: 33/255, blue: 33/255)
    static let textSecondary = Color(red: 107/255, green: 107/255, blue: 107/255)
    static let cardBackground = Color.white
    static let backgroundBeige = Color(red: 250/255, green: 248/255, blue: 245/255)
    
    // Spacing
    static let padding: CGFloat = 20
    static let largePadding: CGFloat = 30
    static let cornerRadius: CGFloat = 20
    static let cardCornerRadius: CGFloat = 16
}

// MARK: - Color Extension
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
