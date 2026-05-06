package com.beyondpandora.hughmanatee.data.local.entities

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * A conversation session — one complete call with Hugh.
 * Matches the Expo SQLite schema at src/db/schema.ts.
 */
@Entity(
    tableName = "sessions",
)
data class SessionEntity(
    @PrimaryKey
    val id: String, // UUID

    @ColumnInfo(name = "started_at")
    val startedAt: Long,

    @ColumnInfo(name = "ended_at")
    val endedAt: Long? = null,

    @ColumnInfo(name = "duration_sec")
    val durationSec: Int? = null,

    val title: String? = null,

    @ColumnInfo(name = "anchor_phrase")
    val anchorPhrase: String? = null,

    @ColumnInfo(name = "audio_path")
    val audioPath: String? = null,

    @ColumnInfo(name = "prompt_version")
    val promptVersion: String,
)
