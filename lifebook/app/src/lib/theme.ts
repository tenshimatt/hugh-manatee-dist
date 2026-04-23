/**
 * Hugh Manatee theme.
 *
 * Elderly-first defaults: large type, generous spacing, high contrast.
 * All sizes are deliberately big. Don't "normalize" them smaller without
 * checking with the product brief in Obsidian.
 */

export const colors = {
  // Warm, calm background gradient anchors
  bgTop: "#F4ECE1",
  bgBottom: "#E8D9C4",

  // Primary ink — near-black, not pure black (less harsh for elderly eyes)
  ink: "#1E1B17",
  inkSoft: "#4A443C",
  inkFaint: "#8B8578",

  // Accent — warm amber
  accent: "#B8651A",
  accentSoft: "#E8A764",

  // Surfaces
  surface: "#FFFFFF",
  surfaceAlt: "#FBF6EE",

  // States
  danger: "#9A2A2A",
  success: "#2F6B3C",
  divider: "#D8CEBE",
};

export const fontSize = {
  // Elderly-first: default body is 22pt, not 16pt.
  body: 22,
  bodyLarge: 26,
  heading: 34,
  headingLarge: 42,
  display: 56,
  label: 18,
  caption: 16,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 36,
  xxl: 56,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
};

// Minimum 44pt touch target per iOS HIG; we go bigger.
export const touchTarget = {
  min: 56,
  primary: 72,
};

export const theme = { colors, fontSize, spacing, radius, touchTarget };
export type Theme = typeof theme;
