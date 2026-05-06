package com.beyondpandora.hughmanatee.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.beyondpandora.hughmanatee.data.local.HughDatabase
import com.beyondpandora.hughmanatee.data.local.entities.ProfileEntity
import com.beyondpandora.hughmanatee.data.preferences.HughPreferences
import com.beyondpandora.hughmanatee.ui.onboarding.PLACEHOLDER_VOICES
import com.beyondpandora.hughmanatee.ui.onboarding.VoiceOption
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class SettingsUiState(
    val profile: ProfileEntity? = null,
    val isEditing: Boolean = false,
    val editFirstName: String = "",
    val editBirthYear: String = "",
    val editHometown: String = "",
    val showVoicePicker: Boolean = false,
    val selectedVoice: VoiceOption? = null,
    val showDeleteConfirm: Boolean = false,
    val isSaving: Boolean = false,
)

class SettingsViewModel(
    private val db: HughDatabase,
    private val prefs: HughPreferences,
) : ViewModel() {

    private val profileRepo = com.beyondpandora.hughmanatee.data.repository.ProfileRepository(db)

    private val _state = MutableStateFlow(SettingsUiState())
    val state: StateFlow<SettingsUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            val profile = profileRepo.get()
            val voice = PLACEHOLDER_VOICES.find { it.voiceId == profile?.voiceId }
            _state.value = _state.value.copy(
                profile = profile,
                selectedVoice = voice,
            )
        }
    }

    fun startEditing() {
        val p = _state.value.profile ?: return
        _state.value = _state.value.copy(
            isEditing = true,
            editFirstName = p.firstName,
            editBirthYear = p.birthYear?.toString() ?: "",
            editHometown = p.hometown ?: "",
        )
    }

    fun cancelEditing() {
        _state.value = _state.value.copy(isEditing = false)
    }

    fun saveProfile() {
        val s = _state.value
        val p = s.profile ?: return
        if (s.editFirstName.isBlank()) return
        viewModelScope.launch {
            _state.value = _state.value.copy(isSaving = true)
            val updated = p.copy(
                firstName = s.editFirstName.trim(),
                birthYear = s.editBirthYear.toIntOrNull(),
                hometown = s.editHometown.trim().ifBlank { null },
                updatedAt = System.currentTimeMillis() / 1000,
            )
            profileRepo.upsert(updated)
            _state.value = _state.value.copy(
                profile = updated,
                isEditing = false,
                isSaving = false,
            )
        }
    }

    fun toggleVoicePicker() {
        _state.value = _state.value.copy(showVoicePicker = !_state.value.showVoicePicker)
    }

    fun selectVoice(voice: VoiceOption) {
        viewModelScope.launch {
            val p = _state.value.profile ?: return@launch
            val updated = p.copy(
                voiceId = voice.voiceId,
                agentId = voice.agentId,
                updatedAt = System.currentTimeMillis() / 1000,
            )
            profileRepo.upsert(updated)
            prefs.setProfileComplete(voice.voiceId, voice.agentId)
            _state.value = _state.value.copy(
                profile = updated,
                selectedVoice = voice,
                showVoicePicker = false,
            )
        }
    }

    fun showDeleteConfirm() {
        _state.value = _state.value.copy(showDeleteConfirm = true)
    }

    fun dismissDeleteConfirm() {
        _state.value = _state.value.copy(showDeleteConfirm = false)
    }

    fun deleteAllData(onDone: () -> Unit) {
        viewModelScope.launch {
            db.nukeDb()
            prefs.clearAll()
            onDone()
        }
    }

    fun updateEditField(field: String, value: String) {
        _state.value = when (field) {
            "firstName" -> _state.value.copy(editFirstName = value)
            "birthYear" -> _state.value.copy(editBirthYear = value.filter { it.isDigit() }.take(4))
            "hometown" -> _state.value.copy(editHometown = value)
            else -> _state.value
        }
    }
}
