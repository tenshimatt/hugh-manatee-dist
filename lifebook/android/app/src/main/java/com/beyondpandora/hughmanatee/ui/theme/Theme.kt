package com.beyondpandora.hughmanatee.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.compositionLocalOf

/**
 * Capped font scale — prevents iOS Large Text from blowing up
 * the layout past 1.15×. Equivalent to maxFontSizeMultiplier={1.15}
 * on every Text/TextInput in the Expo app.
 */
val LocalFontScale = compositionLocalOf { 1f }

private val HughColorScheme = lightColorScheme(
    primary = Accent,
    onPrimary = Surface,
    secondary = AccentSoft,
    onSecondary = Ink,
    background = BgTop,
    onBackground = Ink,
    surface = Surface,
    onSurface = Ink,
    surfaceVariant = SurfaceAlt,
    onSurfaceVariant = InkSoft,
    error = Danger,
    onError = Surface,
    outline = Divider,
)

@Composable
fun HughTheme(content: @Composable () -> Unit) {
    val fontScale = LocalFontScale.current.coerceIn(0.8f, 1.15f)

    CompositionLocalProvider(LocalFontScale provides fontScale) {
        MaterialTheme(
            colorScheme = HughColorScheme,
            typography = HughTypography,
            content = content,
        )
    }
}
