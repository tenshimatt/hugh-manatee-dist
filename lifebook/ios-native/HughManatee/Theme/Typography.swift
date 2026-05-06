import SwiftUI

/// Hugh Manatee typography — elderly-first: body is 22pt, not 16pt.
enum HughFont {
    static let display = Font.system(size: 56, weight: .bold)
    static let headingLarge = Font.system(size: 34, weight: .bold)
    static let heading = Font.system(size: 28, weight: .semibold)
    static let bodyLarge = Font.system(size: 26, weight: .regular)
    static let body = Font.system(size: 22, weight: .regular)
    static let label = Font.system(size: 18, weight: .medium)
    static let caption = Font.system(size: 16, weight: .regular)
    static let small = Font.system(size: 11, weight: .regular)
}
