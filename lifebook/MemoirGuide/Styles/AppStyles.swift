// AppStyles.swift
// Centralized styling system for MemoirGuide
// Universal iOS-style theme implementation

import SwiftUI

// MARK: - Typography Styles

struct AppTypography {
    // iOS System Font Hierarchy (Bug 12: No bold fonts)
    static let largeTitle = Font.largeTitle  // Removed .weight(.bold)
    static let title = Font.title
    static let title2 = Font.title2
    static let title3 = Font.title3
    static let headline = Font.headline
    static let body = Font.body
    static let callout = Font.callout
    static let subheadline = Font.subheadline
    static let footnote = Font.footnote
    static let caption = Font.caption
    static let caption2 = Font.caption2
}

// MARK: - Button Styles

struct StandardButtonStyle: ButtonStyle {
    var isEnabled: Bool = true

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
            .opacity(isEnabled ? 1.0 : 0.6)
            .animation(.easeInOut(duration: 0.15), value: configuration.isPressed)
    }
}

struct PrimaryButtonStyle: ButtonStyle {
    var isEnabled: Bool = true

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(AppTypography.headline)
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .frame(width: UIScreen.main.bounds.width * 0.8)  // Standard 80% width
            .padding(.vertical, 16)
            .background(isEnabled ? Color.accentColor : Color.gray)
            .cornerRadius(12)
            .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
            .animation(.easeInOut(duration: 0.15), value: configuration.isPressed)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    var isEnabled: Bool = true

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(AppTypography.body)
            .foregroundColor(.accentColor)
            .frame(maxWidth: .infinity)
            .frame(width: UIScreen.main.bounds.width * 0.8)
            .padding(.vertical, 14)
            .background(Color.accentColor.opacity(0.1))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.accentColor, lineWidth: 1)
            )
            .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
            .opacity(isEnabled ? 1.0 : 0.6)
            .animation(.easeInOut(duration: 0.15), value: configuration.isPressed)
    }
}

// MARK: - Card Styles

struct CardStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(Color(UIColor.systemBackground))
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.08), radius: 8, x: 0, y: 2)
    }
}

extension View {
    func cardStyle() -> some View {
        modifier(CardStyle())
    }
}

// MARK: - Text Field Styles

struct StandardTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .font(AppTypography.body)
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .background(Color(UIColor.systemGray6))
            .cornerRadius(10)
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(Color(UIColor.systemGray4), lineWidth: 1)
            )
    }
}

// MARK: - Section Styles

struct SectionHeaderStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .font(AppTypography.headline)
            .foregroundColor(Color(UIColor.label))
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.bottom, 8)
    }
}

extension View {
    func sectionHeaderStyle() -> some View {
        modifier(SectionHeaderStyle())
    }
}

// MARK: - Spacing Constants

struct AppSpacing {
    static let tiny: CGFloat = 4
    static let small: CGFloat = 8
    static let medium: CGFloat = 16
    static let large: CGFloat = 24
    static let extraLarge: CGFloat = 32
    static let huge: CGFloat = 48
}

// MARK: - Corner Radius Constants

struct AppCornerRadius {
    static let small: CGFloat = 8
    static let medium: CGFloat = 12
    static let large: CGFloat = 16
    static let extraLarge: CGFloat = 20
}

// MARK: - Standard Button Sizes

struct ButtonSize {
    static let standard = UIScreen.main.bounds.width * 0.8  // 80% width
    static let narrow = UIScreen.main.bounds.width * 0.8 * 0.85  // 15% narrower
    static let full = UIScreen.main.bounds.width * 0.9  // 90% width
}

// MARK: - iOS System Colors

extension Color {
    static var label: Color {
        Color(UIColor.label)
    }

    static var secondaryLabel: Color {
        Color(UIColor.secondaryLabel)
    }

    static var tertiaryLabel: Color {
        Color(UIColor.tertiaryLabel)
    }

    static var systemBackground: Color {
        Color(UIColor.systemBackground)
    }

    static var secondarySystemBackground: Color {
        Color(UIColor.secondarySystemBackground)
    }

    static var tertiarySystemBackground: Color {
        Color(UIColor.tertiarySystemBackground)
    }

    static var systemGroupedBackground: Color {
        Color(UIColor.systemGroupedBackground)
    }
}
