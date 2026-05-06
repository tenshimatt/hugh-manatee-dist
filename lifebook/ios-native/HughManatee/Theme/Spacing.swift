import Foundation

/// Hugh Manatee spacing scale — generous for elderly users.
enum HughSpacing {
    static let xs: CGFloat = 4
    static let sm: CGFloat = 8
    static let md: CGFloat = 16
    static let lg: CGFloat = 24
    static let xl: CGFloat = 36
    static let xxl: CGFloat = 56

    /// Minimum 56pt touch target (exceeds iOS HIG 44pt)
    static let touchMin: CGFloat = 56
    static let touchPrimary: CGFloat = 72

    /// Border radius
    static let radiusSm: CGFloat = 8
    static let radiusMd: CGFloat = 14
    static let radiusLg: CGFloat = 22
}
