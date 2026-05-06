package com.beyondpandora.hughmanatee.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.RawQuery
import androidx.sqlite.db.SupportSQLiteQuery
import com.beyondpandora.hughmanatee.data.local.entities.TurnEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface TurnDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTurn(turn: TurnEntity): Long

    @Query("SELECT * FROM turns WHERE session_id = :sessionId ORDER BY ordinal ASC")
    suspend fun getTurns(sessionId: String): List<TurnEntity>

    @Query("SELECT * FROM turns WHERE session_id = :sessionId ORDER BY ordinal ASC")
    fun observeTurns(sessionId: String): Flow<List<TurnEntity>>

    @Query("SELECT * FROM turns WHERE session_id = :sessionId ORDER BY ordinal DESC LIMIT :limit")
    suspend fun getLastTurns(sessionId: String, limit: Int = 10): List<TurnEntity>

    @Query("DELETE FROM turns WHERE session_id = :sessionId")
    suspend fun deleteTurns(sessionId: String)

    @Query("DELETE FROM turns")
    suspend fun deleteAllTurns()

    // FTS5 search — raw query to hit the virtual table
    @RawQuery
    suspend fun searchTurns(query: SupportSQLiteQuery): List<TurnEntity>
}
