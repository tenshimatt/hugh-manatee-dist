package com.beyondpandora.hughmanatee.data.local.entities

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Single-row profile — CHECK id=1 enforced at app level.
 * Matches the Expo SQLite schema at src/db/schema.ts.
 */
@Entity(tableName = "profile")
data class ProfileEntity(
    @PrimaryKey
    val id: Int = 1,

    @ColumnInfo(name = "first_name")
    val firstName: String,

    @ColumnInfo(name = "birth_year")
    val birthYear: Int? = null,

    val hometown: String? = null,

    @ColumnInfo(name = "voice_id")
    val voiceId: String,

    @ColumnInfo(name = "agent_id")
    val agentId: String,

    @ColumnInfo(name = "created_at")
    val createdAt: Long,

    @ColumnInfo(name = "updated_at")
    val updatedAt: Long,
)
