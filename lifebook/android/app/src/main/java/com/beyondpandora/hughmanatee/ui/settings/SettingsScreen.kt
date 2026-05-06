package com.beyondpandora.hughmanatee.ui.settings

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import com.beyondpandora.hughmanatee.data.local.HughDatabase
import com.beyondpandora.hughmanatee.data.preferences.HughPreferences
import com.beyondpandora.hughmanatee.ui.navigation.Route
import com.beyondpandora.hughmanatee.ui.onboarding.PLACEHOLDER_VOICES
import com.beyondpandora.hughmanatee.ui.theme.Accent
import com.beyondpandora.hughmanatee.ui.theme.BgTop
import com.beyondpandora.hughmanatee.ui.theme.Danger
import com.beyondpandora.hughmanatee.ui.theme.Ink
import com.beyondpandora.hughmanatee.ui.theme.InkSoft
import com.beyondpandora.hughmanatee.ui.theme.Lg
import com.beyondpandora.hughmanatee.ui.theme.Md
import com.beyondpandora.hughmanatee.ui.theme.Sm
import com.beyondpandora.hughmanatee.ui.theme.SurfaceAlt
import com.beyondpandora.hughmanatee.ui.theme.Xl
import com.beyondpandora.hughmanatee.ui.theme.Xxl

@Composable
fun SettingsScreen(
    navController: NavHostController,
    db: HughDatabase,
    prefs: HughPreferences,
    modifier: Modifier = Modifier,
    vm: SettingsViewModel = viewModel(
        factory = SettingsViewModelFactory(db, prefs)
    ),
) {
    val state by vm.state.collectAsState()

    // Delete confirmation dialog
    if (state.showDeleteConfirm) {
        AlertDialog(
            onDismissRequest = { vm.dismissDeleteConfirm() },
            title = { Text("Delete all data?", style = MaterialTheme.typography.titleLarge) },
            text = {
                Text(
                    "This will permanently delete all your memories and profile. This cannot be undone.",
                    style = MaterialTheme.typography.bodyMedium,
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    vm.deleteAllData {
                        navController.navigate(Route.Onboarding.path) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                }) {
                    Text("Delete everything", color = Danger)
                }
            },
            dismissButton = {
                TextButton(onClick = { vm.dismissDeleteConfirm() }) {
                    Text("Cancel")
                }
            },
        )
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(BgTop)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = Xl),
    ) {
        Spacer(modifier = Modifier.height(Xxl))

        Text(
            text = "Settings",
            style = MaterialTheme.typography.headlineLarge,
            color = Ink,
        )

        Spacer(modifier = Modifier.height(Xl))

        // ── Profile section ──────────────────────────────
        SectionHeader("Profile")

        if (state.isEditing) {
            OutlinedTextField(
                value = state.editFirstName,
                onValueChange = { vm.updateEditField("firstName", it) },
                label = { Text("Name") },
                singleLine = true,
                textStyle = MaterialTheme.typography.titleLarge,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Accent,
                    cursorColor = Accent,
                    focusedLabelColor = Accent,
                ),
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(modifier = Modifier.height(Md))
            OutlinedTextField(
                value = state.editBirthYear,
                onValueChange = { vm.updateEditField("birthYear", it) },
                label = { Text("Birth year") },
                singleLine = true,
                textStyle = MaterialTheme.typography.titleLarge,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Accent,
                    cursorColor = Accent,
                    focusedLabelColor = Accent,
                ),
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(modifier = Modifier.height(Md))
            OutlinedTextField(
                value = state.editHometown,
                onValueChange = { vm.updateEditField("hometown", it) },
                label = { Text("Hometown") },
                singleLine = true,
                textStyle = MaterialTheme.typography.titleLarge,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Accent,
                    cursorColor = Accent,
                    focusedLabelColor = Accent,
                ),
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(modifier = Modifier.height(Md))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
            ) {
                OutlinedButton(onClick = { vm.cancelEditing() }) {
                    Text("Cancel")
                }
                Spacer(modifier = Modifier.width(Md))
                Button(
                    onClick = { vm.saveProfile() },
                    enabled = !state.isSaving && state.editFirstName.isNotBlank(),
                    colors = ButtonDefaults.buttonColors(containerColor = Accent),
                ) {
                    Text(if (state.isSaving) "Saving…" else "Save")
                }
            }
        } else {
            state.profile?.let { profile ->
                ProfileRow("Name", profile.firstName)
                ProfileRow("Birth year", profile.birthYear?.toString() ?: "Not set")
                ProfileRow("Hometown", profile.hometown ?: "Not set")
            }
            Spacer(modifier = Modifier.height(Md))
            OutlinedButton(
                onClick = { vm.startEditing() },
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Edit profile")
            }
        }

        Spacer(modifier = Modifier.height(Xl))

        // ── Voice section ────────────────────────────────
        SectionHeader("Voice")

        Text(
            text = state.selectedVoice?.label ?: "Unknown",
            style = MaterialTheme.typography.titleLarge,
            color = Ink,
        )
        Text(
            text = state.selectedVoice?.description ?: "",
            style = MaterialTheme.typography.bodySmall,
            color = InkSoft,
        )

        Spacer(modifier = Modifier.height(Md))

        if (state.showVoicePicker) {
            PLACEHOLDER_VOICES.forEach { voice ->
                val isSelected = voice.voiceId == state.selectedVoice?.voiceId
                Card(
                    onClick = { vm.selectVoice(voice) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (isSelected) SurfaceAlt else Color.White,
                    ),
                    border = if (isSelected) BorderStroke(2.dp, Accent) else null,
                ) {
                    Row(modifier = Modifier.padding(Md)) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = voice.label,
                                style = MaterialTheme.typography.titleMedium,
                                color = Ink,
                            )
                            Text(
                                text = voice.description,
                                style = MaterialTheme.typography.bodySmall,
                                color = InkSoft,
                            )
                        }
                    }
                }
            }
        }

        OutlinedButton(
            onClick = { vm.toggleVoicePicker() },
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(if (state.showVoicePicker) "Cancel" else "Change voice")
        }

        Spacer(modifier = Modifier.height(Xl))

        // ── Data section ─────────────────────────────────
        SectionHeader("Data")

        OutlinedButton(
            onClick = { /* Coming soon — SET-03 */ },
            modifier = Modifier.fillMaxWidth(),
            enabled = false,
        ) {
            Text("Export all data (coming soon)")
        }

        Spacer(modifier = Modifier.height(Md))

        Button(
            onClick = { vm.showDeleteConfirm() },
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = Danger),
        ) {
            Text("Delete all data")
        }

        Spacer(modifier = Modifier.height(80.dp))
    }
}

@Composable
private fun SectionHeader(title: String) {
    Text(
        text = title,
        style = MaterialTheme.typography.labelLarge,
        color = InkSoft,
    )
    Spacer(modifier = Modifier.height(Sm))
}

@Composable
private fun ProfileRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = Sm),
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = InkSoft,
            modifier = Modifier.width(120.dp),
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            color = Ink,
        )
    }
}

import androidx.lifecycle.ViewModelProvider

class SettingsViewModelFactory(
    private val db: HughDatabase,
    private val prefs: HughPreferences,
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : androidx.lifecycle.ViewModel> create(modelClass: Class<T>): T {
        return SettingsViewModel(db, prefs) as T
    }
}
