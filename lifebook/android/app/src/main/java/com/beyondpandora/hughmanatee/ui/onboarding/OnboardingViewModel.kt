package com.beyondpandora.hughmanatee.ui.onboarding

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.beyondpandora.hughmanatee.data.local.HughDatabase
import com.beyondpandora.hughmanatee.data.local.entities.ProfileEntity
import com.beyondpandora.hughmanatee.data.preferences.HughPreferences
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * Voice option displayed in the picker.
 * Matches PLACEHOLDER_VOICES from app/src/lib/profile.ts.
 */
data class VoiceOption(
    val voiceId: String,
    val agentId: String,
    val label: String,
    val description: String,
)

val PLACEHOLDER_VOICES = listOf(
    VoiceOption(
        voiceId = "voice-warm-female-01",
        agentId = "agent-warm-female-01",
        label = "Nora",
        description = "Warm, calm. A friend over tea.",
    ),
    VoiceOption(
        voiceId = "voice-warm-male-01",
        agentId = "agent-warm-male-01",
        label = "Arthur",
        description = "Steady, gentle. An older friend.",
    ),
    VoiceOption(
        voiceId = "voice-bright-female-01",
        agentId = "agent-bright-female-01",
        label = "June",
        description = "Brighter, curious. Asks good questions.",
    ),
)

data class OnboardingUiState(
    val firstName: String = "",
    val selectedVoice: VoiceOption? = null,
    val birthYear: String = "",
    val hometown: String = "",
    val isSubmitting: Boolean = false,
    val error: String? = null,
)

class OnboardingViewModel(
    private val db: HughDatabase,
    private val prefs: HughPreferences,
) : ViewModel() {

    private val _state = MutableStateFlow(OnboardingUiState())
    val state: StateFlow<OnboardingUiState> = _state.asStateFlow()

    fun setFirstName(name: String) {
        _state.value = _state.value.copy(firstName = name, error = null)
    }

    fun selectVoice(voice: VoiceOption) {
        _state.value = _state.value.copy(selectedVoice = voice, error = null)
    }

    fun setBirthYear(year: String) {
        _state.value = _state.value.copy(birthYear = year)
    }

    fun setHometown(town: String) {
        _state.value = _state.value.copy(hometown = town)
    }

    fun completeOnboarding(onDone: () -> Unit) {
        val s = _state.value
        if (s.firstName.isBlank()) {
            _state.value = s.copy(error = "Please enter your name")
            return
        }
        val voice = s.selectedVoice ?: PLACEHOLDER_VOICES.first()
        val birthYear = s.birthYear.toIntOrNull()

        _state.value = s.copy(isSubmitting = true, error = null)

        viewModelScope.launch {
            try {
                val now = System.currentTimeMillis() / 1000
                val profile = ProfileEntity(
                    firstName = s.firstName.trim(),
                    birthYear = birthYear,
                    hometown = s.hometown.trim().ifBlank { null },
                    voiceId = voice.voiceId,
                    agentId = voice.agentId,
                    createdAt = now,
                    updatedAt = now,
                )
                db.profileDao().upsertProfile(profile)
                prefs.setProfileComplete(voice.voiceId, voice.agentId)
                onDone()
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    isSubmitting = false,
                    error = "Couldn't save profile: ${e.message}",
                )
            }
        }
    }
}
