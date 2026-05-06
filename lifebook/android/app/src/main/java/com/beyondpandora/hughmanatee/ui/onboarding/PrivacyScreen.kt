package com.beyondpandora.hughmanatee.ui.onboarding

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import com.beyondpandora.hughmanatee.ui.theme.Accent
import com.beyondpandora.hughmanatee.ui.theme.Ink
import com.beyondpandora.hughmanatee.ui.theme.InkSoft
import com.beyondpandora.hughmanatee.ui.theme.Lg
import com.beyondpandora.hughmanatee.ui.theme.Md
import com.beyondpandora.hughmanatee.ui.theme.TouchMin
import com.beyondpandora.hughmanatee.ui.theme.Xl

/**
 * Onboarding step 4 — Privacy statement.
 * Matches ONB-05 from the Plane project.
 */
@Composable
fun PrivacyScreen(
    isSubmitting: Boolean,
    onMeetHugh: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = Xl),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(modifier = Modifier.height(80.dp))

        Text(
            text = "Your stories stay yours",
            style = MaterialTheme.typography.headlineLarge,
            color = Ink,
            textAlign = TextAlign.Center,
        )

        Spacer(modifier = Modifier.height(Lg))

        Text(
            text = "Everything stays on your phone. " +
                    "Hugh doesn't share your stories with anyone. " +
                    "No accounts, no cloud storage, no data collection. " +
                    "When you delete the app, everything is gone.",
            style = MaterialTheme.typography.bodyLarge,
            color = InkSoft,
            textAlign = TextAlign.Center,
        )

        Spacer(modifier = Modifier.weight(1f))

        Button(
            onClick = onMeetHugh,
            enabled = !isSubmitting,
            modifier = Modifier
                .fillMaxWidth()
                .height(TouchMin),
            colors = ButtonDefaults.buttonColors(containerColor = Accent),
            shape = MaterialTheme.shapes.medium,
        ) {
            Text(
                text = if (isSubmitting) "Setting up…" else "Meet Hugh",
                style = MaterialTheme.typography.labelLarge,
            )
        }

        Spacer(modifier = Modifier.height(Lg))
    }
}
