package com.beyondpandora.hughmanatee.ui.library

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.beyondpandora.hughmanatee.data.local.HughDatabase
import com.beyondpandora.hughmanatee.data.local.entities.SessionEntity
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class LibraryUiState(
    val sessions: List<SessionEntity> = emptyList(),
    val isLoading: Boolean = true,
)

class LibraryViewModel(db: HughDatabase) : ViewModel() {

    private val sessionRepo = com.beyondpandora.hughmanatee.data.repository.SessionRepository(db)

    private val _state = MutableStateFlow(LibraryUiState())
    val state: StateFlow<LibraryUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            sessionRepo.observeSessions().collect { sessions ->
                _state.value = LibraryUiState(
                    sessions = sessions,
                    isLoading = false,
                )
            }
        }
    }
}
