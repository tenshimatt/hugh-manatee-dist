package com.beyondpandora.hughmanatee

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.beyondpandora.hughmanatee.ui.navigation.HughNavHost
import com.beyondpandora.hughmanatee.ui.theme.HughTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            HughTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    HughNavHost()
                }
            }
        }
    }
}
