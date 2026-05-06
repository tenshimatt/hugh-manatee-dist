package com.beyondpandora.hughmanatee.ui.onboarding

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.beyondpandora.hughmanatee.ui.theme.Accent
import com.beyondpandora.hughmanatee.ui.theme.Ink
import com.beyondpandora.hughmanatee.ui.theme.InkSoft
import com.beyondpandora.hughmanatee.ui.theme.Lg
import com.beyondpandora.hughmanatee.ui.theme.Md
import com.beyondpandora.hughmanatee.ui.theme.SurfaceAlt
import com.beyondpandora.hughmanatee.ui.theme.TouchMin
import com.beyondpandora.hughmanatee.ui.theme.Xl

/**
 * Onboarding step 2 — Voice picker.
 * Matches ONB-02 from the Plane project.
 */
@Composable
fun VoicePickerScreen(
    voices: List<VoiceOption>,
    selectedVoice: VoiceOption?,
    onSelectVoice: (VoiceOption) -> Unit,
    onContinue: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = Xl),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(modifier = Modifier.height(60.dp))

        Text(
            text = "Choose Hugh's voice",
            style = MaterialTheme.typography.headlineLarge,
            color = Ink,
            textAlign = TextAlign.Center,
        )

        Spacer(modifier = Modifier.height(Md))

        Text(
            text = "This is the voice that will guide your conversations. Pick the one that feels right.",
            style = MaterialTheme.typography.bodyMedium,
            color = InkSoft,
            textAlign = TextAlign.Center,
        )

        Spacer(modifier = Modifier.height(Xl))

        voices.forEach { voice ->
            val isSelected = voice == selectedVoice
            Card(
                onClick = { onSelectVoice(voice) },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 6.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (isSelected) SurfaceAlt else Color.White,
                ),
                border = if (isSelected) {
                    BorderStroke(2.dp, Accent)
                } else {
                    BorderStroke(1.dp, com.beyondpandora.hughmanatee.ui.theme.Divider)
                },
                shape = MaterialTheme.shapes.medium,
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(Md),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = voice.label,
                            style = MaterialTheme.typography.titleLarge,
                            color = Ink,
                        )
                        Text(
                            text = voice.description,
                            style = MaterialTheme.typography.bodySmall,
                            color = InkSoft,
                        )
                    }
                    Spacer(modifier = Modifier.width(Md))
                    // Selected indicator dot
                    if (isSelected) {
                        androidx.compose.foundation.Canvas(modifier = Modifier.size(16.dp)) {
                            drawCircle(color = Accent)
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.weight(1f))

        Button(
            onClick = onContinue,
            enabled = selectedVoice != null,
            modifier = Modifier
                .fillMaxWidth()
                .height(TouchMin),
            colors = ButtonDefaults.buttonColors(containerColor = Accent),
            shape = MaterialTheme.shapes.medium,
        ) {
            Text(
                text = "Continue",
                style = MaterialTheme.typography.labelLarge,
            )
        }

        Spacer(modifier = Modifier.height(Lg))
    }
}
