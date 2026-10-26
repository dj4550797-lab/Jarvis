package com.jarvis.assistant

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            JarvisMobileApp()
        }
    }
}

@Composable
fun JarvisMobileApp() {
    val darkBackground = Color(0xFF070A13)
    val cardBackground = Color(0xFF0D1424)
    val cyberCyan = Color(0xFF00F0FF)
    val textPrimary = Color(0xFFF0F6FC)
    val textSecondary = Color(0xFF8B9BB4)

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = darkBackground
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // Header
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "JARVIS",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    color = textPrimary,
                    letterSpacing = 2.sp
                )
                Text(
                    text = "Mobile Companion • Local Offline Mode",
                    fontSize = 12.sp,
                    color = cyberCyan,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }

            // Core Status Card
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 16.dp),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = cardBackground)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "● STANDALONE ON-DEVICE CORE",
                        color = cyberCyan,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "Ready for voice and local task orchestration.",
                        color = textSecondary,
                        fontSize = 14.sp
                    )
                }
            }

            // Footer action
            Button(
                onClick = { /* Activate voice */ },
                colors = ButtonDefaults.buttonColors(containerColor = cyberCyan),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth().height(50.dp)
            ) {
                Text(text = "Start Voice Interaction", color = Color.Black, fontWeight = FontWeight.Bold)
            }
        }
    }
}
