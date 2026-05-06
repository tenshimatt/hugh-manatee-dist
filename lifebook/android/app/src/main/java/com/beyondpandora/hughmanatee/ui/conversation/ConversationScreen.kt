package com.beyondpandora.hughmanatee.ui.conversation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Album
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import com.beyondpandora.hughmanatee.ui.navigation.Route
import com.beyondpandora.hughmanatee.ui.theme.Accent
import com.beyondpandora.hughmanatee.ui.theme.BgTop
import com.beyondpandora.hughmanatee.ui.theme.Danger
import com.beyondpandora.hughmanatee.ui.theme.Ink
import com.beyondpandora.hughmanatee.ui.theme.InkFaint
import com.beyondpandora.hughmanatee.ui.theme.InkSoft
import com.beyondpandora.hughmanatee.ui.theme.Lg
import com.beyondpandora.hughmanatee.ui.theme.Md
import com.beyondpandora.hughmanatee.ui.theme.Sm
import com.beyondpandora.hughmanatee.ui.theme.Xl

/**
 * Conversation screen — the product.
 *
 * Matches ConversationLive.tsx layout 1:1.
 * Uses LiveKit WebRTC for ElevenLabs CAI.
 */
@Composable
fun ConversationScreen(
    navController: NavHostController,
    modifier: Modifier = Modifier,
    vm: ConversationViewModel = viewModel(),
) {
    val state by vm.state.collectAsState()
    var showEndDialog by remember { mutableStateOf(false) }

    // Start session on screen enter
    LaunchedEffect(Unit) {
        vm.startSession()
    }

    // Mute mic when navigating away
    DisposableEffect(Unit) {
        onDispose { vm.setMuted(true) }
    }

    // End dialog
    if (showEndDialog) {
        AlertDialog(
            onDismissRequest = { showEndDialog = false },
            title = { Text("End this session?", style = MaterialTheme.typography.titleLarge) },
            text = { Text("Hugh will save what you've said.", style = MaterialTheme.typography.bodyMedium) },
            confirmButton = {
                TextButton(onClick = {
                    showEndDialog = false
                    vm.endSession()
                    navController.navigate(Route.Library.path) {
                        popUpTo(Route.Conversation.path) { inclusive = true }
                    }
                }) {
                    Text("End", color = Danger)
                }
            },
            dismissButton = {
                TextButton(onClick = { showEndDialog = false }) {
                    Text("Keep talking")
                }
            },
        )
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(BgTop)
    ) {
        // Center panel — status + first turn
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = Xl),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            if (state.status in listOf(ConvStatus.Loading, ConvStatus.Ready, ConvStatus.Ending)) {
                CircularProgressIndicator(
                    color = Accent,
                    modifier = Modifier.size(48.dp),
                    strokeWidth = 3.dp,
                )
                Spacer(modifier = Modifier.height(Lg))
            }

            Text(
                text = state.statusText,
                style = MaterialTheme.typography.bodyLarge,
                color = InkSoft,
                textAlign = TextAlign.Center,
            )

            if (state.status == ConvStatus.Live && state.firstTurn != null && state.turnCount == 0) {
                Spacer(modifier = Modifier.height(Xl))
                Text(
                    text = state.firstTurn,
                    style = MaterialTheme.typography.headlineLarge,
                    color = Ink,
                    textAlign = TextAlign.Center,
                )
            }

            if (state.error != null && state.status == ConvStatus.Error) {
                Spacer(modifier = Modifier.height(Md))
                Text(
                    text = state.error,
                    style = MaterialTheme.typography.bodyMedium,
                    color = Danger,
                    textAlign = TextAlign.Center,
                )
            }
        }

        // Footer — Memories | End | Settings
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.BottomCenter)
                .padding(horizontal = Lg, vertical = Sm),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.Center,
        ) {
            // Memories
            IconButton(
                onClick = { navController.navigate(Route.Library.path) },
                modifier = Modifier.size(72.dp),
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Outlined.Album,
                        contentDescription = "Memories",
                        tint = InkSoft,
                    )
                    Text(
                        text = "Memories",
                        style = MaterialTheme.typography.labelSmall,
                        color = InkSoft,
                    )
                }
            }

            Spacer(modifier = Modifier.width(Md))

            // End button
            Button(
                onClick = { showEndDialog = true },
                enabled = state.status != ConvStatus.Ending,
                modifier = Modifier
                    .height(40.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (state.status == ConvStatus.Ending) InkFaint else Accent,
                ),
                shape = CircleShape,
            ) {
                Text(
                    text = if (state.status == ConvStatus.Ending) "Saving…" else "End",
                    style = MaterialTheme.typography.labelLarge,
                )
            }

            Spacer(modifier = Modifier.width(Md))

            // Settings
            IconButton(
                onClick = { navController.navigate(Route.Settings.path) },
                modifier = Modifier.size(72.dp),
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Outlined.Settings,
                        contentDescription = "Settings",
                        tint = InkSoft,
                    )
                    Text(
                        text = "Settings",
                        style = MaterialTheme.typography.labelSmall,
                        color = InkSoft,
                    )
                }
            }
        }
    }
}
