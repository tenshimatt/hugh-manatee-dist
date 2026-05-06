package com.beyondpandora.hughmanatee.data.repository

import com.beyondpandora.hughmanatee.data.local.HughDatabase
import com.beyondpandora.hughmanatee.data.local.entities.ProfileEntity
import kotlinx.coroutines.flow.Flow

/**
 * Single-row profile repository.
 *
 * Mirrors the CRUD operations in app/src/db/profile.ts.
 * Voice and agent IDs are stored in both Room and DataStore
 * for fast cold-start (matching expo-secure-store pattern).
 */
class ProfileRepository(private val db: HughDatabase) {

    private val dao = db.profileDao()

    suspend fun get(): ProfileEntity? = dao.getProfile()

    fun observe(): Flow<ProfileEntity?> = dao.observeProfile()

    suspend fun hasProfile(): Boolean = dao.getProfile() != null

    suspend fun upsert(profile: ProfileEntity) {
        dao.upsertProfile(profile)
    }

    suspend fun update(profile: ProfileEntity) {
        dao.updateProfile(profile)
    }

    suspend fun delete() {
        dao.deleteProfile()
    }

    companion object {
        fun nowSeconds(): Long = System.currentTimeMillis() / 1000
    }
}
