package com.beyondpandora.hughmanatee.data.repository

import com.beyondpandora.hughmanatee.data.worker.AnchorRequest
import com.beyondpandora.hughmanatee.data.worker.AgentConfigRequest
import com.beyondpandora.hughmanatee.data.worker.AgentConfigResponse
import com.beyondpandora.hughmanatee.data.worker.AnchorResponse
import com.beyondpandora.hughmanatee.data.worker.TurnPayload
import com.beyondpandora.hughmanatee.data.worker.WorkerClient

/**
 * Conversation orchestration repository.
 *
 * Wraps the Worker API calls that bookend every Hugh conversation:
 *   1. fetchAgentConfig() — get ElevenLabs token + first turn before connecting
 *   2. fetchSessionAnchor() — get title + anchor phrase after session ends
 *
 * Mirrors fetchAgentConfig() / fetchSessionAnchor() in app/src/services/worker.ts.
 */
class ConversationRepository {

    private val api = WorkerClient.api

    suspend fun fetchAgentConfig(request: AgentConfigRequest): Result<AgentConfigResponse> {
        return try {
            Result.success(api.getAgentConfig(request))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun fetchSessionAnchor(
        turns: List<Pair<String, String>>,
    ): Result<AnchorResponse> {
        return try {
            val payload = AnchorRequest(
                turns = turns.map { (speaker, text) ->
                    TurnPayload(speaker = speaker, text = text)
                }
            )
            Result.success(api.getSessionAnchor(payload))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
