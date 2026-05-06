package com.beyondpandora.hughmanatee.ui.onboarding

import androidx.compose.animation.Crossfade
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import com.beyondpandora.hughmanatee.data.local.HughDatabase
import com.beyondpandora.hughmanatee.data.preferences.HughPreferences
import com.beyondpandora.hughmanatee.ui.navigation.Route
import com.beyondpandora.hughmanatee.ui.theme.BgTop
import androidx.compose.foundation.background
import androidx.compose.ui.platform.LocalContext

/**
 * 4-step onboarding flow:
 *   1. Name
 *   2. Voice picker
 *   3. Birth year + hometown
 *   4. Privacy → "Meet Hugh"
 */
@Composable
fun OnboardingScreen(
    navController: NavHostController,
    db: HughDatabase,
    prefs: HughPreferences,
    modifier: Modifier = Modifier,
) {
    val vm: OnboardingViewModel = viewModel(
        factory = OnboardingViewModelFactory(db, prefs)
    )
    val state by vm.state.collectAsState()
    var step by remember { mutableIntStateOf(0) }

    androidx.compose.foundation.layout.Box(
        modifier = modifier
            .fillMaxSize()
            .background(BgTop)
    ) {
        Crossfade(targetState = step, label = "onboarding_step") { currentStep ->
            when (currentStep) {
                0 -> NameScreen(
                    firstName = state.firstName,
                    onNameChange = vm::setFirstName,
                    onContinue = { step = 1 },
                    error = state.error,
                )
                1 -> VoicePickerScreen(
                    voices = PLACEHOLDER_VOICES,
                    selectedVoice = state.selectedVoice,
                    onSelectVoice = vm::selectVoice,
                    onContinue = { step = 2 },
                )
                2 -> ContextScreen(
                    birthYear = state.birthYear,
                    hometown = state.hometown,
                    onBirthYearChange = vm::setBirthYear,
                    onHometownChange = vm::setHometown,
                    onContinue = { step = 3 },
                )
                3 -> PrivacyScreen(
                    isSubmitting = state.isSubmitting,
                    onMeetHugh = {
                        vm.completeOnboarding {
                            navController.navigate(Route.Conversation.path) {
                                popUpTo(Route.Onboarding.path) { inclusive = true }
                            }
                        }
                    },
                )
            }
        }
    }
}

import androidx.lifecycle.ViewModelProvider

class OnboardingViewModelFactory(
    private val db: HughDatabase,
    private val prefs: HughPreferences,
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : androidx.lifecycle.ViewModel> create(modelClass: Class<T>): T {
        return OnboardingViewModel(db, prefs) as T
    }
}
