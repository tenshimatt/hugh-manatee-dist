import SwiftUI

/// Hugh Manatee color palette — ported 1:1 from app/src/lib/theme.ts
enum HughColor {
    // Background gradient anchors
    static let bgTop = Color(red: 0.957, green: 0.925, blue: 0.882)         // #F4ECE1
    static let bgBottom = Color(red: 0.910, green: 0.851, blue: 0.769)       // #E8D9C4

    // Ink — near-black, softer than pure #000
    static let ink = Color(red: 0.118, green: 0.106, blue: 0.090)            // #1E1B17
    static let inkSoft = Color(red: 0.290, green: 0.267, blue: 0.235)        // #4A443C
    static let inkFaint = Color(red: 0.545, green: 0.522, blue: 0.471)       // #8B8578

    // Accent — warm amber/terracotta
    static let accent = Color(red: 0.722, green: 0.396, blue: 0.102)         // #B8651A
    static let accentSoft = Color(red: 0.910, green: 0.655, blue: 0.392)     // #E8A764

    // Surfaces
    static let surface = Color.white
    static let surfaceAlt = Color(red: 0.984, green: 0.965, blue: 0.933)     // #FBF6EE

    // States
    static let danger = Color(red: 0.604, green: 0.165, blue: 0.165)          // #9A2A2A
    static let success = Color(red: 0.184, green: 0.420, blue: 0.235)         // #2F6B3C
    static let divider = Color(red: 0.847, green: 0.808, blue: 0.745)        // #D8CEBE
}
