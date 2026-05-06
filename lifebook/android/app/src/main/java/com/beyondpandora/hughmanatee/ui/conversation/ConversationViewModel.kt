package com.beyondpandora.hughmanatee.ui.conversation

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.beyondpandora.hughmanatee.data.livekit.HughLiveKitClient
import com.beyondpandora.hughmanatee.data.local.HughDatabase
import com.beyondpandora.hughmanatee.data.local.entities.SessionEntity
import com.beyondpandora.hughmanatee.data.repository.ConversationRepository
import com.beyondpandora.hughmanatee.data.repository.SessionRepository
import com.beyondpandora.hughmanatee.data.worker.AgentConfigRequest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

enum class ConvStatus {
    Loading, Ready, Live, Ending, Error
}

data class ConversationUiState(
    val status: ConvStatus = ConvStatus.Loading,
    val statusText: String = "Finding Hugh…",
    val firstTurn: String? = null,
    val error: String? = null,
    val turnCount: Int = 0,
)

class ConversationViewModel(application: Application) : AndroidViewModel(application) {

    private val db = HughDatabase.getInstance(application)
    private val profileRepo = com.beyondpandora.hughmanatee.data.repository.ProfileRepository(db)
    private val sessionRepo = SessionRepository(db)
    private val convRepo = ConversationRepository()
    private val liveKit = HughLiveKitClient(application)

    private val _state = MutableStateFlow(ConversationUiState())
    val state: StateFlow<ConversationUiState> = _state.asStateFlow()

    private var currentSessionId: String? = null
    private var turnOrdinal = 0
    private val turnsBuffer = mutableListOf<Pair<String, String>>() // (speaker, text)

    private var started = false
    private var ended = false

    fun startSession() {
        if (started || ended) return
        started = true

        viewModelScope.launch {
            try {
                val profile = profileRepo.get() ?: run {
                    _state.value = _state.value.copy(
                        status = ConvStatus.Error,
                        error = "No profile found",
                    )
                    return@launch
                }

                val lastAnchor = sessionRepo.getLastAnchor()

                val cfg = convRepo.fetchAgentConfig(
                    AgentConfigRequest(
                        first_name = profile.firstName,
                        birth_year = profile.birthYear,
                        hometown = profile.hometown,
                        voice_id = profile.voiceId,
                        last_anchor = lastAnchor,
                    )
                ).getOrThrow()

                _state.value = _state.value.copy(
                    status = ConvStatus.Ready,
                    statusText = "Opening the mic…",
                    firstTurn = cfg.first_turn,
                )

                // Create session row in local DB
                val session = sessionRepo.createSession("agent-2026-05-06")
                currentSessionId = session.id

                // Connect LiveKit
                liveKit.connect(cfg.conversation_token)

                // Collect turns
                launch {
                    liveKit.turns.collect { turn ->
                        turnsBuffer.add(turn.speaker to turn.text)
                        val sid = currentSessionId ?: return@collect
                        turnOrdinal++
                        sessionRepo.appendTurn(
                            sessionId = sid,
                            speaker = turn.speaker,
                            text = turn.text,
                            ordinal = turnOrdinal,
                        )
                        _state.value = _state.value.copy(
                            turnCount = turnOrdinal,
                        )
                    }
                }

                // Watch connection status
                launch {
                    liveKit.status.collect { s ->
                        when (s) {
                            is HughLiveKitClient.Status.Connected -> {
                                _state.value = _state.value.copy(
                                    status = ConvStatus.Live,
                                    statusText = "Hugh is listening.",
                                )
                            }
                            is HughLiveKitClient.Status.Error -> {
                                _state.value = _state.value.copy(
                                    status = ConvStatus.Error,
                                    error = s.message,
                                )
                            }
                            is HughLiveKitClient.Status.Disconnected -> {
                                // Handled by finishSession()
                            }
                            else -> {}
                        }
                    }
                }

                // Watch agent speaking state
                launch {
                    liveKit.agentSpeaking.collect { speaking ->
                        if (_state.value.status == ConvStatus.Live) {
                            _state.value = _state.value.copy(
                                statusText = if (speaking) "Hugh is speaking." else "Hugh is listening.",
                            )
                        }
                    }
                }
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    status = ConvStatus.Error,
                    statusText = "Couldn't reach Hugh.",
                    error = e.message ?: "Unknown error",
                )
            }
        }
    }

    fun endSession() {
        if (ended) return
        ended = true
        _state.value = _state.value.copy(status = ConvStatus.Ending, statusText = "Saving the memory…")

        viewModelScope.launch {
            try {
                liveKit.disconnect()
            } catch (_: Exception) {}

            val sid = currentSessionId ?: return@launch

            var title: String? = null
            var anchor: String? = null

            // Fetch anchor from Worker
            try {
                val tail = turnsBuffer.takeLast(10)
                if (tail.isNotEmpty()) {
                    val anchorRes = convRepo.fetchSessionAnchor(tail).getOrNull()
                    title = anchorRes?.title_suggestion
                    anchor = anchorRes?.anchor_phrase
                }
            } catch (_: Exception) {}

            sessionRepo.endSession(
                sessionId = sid,
                title = title,
                anchorPhrase = anchor,
            )
        }
    }

    fun setMuted(muted: Boolean) {
        liveKit.setMuted(muted)
    }

    override fun onCleared() {
        super.onCleared()
        if (!ended) {
            viewModelScope.launch { liveKit.disconnect() }
        }
    }
}
