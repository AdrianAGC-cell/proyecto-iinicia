package com.example.iinicia.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.iinicia.ui.theme.CardBackground
import com.example.iinicia.ui.theme.CardBorder
import com.example.iinicia.ui.theme.IvoryBackground
import com.example.iinicia.ui.theme.NavyPrimary
import com.example.iinicia.ui.theme.TextMuted
import com.example.iinicia.viewmodel.AuthViewModel
import com.example.iinicia.viewmodel.DashboardViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    dashboardViewModel: DashboardViewModel,
    authViewModel: AuthViewModel,
    onBackClick: () -> Unit,
    onLogoutSuccess: () -> Unit
) {
    val user by dashboardViewModel.user.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Perfil de Usuario & Seguridad", color = Color.White) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Regresar",
                            tint = Color.White
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = NavyPrimary)
            )
        },
        containerColor = IvoryBackground
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = CardBackground),
                border = BorderStroke(1.dp, CardBorder)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = "Información Académica",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = NavyPrimary
                    )

                    ProfileItem(label = "Nombre Completo", value = user.name)
                    ProfileItem(label = "Correo Institucional", value = user.email.ifBlank { "No registrado en Moodle" })
                    ProfileItem(label = "Programa Académico", value = user.programName ?: "Licenciatura en Inteligencia Artificial y Ciencia de Datos")
                    ProfileItem(label = "Rol Institucional", value = user.role)
                    ProfileItem(label = "Matrícula / ID Moodle", value = user.moodleId.ifBlank { user.id })
                    ProfileItem(label = "Estado de Seguridad", value = "Sesión Segura / Cookie iinicia.sid (OIDC)")
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Secure Logout Button
            Button(
                onClick = {
                    authViewModel.logout()
                    onLogoutSuccess()
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = null)
                Spacer(modifier = Modifier.padding(horizontal = 4.dp))
                Text("Cerrar Sesión Seguro (Revocar Tokens)", fontSize = 15.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun ProfileItem(label: String, value: String) {
    Column {
        Text(text = label, fontSize = 12.sp, color = TextMuted)
        Text(text = value, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = NavyPrimary)
    }
}
