package com.beyondpandora.hughmanatee.ui.navigation

/**
 * App routes — file-based equivalent of expo-router structure.
 *
 * Entry redirect logic: /onboarding if no profile, else /conversation.
 */
sealed class Route(val path: String) {
    data object Onboarding : Route("onboarding")
    data object Conversation : Route("conversation")
    data object Library : Route("library")
    data class Session(val id: String = "{id}") : Route("session/{id}") {
        companion object {
            const val ARG_ID = "id"
            fun create(id: String) = "session/$id"
        }
    }
    data object Settings : Route("settings")
}
