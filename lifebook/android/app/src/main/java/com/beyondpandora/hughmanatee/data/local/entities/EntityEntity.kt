package com.beyondpandora.hughmanatee.data.local.entities

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * Extracted entity (person, place, etc.) from a session.
 * Matches the Expo SQLite schema at src/db/schema.ts.
 */
@Entity(
    tableName = "entities",
    foreignKeys = [
        ForeignKey(
            entity = SessionEntity::class,
            parentColumns = ["id"],
            childColumns = ["session_id"],
            onDelete = ForeignKey.CASCADE,
        ),
    ],
    indices = [Index(value = ["session_id"])],
)
data class EntityEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,

    @ColumnInfo(name = "session_id")
    val sessionId: String,

    val kind: String, // "person" | "place" | "object" | "date" | "event"

    val value: String,

    @ColumnInfo(name = "first_mentioned_turn")
    val firstMentionedTurn: Long? = null,
)
