package com.beyondpandora.hughmanatee.ui.session

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.beyondpandora.hughmanatee.data.local.HughDatabase
import com.beyondpandora.hughmanatee.data.local.entities.TurnEntity
import com.beyondpandora.hughmanatee.ui.theme.Accent
import com.beyondpandora.hughmanatee.ui.theme.AccentSoft
import com.beyondpandora.hughmanatee.ui.theme.BgTop
import com.beyondpandora.hughmanatee.ui.theme.Ink
import com.beyondpandora.hughmanatee.ui.theme.InkSoft
import com.beyondpandora.hughmanatee.ui.theme.Md
import com.beyondpandora.hughmanatee.ui.theme.Sm
import com.beyondpandora.hughmanatee.ui.theme.SurfaceAlt
import com.beyondpandora.hughmanatee.ui.theme.Xl
import com.beyondpandora.hughmanatee.ui.theme.Xxl

@Composable
fun SessionDetailScreen(
    sessionId: String,
    db: HughDatabase,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
    vm: SessionDetailViewModel = viewModel(
        factory = SessionDetailViewModelFactory(db, sessionId)
    ),
) {
    val state by vm.state.collectAsState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(BgTop),
    ) {
        // Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = Md, vertical = Sm),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = "← Back",
                style = MaterialTheme.typography.labelLarge,
                color = Accent,
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .clickable { onBack() }
                    .padding(8.dp),
            )
            Spacer(modifier = Modifier.weight(1f))
            if (state.session != null) {
                Text(
                    text = state.session.title ?: "Memory",
                    style = MaterialTheme.typography.titleMedium,
                    color = Ink,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.weight(2f),
                )
            }
            Spacer(modifier = Modifier.weight(1f))
        }

        if (state.isLoading) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center,
            ) {
                CircularProgressIndicator(color = Accent)
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = Xl),
                verticalArrangement = Arrangement.spacedBy(Md),
            ) {
                item { Spacer(modifier = Modifier.height(Md)) }

                items(state.turns, key = { it.id }) { turn ->
                    TurnBubble(turn = turn)
                }

                item { Spacer(modifier = Modifier.height(80.dp)) }
            }
        }
    }
}

@Composable
private fun TurnBubble(turn: TurnEntity) {
    val isHugh = turn.speaker == "hugh"

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (isHugh) Arrangement.Start else Arrangement.End,
    ) {
        Box(
            modifier = Modifier
                .widthIn(max = 300.dp)
                .clip(
                    RoundedCornerShape(
                        topStart = 16.dp,
                        topEnd = 16.dp,
                        bottomStart = if (isHugh) 4.dp else 16.dp,
                        bottomEnd = if (isHugh) 16.dp else 4.dp,
                    )
                )
                .background(if (isHugh) SurfaceAlt else Accent.copy(alpha = 0.12f))
                .padding(horizontal = Md, vertical = Sm),
        ) {
            Column {
                Text(
                    text = if (isHugh) "Hugh" else "You",
                    style = MaterialTheme.typography.labelMedium,
                    color = if (isHugh) InkSoft else Accent,
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = turn.text,
                    style = MaterialTheme.typography.bodyMedium,
                    color = Ink,
                )
            }
        }
    }
}

import androidx.lifecycle.ViewModelProvider

class SessionDetailViewModelFactory(
    private val db: HughDatabase,
    private val sessionId: String,
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : androidx.lifecycle.ViewModel> create(modelClass: Class<T>): T {
        return SessionDetailViewModel(db, sessionId) as T
    }
}
