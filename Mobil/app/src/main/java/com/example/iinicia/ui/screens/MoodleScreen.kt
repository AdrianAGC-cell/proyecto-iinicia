package com.example.iinicia.ui.screens

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.example.iinicia.ui.theme.CyanAccent
import com.example.iinicia.ui.theme.DarkBackground
import com.example.iinicia.ui.theme.NavyPrimary
import com.example.iinicia.ui.theme.TextMuted

@OptIn(ExperimentalMaterial3Api::class)
@SuppressLint("SetJavaScriptEnabled")
@Composable
fun MoodleScreen(
    onBackClick: () -> Unit,
    initialUrl: String = "https://web-kappa-one-49.vercel.app/moodle-preview"
) {
    val context = LocalContext.current
    var currentUrl by remember { mutableStateOf(initialUrl) }
    var inputUrl by remember { mutableStateOf(initialUrl) }
    var webViewInstance by remember { mutableStateOf<WebView?>(null) }
    var showUrlBar by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Campus Virtual Moodle (SSO)",
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            fontSize = 16.sp
                        )
                        Text(
                            text = if (currentUrl.contains("vercel.app")) "Servidor IINICIA (Preview)" else currentUrl,
                            color = CyanAccent,
                            fontSize = 11.sp,
                            maxLines = 1
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Regresar",
                            tint = Color.White
                        )
                    }
                },
                actions = {
                    IconButton(onClick = { showUrlBar = !showUrlBar }) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Cambiar URL de Moodle / Laptop",
                            tint = CyanAccent
                        )
                    }
                    IconButton(onClick = {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(currentUrl))
                        try {
                            context.startActivity(intent)
                        } catch (_: Exception) {}
                    }) {
                        Icon(
                            imageVector = Icons.Default.Share,
                            contentDescription = "Abrir en navegador",
                            tint = Color.White
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = NavyPrimary)
            )
        },
        containerColor = DarkBackground
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Barra de conexión dinámica para la laptop del compañero
            if (showUrlBar) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFF0F172A))
                        .padding(12.dp)
                ) {
                    Text(
                        text = "Conectar a Moodle en Laptop de Compañero:",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Ingresa la IP local o URL donde está corriendo Moodle / API (ej. http://192.168.1.X:8080)",
                        fontSize = 10.sp,
                        color = TextMuted
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedTextField(
                            value = inputUrl,
                            onValueChange = { inputUrl = it },
                            modifier = Modifier.weight(1f),
                            singleLine = true,
                            textStyle = androidx.compose.ui.text.TextStyle(fontSize = 12.sp, color = Color.White)
                        )
                        Button(
                            onClick = {
                                val fixed = if (!inputUrl.startsWith("http://") && !inputUrl.startsWith("https://")) {
                                    "http://$inputUrl"
                                } else {
                                    inputUrl
                                }
                                currentUrl = fixed
                                webViewInstance?.loadUrl(fixed)
                                showUrlBar = false
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = CyanAccent),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Icon(Icons.Default.PlayArrow, contentDescription = "Cargar", tint = Color.Black)
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Button(
                            onClick = {
                                currentUrl = "https://web-kappa-one-49.vercel.app/moodle-preview"
                                inputUrl = currentUrl
                                webViewInstance?.loadUrl(currentUrl)
                                showUrlBar = false
                            },
                            modifier = Modifier.weight(1f).height(32.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E293B)),
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text("IINICIA Preview", fontSize = 10.sp, color = CyanAccent)
                        }

                        Button(
                            onClick = {
                                currentUrl = "http://10.0.2.2:5000"
                                inputUrl = currentUrl
                                webViewInstance?.loadUrl(currentUrl)
                                showUrlBar = false
                            },
                            modifier = Modifier.weight(1f).height(32.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E293B)),
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text("Emulador (10.0.2.2)", fontSize = 10.sp, color = Color.White)
                        }
                    }
                }
            }

            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .weight(1f)
            ) {
                AndroidView(
                    modifier = Modifier.fillMaxSize(),
                    factory = { ctx ->
                        WebView(ctx).apply {
                            settings.javaScriptEnabled = true
                            settings.domStorageEnabled = true
                            settings.loadWithOverviewMode = true
                            settings.useWideViewPort = true
                            settings.databaseEnabled = true
                            webViewClient = WebViewClient()
                            webViewInstance = this
                            loadUrl(currentUrl)
                        }
                    },
                    update = { view ->
                        webViewInstance = view
                    }
                )
            }
        }
    }
}
