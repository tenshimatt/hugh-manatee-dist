package com.beyondpandora.hughmanatee.data.preferences

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "hugh_prefs")

/**
 * Lightweight key-value store for session-scoped preferences.
 * Mirrors expo-secure-store usage pattern from the Expo app.
 */
class HughPreferences(private val context: Context) {

    companion object {
        private val KEY_VOICE_ID = stringPreferencesKey("voice_id")
        private val KEY_AGENT_ID = stringPreferencesKey("agent_id")
        private val KEY_HAS_PROFILE = booleanPreferencesKey("has_profile")
    }

    val hasProfile: Flow<Boolean> = context.dataStore.data.map { prefs ->
        prefs[KEY_HAS_PROFILE] ?: false
    }

    suspend fun setProfileComplete(voiceId: String, agentId: String) {
        context.dataStore.edit { prefs ->
            prefs[KEY_HAS_PROFILE] = true
            prefs[KEY_VOICE_ID] = voiceId
            prefs[KEY_AGENT_ID] = agentId
        }
    }

    suspend fun clearAll() {
        context.dataStore.edit { it.clear() }
    }

    suspend fun getVoiceId(): String? {
        return context.dataStore.data.map { it[KEY_VOICE_ID] }.let { flow ->
            var result: String? = null
            flow.collect { result = it; return@collect }
            result
        }
    }
}
