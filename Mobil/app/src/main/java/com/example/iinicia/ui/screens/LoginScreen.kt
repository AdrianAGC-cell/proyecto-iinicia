package com.example.iinicia.ui.screens

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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.autofill.AutofillNode
import androidx.compose.ui.autofill.AutofillType
import androidx.compose.ui.platform.LocalAutofill
import androidx.compose.ui.platform.LocalAutofillTree
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.boundsInWindow
import androidx.compose.ui.platform.LocalContext
import androidx.compose.runtime.DisposableEffect
import android.view.autofill.AutofillManager
import android.os.Build
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.text.input.KeyboardType
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

@OptIn(ExperimentalComposeUiApi::class)
@Composable
fun LoginScreen(
    authViewModel: AuthViewModel,
    onLoginSuccess: () -> Unit
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var showRegisterDialog by remember { mutableStateOf(false) }

    var regName by remember { mutableStateOf("") }
    var regEmail by remember { mutableStateOf("") }
    var regPassword by remember { mutableStateOf("") }

    val context = LocalContext.current
    val autofill = LocalAutofill.current
    val autofillTree = LocalAutofillTree.current

    val usuarioNode = remember {
        AutofillNode(
            autofillTypes = listOf(AutofillType.Username),
            onFill = { email = it }
        )
    }

    val passwordNode = remember {
        AutofillNode(
            autofillTypes = listOf(AutofillType.Password),
            onFill = { password = it }
        )
    }

    DisposableEffect(autofillTree) {
        autofillTree += usuarioNode
        autofillTree += passwordNode

        onDispose {
            autofillTree.children.remove(usuarioNode.id)
            autofillTree.children.remove(passwordNode.id)
        }
    }
    val authState by authViewModel.authState.collectAsState()

    val retornoGoogle by
        com.example.iinicia.data.GoogleOAuth.retorno.collectAsState()

    LaunchedEffect(retornoGoogle) {
        retornoGoogle?.let {
            authViewModel.completarGoogle(it)
        }
    }


    val mensajeCuenta by authViewModel.mensajeCuenta.collectAsState()

    var mostrarRecuperacion by remember {
        mutableStateOf(false)
    }

    var correoRecuperacion by remember {
        mutableStateOf("")
    }


    LaunchedEffect(authState) {
        if (authState is AuthState.Success) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.getSystemService(AutofillManager::class.java)?.commit()
            }
            password = ""
            onLoginSuccess()
        }
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

                Spacer(modifier = Modifier.height(16.dp))

                // Google Sign In Button
                Button(
                    onClick = { authViewModel.loginWithGoogle() },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(46.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color.White,
                        contentColor = Color(0xFF1E293B)
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Text(
                            text = "G",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Black,
                            color = Color(0xFF4285F4)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Continuar con Google",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF1E293B)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Separator
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    HorizontalDivider(modifier = Modifier.weight(1f), color = Color(0xFF334155))
                    Text(
                        text = "  o con usuario institucional  ",
                        fontSize = 10.sp,
                        color = Color(0xFF94A3B8)
                    )
                    HorizontalDivider(modifier = Modifier.weight(1f), color = Color(0xFF334155))
                }

                Spacer(modifier = Modifier.height(14.dp))

                OutlinedTextField(
                    value = email,
                    onValueChange = { 
                        email = it
                        errorMessage = null
                    },
                    label = { Text("Usuario, correo o matrícula", color = TextMuted) },
                    modifier = Modifier.fillMaxWidth()
                        .onGloballyPositioned {
                            usuarioNode.boundingBox = it.boundsInWindow()
                        }
                        .onFocusChanged {
                            if (it.isFocused) {
                                autofill?.requestAutofillForNode(usuarioNode)
                            } else {
                                autofill?.cancelAutofillForNode(usuarioNode)
                            }
                        },
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
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Password
                    ),
                    modifier = Modifier.fillMaxWidth()
                        .onGloballyPositioned {
                            passwordNode.boundingBox = it.boundsInWindow()
                        }
                        .onFocusChanged {
                            if (it.isFocused) {
                                autofill?.requestAutofillForNode(passwordNode)
                            } else {
                                autofill?.cancelAutofillForNode(passwordNode)
                            }
                        },
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

                Spacer(modifier = Modifier.height(16.dp))

                // Login Button
                Button(
                    enabled = authState !is AuthState.Loading,
                    onClick = {
                        if (email.isBlank()) {
                            errorMessage = "Ingresa tu usuario, correo o matrícula."
                            return@Button
                        }
                        if (password.isBlank()) {
                            errorMessage = "Ingresa tu contraseña."
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
                        text = if (authState is AuthState.Loading) "Autenticando..." else "Iniciar Sesión",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))


                TextButton(
                    enabled = authState !is AuthState.Loading,
                    onClick = {
                        correoRecuperacion = email.trim()
                        mostrarRecuperacion = true
                    }
                ) {
                    Text(
                        "Olvide mi contraseña",
                        color = CyanAccent
                    )
                }

                // Register Link
                TextButton(
                    onClick = { showRegisterDialog = true }
                ) {
                    Text(
                        text = "¿No tienes cuenta? Registrarme como aspirante",
                        fontSize = 12.sp,
                        color = CyanAccent,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }
    }


    if (mensajeCuenta.isNotBlank()) {
        AlertDialog(
            containerColor = CardBackgroundDark,
            onDismissRequest = {
                authViewModel.limpiarMensajeCuenta()
            },
            title = {
                Text("Cuenta IINICIA", color = CyanAccent)
            },
            text = {
                Text(mensajeCuenta, color = Color.White)
            },
            confirmButton = {
                Button(
                    onClick = {
                        authViewModel.limpiarMensajeCuenta()
                    }
                ) {
                    Text("Entendido")
                }
            }
        )
    }

    if (mostrarRecuperacion) {
        AlertDialog(
            containerColor = CardBackgroundDark,
            onDismissRequest = {
                mostrarRecuperacion = false
            },
            title = {
                Text(
                    "Recuperar contraseña",
                    color = CyanAccent
                )
            },
            text = {
                Column(
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        "Ingresa el correo de tu cuenta de aspirante.",
                        color = Color.White
                    )

                    OutlinedTextField(
                        value = correoRecuperacion,
                        onValueChange = {
                            correoRecuperacion = it
                        },
                        label = { Text("Correo electronico") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
            },
            confirmButton = {
                Button(
                    enabled = correoRecuperacion.isNotBlank() &&
                        authState !is AuthState.Loading,
                    onClick = {
                        mostrarRecuperacion = false
                        authViewModel.recuperarPassword(
                            correoRecuperacion.trim()
                        )
                    }
                ) {
                    Text("Enviar instrucciones")
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        mostrarRecuperacion = false
                    }
                ) {
                    Text("Cancelar", color = CyanAccent)
                }
            }
        )
    }

    // Modal de Registro Rápido en Android
    if (showRegisterDialog) {
        AlertDialog(
            onDismissRequest = { showRegisterDialog = false },
            title = {
                Text(
                    text = "Crear Cuenta Aspirante",
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = regName,
                        onValueChange = { regName = it },
                        label = { Text("Nombre Completo") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = regEmail,
                        onValueChange = { regEmail = it },
                        label = { Text("Correo Electrónico") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = regPassword,
                        onValueChange = { regPassword = it },
                        label = { Text("Contraseña (mínimo 8 caracteres)") },
                        visualTransformation = PasswordVisualTransformation(),
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (regEmail.isNotBlank()) {
                            showRegisterDialog = false
                            authViewModel.register(regName, regEmail.trim(), regPassword)
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = CyanBright)
                ) {
                    Text("Registrarme", color = Color.White, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                OutlinedButton(onClick = { showRegisterDialog = false }) {
                    Text("Cancelar", color = TextMuted)
                }
            },
            containerColor = CardBackgroundDark
        )
    }
}
