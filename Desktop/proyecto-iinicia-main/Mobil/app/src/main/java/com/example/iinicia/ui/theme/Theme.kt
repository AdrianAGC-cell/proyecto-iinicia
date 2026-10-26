package com.example.iinicia.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val DarkBackground = Color(0xFF030712)
val DarkSurface = Color(0xFF0B0F19)
val CardBackgroundDark = Color(0xFF111827)
val CardBorderDark = Color(0xFF1F2937)
val TopNoticeBarColor = Color(0xFF0B1B3D)
val CyanAccent = Color(0xFF38BDF8)
val CyanBright = Color(0xFF0EA5E9)
val HeaderBackground = Color(0xFFFFFFFF)
val TextWhite = Color(0xFFFFFFFF)
val TextMuted = Color(0xFF9CA3AF)

// Aliases for compatibility with CourseDetailScreen, NotificationsScreen, ProfileScreen
val BrightBlue = CyanAccent
val CardBackground = CardBackgroundDark
val CardBorder = CardBorderDark
val IvoryBackground = DarkBackground
val NavyPrimary = CyanAccent

private val IiniciaDarkColorScheme = darkColorScheme(
    primary = CyanAccent,
    onPrimary = Color.Black,
    primaryContainer = CardBackgroundDark,
    onPrimaryContainer = TextWhite,
    secondary = CyanBright,
    onSecondary = Color.White,
    background = DarkBackground,
    onBackground = TextWhite,
    surface = DarkSurface,
    onSurface = TextWhite,
    surfaceVariant = CardBackgroundDark,
    onSurfaceVariant = TextWhite,
    outline = CardBorderDark
)

@Composable
fun IiniciaTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = IiniciaDarkColorScheme,
        content = content
    )
}
