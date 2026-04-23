// Extensions.swift
// Helpful extensions for the app

import SwiftUI

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
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }

    // MARK: - Theme Colors

    static let charcoal = Color(hex: "264653")
    static let persianGreen = Color(hex: "2a9d8f")
    static let saffron = Color(hex: "e9c46a")
    static let sandyBrown = Color(hex: "f4a261")
    static let burntSienna = Color(hex: "e76f51")

    // Theme aliases
    static let primaryTheme = Color.persianGreen
    static let secondaryTheme = Color.saffron
    static let accentInteractive = Color.sandyBrown
}

// MARK: - View Extension

extension View {
    func hideKeyboard() {
        UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), 
                                       to: nil, from: nil, for: nil)
    }
}

// MARK: - Date Extension

extension Date {
    func timeAgoDisplay() -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .full
        return formatter.localizedString(for: self, relativeTo: Date())
    }
}

// MARK: - String Extension

extension String {
    func truncated(to length: Int) -> String {
        if self.count <= length {
            return self
        }
        return String(self.prefix(length)) + "..."
    }
    
    var wordCount: Int {
        let words = self.split { $0.isWhitespace || $0.isNewline }
        return words.count
    }
}
