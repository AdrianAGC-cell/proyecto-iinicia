package com.example.iinicia.ui.screens

import android.util.Patterns
import androidx.compose.foundation.Image
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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.iinicia.R
import com.example.iinicia.ui.theme.CardBackgroundDark
import com.example.iinicia.ui.theme.CyanAccent
import com.example.iinicia.ui.theme.CyanBright
import com.example.iinicia.ui.theme.DarkBackground
import com.example.iinicia.ui.theme.TextMuted
import com.example.iinicia.viewmodel.AuthState
import com.example.iinicia.viewmodel.AuthViewModel

@Composable
fun LoginScreen(
    authViewModel: AuthViewModel,
    onLoginSuccess: () -> Unit
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val authState by authViewModel.authState.collectAsState()

    if (authState is AuthState.Success) {
        onLoginSuccess()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBackground)
            .padding(20.dp),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = CardBackgroundDark),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Institutional Logo
                Image(
                    painter = painterResource(id = R.drawable.logo_iinicia_white),
                    contentDescription = "Logo IINICIA",
                    modifier = Modifier.size(52.dp)
                )

                Spacer(modifier = Modifier.height(8.dp))

                // Header Logo Title
                Text(
                    text = "IINICIA",
                    fontSize = 26.sp,
                    fontWeight = FontWeight.Bold,
                    color = CyanAccent
                )
                Text(
                    text = "Instituto de Innovación y Ciencias Aplicadas",
                    fontSize = 11.sp,
                    color = TextMuted,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(18.dp))

                OutlinedTextField(
                    value = email,
                    onValueChange = { 
                        email = it
                        errorMessage = null
                    },
                    label = { Text("Correo (ej. valeria.morales@iinicia.edu.mx)", color = TextMuted) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = password,
                    onValueChange = { 
                        password = it
                        errorMessage = null
                    },
                    label = { Text("Contraseña", color = TextMuted) },
                    visualTransformation = PasswordVisualTransformation(),
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                if (errorMessage != null || authState is AuthState.Error) {
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = errorMessage ?: (authState as? AuthState.Error)?.message ?: "",
                        color = MaterialTheme.colorScheme.error,
                        fontSize = 12.sp,
                        textAlign = TextAlign.Center
                    )
                }

                Spacer(modifier = Modifier.height(18.dp))

                // Login Button
                Button(
                    onClick = {
                        if (email.isBlank() || !Patterns.EMAIL_ADDRESS.matcher(email.trim()).matches()) {
                            errorMessage = "Ingrese un correo válido (ej. valeria.morales@iinicia.edu.mx o su Gmail)."
                            return@Button
                        }
                        if (password.length < 4) {
                            errorMessage = "La contraseña debe tener al menos 4 caracteres."
                            return@Button
                        }
                        authViewModel.login(email.trim(), password)
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = CyanBright),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = if (authState is AuthState.Loading) "Autenticando..." else "Iniciar Sesión en Supabase",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Quick Demo Logins for Evaluator (Matches Web)
                Text(
                    text = "ACCESO RÁPIDO DE EVALUACIÓN",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF6B7280),
                    letterSpacing = 1.sp
                )

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    QuickLoginChip(
                        role = "Estudiante",
                        name = "Valeria Morales",
                        modifier = Modifier.weight(1f)
                    ) {
                        email = "valeria.morales@iinicia.edu.mx"
                        password = "password123"
                        authViewModel.login(email, password)
                    }
                    QuickLoginChip(
                        role = "Coordinador",
                        name = "Dra. Alarcón",
                        modifier = Modifier.weight(1f)
                    ) {
                        email = "sofia.alarcon@iinicia.edu.mx"
                        password = "password123"
                        authViewModel.login(email, password)
                    }
                }

                Spacer(modifier = Modifier.height(6.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    QuickLoginChip(
                        role = "Aspirante",
                        name = "Diego Solís",
                        modifier = Modifier.weight(1f)
                    ) {
                        email = "diego.solis@gmail.com"
                        password = "password123"
                        authViewModel.login(email, password)
                    }
                    QuickLoginChip(
                        role = "Admin TI",
                        name = "Ing. Roberto Peña",
                        modifier = Modifier.weight(1f)
                    ) {
                        email = "admin.sistemas@iinicia.edu.mx"
                        password = "password123"
                        authViewModel.login(email, password)
                    }
                }
            }
        }
    }
}

@Composable
fun QuickLoginChip(
    role: String,
    name: String,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .background(Color(0xFF1E293B), RoundedCornerShape(10.dp))
            .clickable { onClick() }
            .padding(vertical = 8.dp, horizontal = 10.dp)
    ) {
        Column {
            Text(text = role, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = CyanAccent)
            Text(text = name, fontSize = 9.sp, color = Color(0xFF94A3B8), maxLines = 1)
        }
    }
}
