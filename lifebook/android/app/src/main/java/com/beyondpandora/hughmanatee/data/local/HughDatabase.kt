package com.beyondpandora.hughmanatee.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import com.beyondpandora.hughmanatee.data.local.dao.EntityDao
import com.beyondpandora.hughmanatee.data.local.dao.ProfileDao
import com.beyondpandora.hughmanatee.data.local.dao.SessionDao
import com.beyondpandora.hughmanatee.data.local.dao.TurnDao
import com.beyondpandora.hughmanatee.data.local.entities.EntityEntity
import com.beyondpandora.hughmanatee.data.local.entities.ProfileEntity
import com.beyondpandora.hughmanatee.data.local.entities.SessionEntity
import com.beyondpandora.hughmanatee.data.local.entities.TurnEntity

/**
 * Hugh Manatee local database.
 *
 * Schema matches the Expo SQLite schema in app/src/db/schema.ts 1:1.
 * FTS5 virtual table on turns.text with insert/update/delete triggers.
 */
@Database(
    entities = [
        ProfileEntity::class,
        SessionEntity::class,
        TurnEntity::class,
        EntityEntity::class,
    ],
    version = 1,
    exportSchema = false,
)
abstract class HughDatabase : RoomDatabase() {

    abstract fun profileDao(): ProfileDao
    abstract fun sessionDao(): SessionDao
    abstract fun turnDao(): TurnDao
    abstract fun entityDao(): EntityDao

    companion object {
        private const val DB_NAME = "hughmanatee.db"

        @Volatile
        private var INSTANCE: HughDatabase? = null

        fun getInstance(context: Context): HughDatabase {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: build(context).also { INSTANCE = it }
            }
        }

        private fun build(context: Context): HughDatabase {
            return Room.databaseBuilder(
                context.applicationContext,
                HughDatabase::class.java,
                DB_NAME,
            )
                .addCallback(object : Callback() {
                    override fun onCreate(db: SupportSQLiteDatabase) {
                        super.onCreate(db)
                        // Enable WAL mode for concurrent reads
                        db.execSQL("PRAGMA journal_mode = WAL")
                        db.execSQL("PRAGMA foreign_keys = ON")
                        createFts5Triggers(db)
                    }

                    override fun onOpen(db: SupportSQLiteDatabase) {
                        super.onOpen(db)
                        db.execSQL("PRAGMA foreign_keys = ON")
                    }
                })
                .build()
        }

        /**
         * Create FTS5 virtual table and keep-it-in-sync triggers
         * matching the Expo schema exactly.
         */
        private fun createFts5Triggers(db: SupportSQLiteDatabase) {
            db.execSQL("""
                CREATE VIRTUAL TABLE IF NOT EXISTS turns_fts USING fts5(
                    text, content='turns', content_rowid='id'
                )
            """.trimIndent())

            db.execSQL("""
                CREATE TRIGGER IF NOT EXISTS turns_ai AFTER INSERT ON turns BEGIN
                    INSERT INTO turns_fts(rowid, text) VALUES (new.id, new.text);
                END
            """.trimIndent())

            db.execSQL("""
                CREATE TRIGGER IF NOT EXISTS turns_ad AFTER DELETE ON turns BEGIN
                    INSERT INTO turns_fts(turns_fts, rowid, text) VALUES('delete', old.id, old.text);
                END
            """.trimIndent())

            db.execSQL("""
                CREATE TRIGGER IF NOT EXISTS turns_au AFTER UPDATE ON turns BEGIN
                    INSERT INTO turns_fts(turns_fts, rowid, text) VALUES('delete', old.id, old.text);
                    INSERT INTO turns_fts(rowid, text) VALUES (new.id, new.text);
                END
            """.trimIndent())
        }
    }

    /**
     * Danger: wipes all app data.
     * Equivalent to nukeDb() in app/src/db/schema.ts.
     */
    suspend fun nukeDb() {
        entityDao().deleteAllEntities()
        turnDao().deleteAllTurns()
        sessionDao().deleteAllSessions()
        profileDao().deleteProfile()
        // FTS5 triggers handle turns_fts cleanup automatically
    }
}
