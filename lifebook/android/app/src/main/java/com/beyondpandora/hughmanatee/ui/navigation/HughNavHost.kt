package com.beyondpandora.hughmanatee.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.beyondpandora.hughmanatee.data.local.HughDatabase
import com.beyondpandora.hughmanatee.data.preferences.HughPreferences
import com.beyondpandora.hughmanatee.ui.conversation.ConversationScreen
import com.beyondpandora.hughmanatee.ui.library.LibraryScreen
import com.beyondpandora.hughmanatee.ui.onboarding.OnboardingScreen
import com.beyondpandora.hughmanatee.ui.session.SessionDetailScreen
import com.beyondpandora.hughmanatee.ui.settings.SettingsScreen

@Composable
fun HughNavHost(
    navController: NavHostController = rememberNavController(),
    db: HughDatabase = HughDatabase.getInstance(LocalContext.current),
    prefs: HughPreferences = HughPreferences(LocalContext.current),
) {
    val hasProfile by prefs.hasProfile.collectAsState(initial = null)
    val startDestination = when (hasProfile) {
        true -> Route.Conversation.path
        else -> Route.Onboarding.path
    }

    NavHost(
        navController = navController,
        startDestination = startDestination,
    ) {
        composable(Route.Onboarding.path) {
            OnboardingScreen(navController = navController, db = db, prefs = prefs)
        }
        composable(Route.Conversation.path) {
            ConversationScreen(navController = navController)
        }
        composable(Route.Library.path) {
            LibraryScreen(navController = navController, db = db)
        }
        composable(
            route = Route.Session.path,
            arguments = listOf(navArgument(Route.Session.ARG_ID) { type = NavType.StringType }),
        ) { backStackEntry ->
            val sessionId = backStackEntry.arguments?.getString(Route.Session.ARG_ID) ?: ""
            SessionDetailScreen(sessionId = sessionId, db = db, onBack = { navController.popBackStack() })
        }
        composable(Route.Settings.path) {
            SettingsScreen(navController = navController, db = db, prefs = prefs)
        }
    }
}
