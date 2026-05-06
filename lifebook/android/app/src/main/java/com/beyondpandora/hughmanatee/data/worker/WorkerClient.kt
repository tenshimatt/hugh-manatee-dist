package com.beyondpandora.hughmanatee.data.worker

import com.beyondpandora.hughmanatee.BuildConfig
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import java.util.concurrent.TimeUnit

/**
 * Singleton Worker API client.
 *
 * Three thin wrappers matching the TypeScript helper functions
 * in app/src/services/worker.ts:
 *   fetchAgentConfig()      → worker.getAgentConfig()
 *   fetchCollageImages()    → worker.getCollageImages()
 *   fetchSessionAnchor()    → worker.getSessionAnchor()
 */
object WorkerClient {

    private val json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
    }

    private val okHttp = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .addInterceptor(
            HttpLoggingInterceptor().apply {
                level = if (BuildConfig.DEBUG) {
                    HttpLoggingInterceptor.Level.BODY
                } else {
                    HttpLoggingInterceptor.Level.NONE
                }
            }
        )
        .build()

    private val retrofit = Retrofit.Builder()
        .baseUrl(BuildConfig.WORKER_URL.ensureTrailingSlash())
        .client(okHttp)
        .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
        .build()

    val api: WorkerApi = retrofit.create(WorkerApi::class.java)
}

private fun String.ensureTrailingSlash(): String =
    if (endsWith("/")) this else "$this/"
