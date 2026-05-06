package com.beyondpandora.hughmanatee.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.beyondpandora.hughmanatee.data.local.entities.EntityEntity

@Dao
interface EntityDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEntities(entities: List<EntityEntity>)

    @Query("SELECT * FROM entities WHERE session_id = :sessionId")
    suspend fun getEntities(sessionId: String): List<EntityEntity>

    @Query("DELETE FROM entities WHERE session_id = :sessionId")
    suspend fun deleteEntities(sessionId: String)

    @Query("DELETE FROM entities")
    suspend fun deleteAllEntities()
}
