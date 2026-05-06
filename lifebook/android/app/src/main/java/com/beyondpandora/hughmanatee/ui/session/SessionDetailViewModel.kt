package com.beyondpandora.hughmanatee.ui.session

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.beyondpandora.hughmanatee.data.local.HughDatabase
import com.beyondpandora.hughmanatee.data.local.entities.SessionEntity
import com.beyondpandora.hughmanatee.data.local.entities.TurnEntity
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class SessionDetailUiState(
    val session: SessionEntity? = null,
    val turns: List<TurnEntity> = emptyList(),
    val isLoading: Boolean = true,
)

class SessionDetailViewModel(
    private val db: HughDatabase,
    private val sessionId: String,
) : ViewModel() {

    private val sessionRepo = com.beyondpandora.hughmanatee.data.repository.SessionRepository(db)

    private val _state = MutableStateFlow(SessionDetailUiState())
    val state: StateFlow<SessionDetailUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            val session = sessionRepo.getSession(sessionId)
            val turns = sessionRepo.getTurns(sessionId)
            _state.value = SessionDetailUiState(
                session = session,
                turns = turns,
                isLoading = false,
            )
        }
    }
}
