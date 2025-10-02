// AppState.swift
// Global app state management

import SwiftUI
import Combine

class AppState: ObservableObject {
    @Published var currentView: ViewState = .recording
    @Published var isFirstLaunch: Bool = true
    @Published var currentSession: MemoirSession?
    @Published var error: AppError?

    enum ViewState {
        case recording
        case library
        case reader(chapter: Chapter)
    }
}

// MARK: - Theme Management System (Bug 20: 5 Color Themes)

// MARK: - Theme Model

struct AppTheme: Codable, Equatable {
    let id: String
    let name: String
    let primaryColor: CodableColor
    let secondaryColor: CodableColor
    let accentColor: CodableColor
    let backgroundColor: CodableColor
    let surfaceColor: CodableColor
    let textPrimaryColor: CodableColor
    let textSecondaryColor: CodableColor

    var primary: Color { Color(primaryColor) }
    var secondary: Color { Color(secondaryColor) }
    var accent: Color { Color(accentColor) }
    var background: Color { Color(backgroundColor) }
    var surface: Color { Color(surfaceColor) }
    var textPrimary: Color { Color(textPrimaryColor) }
    var textSecondary: Color { Color(textSecondaryColor) }
}

// MARK: - Codable Color Wrapper

struct CodableColor: Codable, Equatable {
    let red: Double
    let green: Double
    let blue: Double
    let opacity: Double

    init(red: Double, green: Double, blue: Double, opacity: Double = 1.0) {
        self.red = red
        self.green = green
        self.blue = blue
        self.opacity = opacity
    }

    init(from color: Color) {
        // Extract RGB components (simplified - for production use UIColor conversion)
        self.red = 0.5
        self.green = 0.5
        self.blue = 0.5
        self.opacity = 1.0
    }
}

extension Color {
    init(_ codable: CodableColor) {
        self.init(red: codable.red, green: codable.green, blue: codable.blue, opacity: codable.opacity)
    }
}

// MARK: - Theme Manager

@MainActor
class ThemeManager: ObservableObject {
    static let shared = ThemeManager()

    @Published var currentTheme: AppTheme {
        didSet {
            saveTheme()
        }
    }

    private let themesKey = "selectedThemeID"

    // MARK: - 5 Modern Color Palettes

    static let themes: [AppTheme] = [
        // Theme 1: Forest Green (Original - warm, earthy)
        AppTheme(
            id: "forest",
            name: "Forest Green",
            primaryColor: CodableColor(red: 0.29, green: 0.49, blue: 0.35, opacity: 1.0), // #4A7C59
            secondaryColor: CodableColor(red: 0.36, green: 0.55, blue: 0.63, opacity: 1.0), // #5B8BA0
            accentColor: CodableColor(red: 0.82, green: 0.64, blue: 0.42, opacity: 1.0), // #D1A36B
            backgroundColor: CodableColor(red: 0.98, green: 0.98, blue: 0.96, opacity: 1.0), // #F9F9F5
            surfaceColor: CodableColor(red: 1.0, green: 1.0, blue: 1.0, opacity: 1.0),
            textPrimaryColor: CodableColor(red: 0.2, green: 0.2, blue: 0.2, opacity: 1.0),
            textSecondaryColor: CodableColor(red: 0.5, green: 0.5, blue: 0.5, opacity: 1.0)
        ),

        // Theme 2: Ocean Blue (Cool, calm, professional)
        AppTheme(
            id: "ocean",
            name: "Ocean Blue",
            primaryColor: CodableColor(red: 0.2, green: 0.4, blue: 0.6, opacity: 1.0), // Deep blue
            secondaryColor: CodableColor(red: 0.3, green: 0.65, blue: 0.75, opacity: 1.0), // Teal
            accentColor: CodableColor(red: 0.95, green: 0.6, blue: 0.4, opacity: 1.0), // Coral
            backgroundColor: CodableColor(red: 0.96, green: 0.97, blue: 0.98, opacity: 1.0), // Light blue-gray
            surfaceColor: CodableColor(red: 1.0, green: 1.0, blue: 1.0, opacity: 1.0),
            textPrimaryColor: CodableColor(red: 0.15, green: 0.2, blue: 0.25, opacity: 1.0),
            textSecondaryColor: CodableColor(red: 0.45, green: 0.5, blue: 0.55, opacity: 1.0)
        ),

        // Theme 3: Sunset Purple (Warm, creative, modern)
        AppTheme(
            id: "sunset",
            name: "Sunset Purple",
            primaryColor: CodableColor(red: 0.55, green: 0.35, blue: 0.65, opacity: 1.0), // Purple
            secondaryColor: CodableColor(red: 0.85, green: 0.45, blue: 0.55, opacity: 1.0), // Rose
            accentColor: CodableColor(red: 0.95, green: 0.75, blue: 0.35, opacity: 1.0), // Gold
            backgroundColor: CodableColor(red: 0.98, green: 0.96, blue: 0.97, opacity: 1.0), // Light lavender
            surfaceColor: CodableColor(red: 1.0, green: 1.0, blue: 1.0, opacity: 1.0),
            textPrimaryColor: CodableColor(red: 0.25, green: 0.15, blue: 0.3, opacity: 1.0),
            textSecondaryColor: CodableColor(red: 0.55, green: 0.45, blue: 0.6, opacity: 1.0)
        ),

        // Theme 4: Slate Gray (Minimal, elegant, sophisticated)
        AppTheme(
            id: "slate",
            name: "Slate Gray",
            primaryColor: CodableColor(red: 0.35, green: 0.4, blue: 0.45, opacity: 1.0), // Dark slate
            secondaryColor: CodableColor(red: 0.5, green: 0.55, blue: 0.6, opacity: 1.0), // Medium slate
            accentColor: CodableColor(red: 0.4, green: 0.7, blue: 0.8, opacity: 1.0), // Sky blue
            backgroundColor: CodableColor(red: 0.97, green: 0.97, blue: 0.98, opacity: 1.0), // Cool white
            surfaceColor: CodableColor(red: 1.0, green: 1.0, blue: 1.0, opacity: 1.0),
            textPrimaryColor: CodableColor(red: 0.2, green: 0.2, blue: 0.2, opacity: 1.0),
            textSecondaryColor: CodableColor(red: 0.5, green: 0.5, blue: 0.5, opacity: 1.0)
        ),

        // Theme 5: Autumn Warmth (Cozy, inviting, friendly)
        AppTheme(
            id: "autumn",
            name: "Autumn Warmth",
            primaryColor: CodableColor(red: 0.7, green: 0.45, blue: 0.3, opacity: 1.0), // Terracotta
            secondaryColor: CodableColor(red: 0.8, green: 0.6, blue: 0.35, opacity: 1.0), // Amber
            accentColor: CodableColor(red: 0.55, green: 0.35, blue: 0.25, opacity: 1.0), // Deep brown
            backgroundColor: CodableColor(red: 0.98, green: 0.97, blue: 0.95, opacity: 1.0), // Warm cream
            surfaceColor: CodableColor(red: 1.0, green: 1.0, blue: 1.0, opacity: 1.0),
            textPrimaryColor: CodableColor(red: 0.25, green: 0.2, blue: 0.15, opacity: 1.0),
            textSecondaryColor: CodableColor(red: 0.55, green: 0.5, blue: 0.45, opacity: 1.0)
        )
    ]

    private init() {
        // Load saved theme or default to forest
        if let savedID = UserDefaults.standard.string(forKey: themesKey),
           let theme = Self.themes.first(where: { $0.id == savedID }) {
            self.currentTheme = theme
        } else {
            self.currentTheme = Self.themes[0]
        }
    }

    func nextTheme() {
        guard let currentIndex = Self.themes.firstIndex(where: { $0.id == currentTheme.id }) else {
            return
        }
        let nextIndex = (currentIndex + 1) % Self.themes.count
        currentTheme = Self.themes[nextIndex]
    }

    private func saveTheme() {
        UserDefaults.standard.set(currentTheme.id, forKey: themesKey)
    }
}

// MARK: - Environment Key

struct ThemeEnvironmentKey: EnvironmentKey {
    static let defaultValue: AppTheme = ThemeManager.themes[0]
}

extension EnvironmentValues {
    var appTheme: AppTheme {
        get { self[ThemeEnvironmentKey.self] }
        set { self[ThemeEnvironmentKey.self] = newValue }
    }
}

// MARK: - View Extensions

extension View {
    func themedBackground() -> some View {
        self.modifier(ThemedBackgroundModifier())
    }

    func themedCard() -> some View {
        self.modifier(ThemedCardModifier())
    }
}

struct ThemedBackgroundModifier: ViewModifier {
    @Environment(\.appTheme) var theme

    func body(content: Content) -> some View {
        content
            .background(theme.background.ignoresSafeArea())
    }
}

struct ThemedCardModifier: ViewModifier {
    @Environment(\.appTheme) var theme

    func body(content: Content) -> some View {
        content
            .background(theme.surface)
            .cornerRadius(16)
            .shadow(color: Color.black.opacity(0.08), radius: 12, x: 0, y: 4)
    }
}

