package com.beyondpandora.hughmanatee.data.repository

import com.beyondpandora.hughmanatee.data.local.HughDatabase
import com.beyondpandora.hughmanatee.data.local.entities.EntityEntity
import com.beyondpandora.hughmanatee.data.local.entities.SessionEntity
import com.beyondpandora.hughmanatee.data.local.entities.TurnEntity
import kotlinx.coroutines.flow.Flow
import java.util.UUID

/**
 * Session + turns repository.
 *
 * Mirrors the CRUD operations in app/src/db/sessions.ts.
 */
class SessionRepository(private val db: HughDatabase) {

    private val sessionDao = db.sessionDao()
    private val turnDao = db.turnDao()
    private val entityDao = db.entityDao()

    // ── Sessions ──────────────────────────────────────────

    suspend fun createSession(promptVersion: String): SessionEntity {
        val session = SessionEntity(
            id = UUID.randomUUID().toString(),
            startedAt = System.currentTimeMillis(),
            promptVersion = promptVersion,
        )
        sessionDao.insertSession(session)
        return session
    }

    suspend fun endSession(
        sessionId: String,
        title: String? = null,
        anchorPhrase: String? = null,
    ) {
        val session = sessionDao.getSession(sessionId) ?: return
        val endedAt = System.currentTimeMillis()
        val durationSec = ((endedAt - session.startedAt) / 1000).toInt()
        sessionDao.updateSession(
            session.copy(
                endedAt = endedAt,
                durationSec = durationSec,
                title = title,
                anchorPhrase = anchorPhrase,
            )
        )
    }

    fun observeSessions(): Flow<List<SessionEntity>> = sessionDao.observeSessions()

    suspend fun getSessions(): List<SessionEntity> = sessionDao.getSessions()

    suspend fun getSession(id: String): SessionEntity? = sessionDao.getSession(id)

    suspend fun getLastAnchor(): String? = sessionDao.getLastAnchor()

    suspend fun deleteSession(id: String) = sessionDao.deleteSession(id)

    // ── Turns ─────────────────────────────────────────────

    suspend fun appendTurn(
        sessionId: String,
        speaker: String,
        text: String,
        ordinal: Int,
    ) {
        turnDao.insertTurn(
            TurnEntity(
                sessionId = sessionId,
                ordinal = ordinal,
                speaker = speaker,
                text = text,
                startedAt = System.currentTimeMillis(),
            )
        )
    }

    suspend fun getTurns(sessionId: String): List<TurnEntity> =
        turnDao.getTurns(sessionId)

    fun observeTurns(sessionId: String): Flow<List<TurnEntity>> =
        turnDao.observeTurns(sessionId)

    suspend fun getLastTurns(sessionId: String, limit: Int = 10): List<TurnEntity> =
        turnDao.getLastTurns(sessionId, limit)

    // ── Entities ──────────────────────────────────────────

    suspend fun saveEntities(sessionId: String, entities: List<ExtractedEntityInfo>) {
        entityDao.insertEntities(
            entities.map { e ->
                EntityEntity(
                    sessionId = sessionId,
                    kind = e.kind,
                    value = e.value,
                )
            }
        )
    }
}

/** Simplified entity for insertion — no id needed. */
data class ExtractedEntityInfo(
    val kind: String,
    val value: String,
)
