package com.beyondpandora.hughmanatee.data.livekit

import android.content.Context
import io.livekit.android.LiveKit
import io.livekit.android.room.Room
import io.livekit.android.room.track.LocalAudioTrack
import io.livekit.android.room.track.RemoteAudioTrack
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import livekit.LivekitModels

/**
 * LiveKit WebRTC client for ElevenLabs Conversational AI.
 *
 * The Worker fetches a conversation_token from ElevenLabs.
 * That token is a LiveKit access token — we connect to ElevenLabs'
 * LiveKit server with it. Audio tracks and transcript data messages
 * flow through standard LiveKit channels.
 *
 * Mirrors the @elevenlabs/react-native SDK behaviour on iOS.
 */
class HughLiveKitClient(private val context: Context) {

    /** Connection state: idle → connecting → connected → disconnected */
    sealed class Status {
        data object Idle : Status()
        data object Connecting : Status()
        data object Connected : Status()
        data class Disconnected(val reason: String? = null) : Status()
        data class Error(val message: String) : Status()
    }

    /** A transcript turn received via data channel */
    data class TurnMessage(
        val speaker: String, // "user" | "hugh"
        val text: String,
    )

    private var room: Room? = null

    private val _status = MutableStateFlow<Status>(Status.Idle)
    val status: StateFlow<Status> = _status.asStateFlow()

    private val _turns = MutableSharedFlow<TurnMessage>(extraBufferCapacity = 100)
    val turns: SharedFlow<TurnMessage> = _turns.asSharedFlow()

    private val _agentSpeaking = MutableStateFlow(false)
    val agentSpeaking: StateFlow<Boolean> = _agentSpeaking.asStateFlow()

    /**
     * Connect to ElevenLabs CAI via LiveKit.
     *
     * @param conversationToken LiveKit access token from Worker /agent/config
     */
    suspend fun connect(conversationToken: String) {
        _status.value = Status.Connecting

        try {
            val newRoom = Room(context).apply {
                addListener(object : io.livekit.android.events.RoomListener {
                    override fun onConnected() {
                        _status.value = Status.Connected
                    }

                    override fun onDisconnected(reason: String?) {
                        _status.value = Status.Disconnected(reason)
                    }

                    override fun onError(error: Exception) {
                        _status.value = Status.Error(error.message ?: "Unknown error")
                    }
                })

                // Listen for data messages (transcript turns)
                localParticipant.addListener(object : io.livekit.android.events.ParticipantListener {
                    override fun onDataReceived(data: ByteArray, participant: io.livekit.android.room.participant.Participant?) {
                        try {
                            val msg = LivekitModels.DataPacket.parseFrom(data)
                            val text = msg.value.toStringUtf8()
                            if (text.isNotBlank()) {
                                // Determine speaker: remote = agent (hugh), local = user
                                val speaker = if (participant is io.livekit.android.room.participant.RemoteParticipant) "hugh" else "user"
                                _turns.tryEmit(TurnMessage(speaker = speaker, text = text))
                            }
                        } catch (_: Exception) {
                            // Ignore non-text data packets
                        }
                    }
                })

                // Track agent speaking state
                addListener(object : io.livekit.android.events.RoomListener {
                    override fun onTrackSubscribed(
                        track: io.livekit.android.room.track.Track,
                        participant: io.livekit.android.room.participant.RemoteParticipant,
                    ) {
                        if (track is RemoteAudioTrack) {
                            _agentSpeaking.value = true
                        }
                    }

                    override fun onTrackUnsubscribed(
                        track: io.livekit.android.room.track.Track,
                        participant: io.livekit.android.room.participant.RemoteParticipant,
                    ) {
                        if (track is RemoteAudioTrack) {
                            _agentSpeaking.value = false
                        }
                    }
                })
            }

            room = newRoom
            newRoom.connect(token = conversationToken)
        } catch (e: Exception) {
            _status.value = Status.Error(e.message ?: "Connection failed")
        }
    }

    /** Mute/unmute local microphone */
    fun setMuted(muted: Boolean) {
        room?.localParticipant?.let { participant ->
            participant.trackPublications.values.forEach { pub ->
                if (pub.track is LocalAudioTrack) {
                    (pub.track as LocalAudioTrack).enabled = !muted
                }
            }
        }
    }

    /** End the session */
    suspend fun disconnect() {
        room?.disconnect()
        room = null
        _status.value = Status.Disconnected(null)
    }
}
