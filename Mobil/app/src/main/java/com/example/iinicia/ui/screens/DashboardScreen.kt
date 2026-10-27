package com.example.iinicia.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.iinicia.ui.components.InstitutionalHeader
import com.example.iinicia.ui.components.RoleSimulationBar
import com.example.iinicia.ui.theme.CardBackgroundDark
import com.example.iinicia.ui.theme.CardBorderDark
import com.example.iinicia.ui.theme.CyanAccent
import com.example.iinicia.ui.theme.CyanBright
import com.example.iinicia.ui.theme.DarkBackground
import com.example.iinicia.ui.theme.TextMuted
import com.example.iinicia.ui.theme.TextWhite
import com.example.iinicia.viewmodel.AuthViewModel
import com.example.iinicia.viewmodel.DashboardViewModel

@Composable
fun DashboardScreen(
    dashboardViewModel: DashboardViewModel,
    authViewModel: AuthViewModel,
    onCourseClick: (String) -> Unit,
    onProfileClick: () -> Unit,
    onNotificationsClick: () -> Unit,
    onMoodleSsoClick: () -> Unit
) {
    val user by dashboardViewModel.user.collectAsState()
    val courses by dashboardViewModel.courses.collectAsState()
    val notifications by dashboardViewModel.notifications.collectAsState()

    var searchQuery by remember { mutableStateOf("") }
    var currentRole by remember { mutableStateOf(user.role) }

    Scaffold(
        topBar = {
            Column {
                InstitutionalHeader(
                    userName = user.name,
                    onProfileClick = onProfileClick,
                    onMoodleSsoClick = onMoodleSsoClick
                )
                RoleSimulationBar(
                    currentRole = user.role,
                    onRoleSelected = { role ->
                        currentRole = role
                        dashboardViewModel.switchRole(role)
                    }
                )
            }
        },
        bottomBar = {
            NavigationBar(containerColor = CardBackgroundDark) {
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Home, contentDescription = "Inicio") },
                    label = { Text("Inicio") },
                    selected = true,
                    onClick = {}
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Notifications, contentDescription = "Avisos") },
                    label = { Text("Avisos (${notifications.size})") },
                    selected = false,
                    onClick = onNotificationsClick
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Person, contentDescription = "Perfil") },
                    label = { Text("Mi IINICIA") },
                    selected = false,
                    onClick = onProfileClick
                )
            }
        },
        containerColor = DarkBackground
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // 1. Hero Section
            item {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Status Pill
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(20.dp))
                            .background(CyanAccent.copy(alpha = 0.15f))
                            .border(1.dp, CyanAccent.copy(alpha = 0.5f), RoundedCornerShape(20.dp))
                            .padding(horizontal = 16.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = "✨ Plataforma Digital Universitaria • React + Moodle LMS",
                            color = CyanAccent,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Title
                    Text(
                        text = "Lidera el futuro en Inteligencia Artificial y Ciencias Aplicadas",
                        color = TextWhite,
                        fontSize = 26.sp,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center,
                        lineHeight = 32.sp
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // Subtitle
                    Text(
                        text = "Bienvenido a I²NICIA (Instituto de Innovación y Ciencias Aplicadas). Programas académicos con RVOE SEP Federal, campus virtual 24/7 y Single Sign-On unificado.",
                        color = TextMuted,
                        fontSize = 13.sp,
                        textAlign = TextAlign.Center,
                        lineHeight = 18.sp
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    // Interactive Search Bar
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(28.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                        border = BorderStroke(1.dp, CardBorderDark)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.Search,
                                contentDescription = null,
                                tint = TextMuted
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(
                                text = if (searchQuery.isEmpty()) "¿Qué deseas estudiar? (Inteligencia Artificial, Software...)" else searchQuery,
                                color = if (searchQuery.isEmpty()) TextMuted else TextWhite,
                                fontSize = 13.sp,
                                modifier = Modifier.weight(1f)
                            )
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(20.dp))
                                    .background(CyanBright)
                                    .padding(horizontal = 16.dp, vertical = 8.dp)
                            ) {
                                Text("Buscar", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    // CTAs Row
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Button(
                            onClick = onMoodleSsoClick,
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = CyanBright),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("Explorar Carreras →", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            OutlinedButton(
                                onClick = onProfileClick,
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(12.dp),
                                border = BorderStroke(1.dp, CardBorderDark)
                            ) {
                                Text("Iniciar Admisión 2026", fontSize = 12.sp, color = TextWhite)
                            }

                            OutlinedButton(
                                onClick = onMoodleSsoClick,
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(12.dp),
                                border = BorderStroke(1.dp, CyanAccent)
                            ) {
                                Text("Mi Campus LMS ↗", fontSize = 12.sp, color = CyanAccent)
                            }
                        }
                    }
                }
            }

            // 2. User & Academic Panel (Mi IINICIA / Moodle SSO Card)
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = CardBackgroundDark),
                    border = BorderStroke(1.dp, CardBorderDark)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp)
                    ) {
                        Text(
                            text = "Panel Académico • $currentRole",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = CyanAccent
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "${user.name} (${user.email})",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = TextWhite
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "Moodle ID (SSO): ${user.moodleId}",
                            fontSize = 12.sp,
                            color = TextMuted
                        )
                        Spacer(modifier = Modifier.height(16.dp))

                        Button(
                            onClick = onMoodleSsoClick,
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1F2937)),
                            shape = RoundedCornerShape(10.dp),
                            border = BorderStroke(1.dp, CyanAccent)
                        ) {
                            Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, modifier = Modifier.size(18.dp), tint = CyanAccent)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Abrir Campus Virtual Moodle (SSO)", fontWeight = FontWeight.Bold, color = CyanAccent)
                        }
                    }
                }
            }

            // 3. Section Header: Active Courses
            item {
                Text(
                    text = "Cursos Activos y Autorizados",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextWhite
                )
            }

            // 4. Courses List
            items(courses) { course ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onCourseClick(course.id) },
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = CardBackgroundDark),
                    border = BorderStroke(1.dp, CardBorderDark)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp)
                    ) {
                        Text(
                            text = course.title,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextWhite
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = course.instructor,
                            fontSize = 12.sp,
                            color = TextMuted
                        )
                        Spacer(modifier = Modifier.height(12.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            LinearProgressIndicator(
                                progress = { course.progress },
                                modifier = Modifier
                                    .weight(1f)
                                    .height(8.dp)
                                    .clip(RoundedCornerShape(4.dp)),
                                color = CyanAccent,
                                trackColor = Color(0xFF1F2937)
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(
                                text = "${(course.progress * 100).toInt()}%",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = CyanAccent
                            )
                        }
                    }
                }
            }
        }
    }
}
