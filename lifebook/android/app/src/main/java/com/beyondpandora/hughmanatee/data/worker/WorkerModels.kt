package com.beyondpandora.hughmanatee.data.worker

import kotlinx.serialization.Serializable

/**
 * Worker API models — exact Kotlin equivalents of the TypeScript
 * interfaces in app/src/services/worker.ts.
 */

// ── /agent/config ──────────────────────────────────────────

@Serializable
data class AgentConfigRequest(
    val first_name: String,
    val birth_year: Int? = null,
    val hometown: String? = null,
    val voice_id: String,
    val last_anchor: String? = null,
    val preference: String? = null, // "old" | "recent"
)

@Serializable
data class RuntimeContext(
    val seed_prompts: List<String>,
    val era_hooks: List<String>,
)

@Serializable
data class AgentConfigResponse(
    val agent_id: String,
    val conversation_token: String,
    val first_turn: String,
    val runtime_context: RuntimeContext,
)

// ── /collage/images ────────────────────────────────────────

@Serializable
data class CollageRequest(
    val birth_year: Int? = null,
    val hometown: String? = null,
    val theme: String? = null,
)

@Serializable
data class CollageResponse(
    val images: List<CollageImage>,
    val gradient: GradientColors,
)

@Serializable
data class CollageImage(
    val url: String,
    val alt: String,
)

@Serializable
data class GradientColors(
    val from: String,
    val to: String,
)

// ── /session/anchor ────────────────────────────────────────

@Serializable
data class AnchorRequest(
    val turns: List<TurnPayload>,
)

@Serializable
data class TurnPayload(
    val speaker: String, // "user" | "hugh"
    val text: String,
)

@Serializable
data class AnchorResponse(
    val anchor_phrase: String,
    val title_suggestion: String,
    val entities: List<ExtractedEntity>,
)

@Serializable
data class ExtractedEntity(
    val kind: String, // "person" | "place" | "object" | "date" | "event"
    val value: String,
)

// ── Generic error ──────────────────────────────────────────

@Serializable
data class WorkerError(
    val error: String,
)
