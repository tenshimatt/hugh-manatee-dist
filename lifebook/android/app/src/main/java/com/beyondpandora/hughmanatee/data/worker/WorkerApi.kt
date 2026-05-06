package com.beyondpandora.hughmanatee.data.worker

import retrofit2.http.Body
import retrofit2.http.POST

/**
 * Retrofit service for the Hugh Manatee Cloudflare Worker.
 *
 * Three endpoints matching the TypeScript worker.ts client 1:1.
 * Base URL injected at construction — defaults to the deployed
 * Worker but can be swapped for local dev.
 */
interface WorkerApi {

    @POST("/agent/config")
    suspend fun getAgentConfig(
        @Body request: AgentConfigRequest,
    ): AgentConfigResponse

    @POST("/collage/images")
    suspend fun getCollageImages(
        @Body request: CollageRequest,
    ): CollageResponse

    @POST("/session/anchor")
    suspend fun getSessionAnchor(
        @Body request: AnchorRequest,
    ): AnchorResponse
}
