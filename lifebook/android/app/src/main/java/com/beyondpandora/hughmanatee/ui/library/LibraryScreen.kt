package com.beyondpandora.hughmanatee.ui.library

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
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
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import com.beyondpandora.hughmanatee.data.local.HughDatabase
import com.beyondpandora.hughmanatee.data.local.entities.SessionEntity
import com.beyondpandora.hughmanatee.ui.navigation.Route
import com.beyondpandora.hughmanatee.ui.theme.Accent
import com.beyondpandora.hughmanatee.ui.theme.BgTop
import com.beyondpandora.hughmanatee.ui.theme.Ink
import com.beyondpandora.hughmanatee.ui.theme.InkSoft
import com.beyondpandora.hughmanatee.ui.theme.Lg
import com.beyondpandora.hughmanatee.ui.theme.Md
import com.beyondpandora.hughmanatee.ui.theme.Xl
import com.beyondpandora.hughmanatee.ui.theme.Xxl
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun LibraryScreen(
    navController: NavHostController,
    db: HughDatabase,
    modifier: Modifier = Modifier,
    vm: LibraryViewModel = viewModel(
        factory = LibraryViewModelFactory(db)
    ),
) {
    val state by vm.state.collectAsState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(BgTop)
            .padding(horizontal = Xl),
    ) {
        Spacer(modifier = Modifier.height(Xxl))

        Text(
            text = "Memories",
            style = MaterialTheme.typography.headlineLarge,
            color = Ink,
        )

        Spacer(modifier = Modifier.height(Md))

        if (state.isLoading) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center,
            ) {
                CircularProgressIndicator(color = Accent)
            }
        } else if (state.sessions.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = "No memories yet.\nStart a conversation with Hugh.",
                    style = MaterialTheme.typography.bodyLarge,
                    color = InkSoft,
                    textAlign = TextAlign.Center,
                )
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(Md),
            ) {
                items(state.sessions, key = { it.id }) { session ->
                    SessionCard(
                        session = session,
                        onClick = {
                            navController.navigate(Route.Session.create(session.id))
                        },
                    )
                }
                // Bottom spacer for nav bar
                item { Spacer(modifier = Modifier.height(80.dp)) }
            }
        }
    }
}

@Composable
private fun SessionCard(
    session: SessionEntity,
    onClick: () -> Unit,
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = androidx.compose.ui.graphics.Color.White),
        shape = MaterialTheme.shapes.medium,
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(Md),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = session.title ?: "Untitled",
                    style = MaterialTheme.typography.titleMedium,
                    color = Ink,
                )
                if (session.anchorPhrase != null) {
                    Text(
                        text = session.anchorPhrase,
                        style = MaterialTheme.typography.bodySmall,
                        color = InkSoft,
                        maxLines = 1,
                    )
                }
                Text(
                    text = formatDate(session.startedAt),
                    style = MaterialTheme.typography.labelMedium,
                    color = InkSoft,
                )
            }
            if (session.durationSec != null) {
                Text(
                    text = formatDuration(session.durationSec),
                    style = MaterialTheme.typography.labelMedium,
                    color = InkSoft,
                )
            }
        }
    }
}

private val dateFormat = SimpleDateFormat("d MMM yyyy", Locale.getDefault())

private fun formatDate(epochMs: Long): String = dateFormat.format(Date(epochMs))

private fun formatDuration(seconds: Int): String {
    val min = seconds / 60
    return if (min < 1) "${seconds}s" else "${min} min"
}

import androidx.lifecycle.ViewModelProvider

class LibraryViewModelFactory(
    private val db: HughDatabase,
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : androidx.lifecycle.ViewModel> create(modelClass: Class<T>): T {
        return LibraryViewModel(db) as T
    }
}
