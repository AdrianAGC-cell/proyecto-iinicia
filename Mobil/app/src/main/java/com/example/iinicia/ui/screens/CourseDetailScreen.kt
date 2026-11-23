package com.example.iinicia.ui.screens

import androidx.compose.foundation.BorderStroke

import android.content.Intent
import android.widget.Toast
import androidx.core.content.FileProvider
import androidx.compose.foundation.clickable
import androidx.compose.ui.platform.LocalContext
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.example.iinicia.data.IiniciaRepository
import kotlinx.coroutines.launch
import java.io.File

import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.iinicia.ui.theme.BrightBlue
import com.example.iinicia.ui.theme.CardBackground
import com.example.iinicia.ui.theme.CardBorder
import com.example.iinicia.ui.theme.IvoryBackground
import com.example.iinicia.ui.theme.NavyPrimary
import com.example.iinicia.ui.theme.TextMuted
import com.example.iinicia.viewmodel.DashboardViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CourseDetailScreen(
    courseId: String,
    viewModel: DashboardViewModel,
    onBackClick: () -> Unit
) {
    val course by viewModel.selectedCourse.collectAsState()

    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    val repository = remember {
        IiniciaRepository(context.applicationContext)
    }

    var descargando by remember {
        mutableStateOf(false)
    }

    var selectedActivityDialog by remember {
        mutableStateOf<com.example.iinicia.data.MoodleTaskDto?>(null)
    }


    LaunchedEffect(courseId) {
        viewModel.selectCourse(courseId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Detalle del Curso Moodle", color = Color.White) },
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
        val currentCourse = course
        if (currentCourse != null) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Course Info Card
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = CardBackground),
                        border = BorderStroke(1.dp, CardBorder)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(20.dp)
                        ) {
                            Text(
                                text = currentCourse.title,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = NavyPrimary
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = currentCourse.description,
                                fontSize = 14.sp,
                                color = TextMuted
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = "Profesor: ${currentCourse.instructor}",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = BrightBlue
                            )
                            Text(
                                text = "Periodo: ${currentCourse.semester}",
                                fontSize = 13.sp,
                                color = TextMuted
                            )
                        }
                    }
                }

                // Section Title: Activities
                item {
                    Text(
                        text = "Contenido del curso",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = NavyPrimary,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }

                // Actividades agrupadas por sección de Moodle
                val secciones = currentCourse.tasks.groupBy {
                    it.sectionName.ifBlank { "General" }
                }

                secciones.forEach { (nombreSeccion, actividades) ->
                    item {
                        Text(
                            text = nombreSeccion,
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Bold,
                            color = NavyPrimary,
                            modifier = Modifier.padding(top = 8.dp)
                        )
                    }

                    items(actividades) { task ->
                        val abrirActividad: () -> Unit = {

                                if (task.dueDate == "resource" && task.status == "Disponible") {
                                    val cid = courseId.toLongOrNull()
                                    val mid = task.id.toLongOrNull()

                                    if (cid != null && mid != null) {
                                        descargando = true

                                        scope.launch {
                                            try {
                                                val carpeta = File(
                                                    context.cacheDir,
                                                    "moodle_pdf"
                                                )

                                                carpeta.mkdirs()

                                                val destino = File.createTempFile(
                                                    "recurso_",
                                                    ".pdf",
                                                    carpeta
                                                )

                                                Toast.makeText(
                                                    context,
                                                    "Descargando PDF...",
                                                    Toast.LENGTH_SHORT
                                                ).show()

                                                val resultado = repository.descargarPdf(
                                                    cid,
                                                    mid,
                                                    destino
                                                )

                                                val pdf = resultado.getOrThrow()

                                                val uri = FileProvider.getUriForFile(
                                                    context,
                                                    context.packageName + ".moodlefiles",
                                                    pdf
                                                )

                                                val intent = Intent(Intent.ACTION_VIEW).apply {
                                                    setDataAndType(uri, "application/pdf")
                                                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                                                }

                                                context.startActivity(intent)

                                            } catch (e: kotlinx.coroutines.CancellationException) {
                                                throw e
                                            } catch (e: android.content.ActivityNotFoundException) {
                                                Toast.makeText(
                                                    context,
                                                    "No tienes un visor PDF instalado",
                                                    Toast.LENGTH_LONG
                                                ).show()
                                            } catch (e: Exception) {
                                                Toast.makeText(
                                                    context,
                                                    "No se pudo abrir el PDF. Verifica tu sesion.",
                                                    Toast.LENGTH_LONG
                                                ).show()
                                            } finally {
                                                descargando = false
                                            }
                                        }
                                    }
                                } else {
                                    selectedActivityDialog = task
                                }
                        }
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable(enabled = !descargando, onClick = abrirActividad),
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = CardBackground),
                        border = BorderStroke(1.dp, CardBorder)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = null,
                                tint = BrightBlue,
                                modifier = Modifier.size(32.dp)
                            )
                            Spacer(modifier = Modifier.width(16.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = task.title,
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = NavyPrimary
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = when (task.dueDate) {
                                        "resource" -> "Presiona para abrir el PDF"
                                        "forum" -> "Foro de Moodle"
                                        else -> "Tipo: ${task.dueDate}"
                                    },
                                    fontSize = 12.sp,
                                    color = TextMuted
                                )
                                if (task.grade != null) {
                                    Text(
                                        text = "Calificación: ${task.grade}",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color(0xFF10B981)
                                    )
                                }
                            }
                            if (task.dueDate == "resource" && task.status == "Disponible") {
                                androidx.compose.material3.Button(
                                    onClick = abrirActividad,
                                    enabled = !descargando,
                                    colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                                        containerColor = BrightBlue
                                    )
                                ) {
                                    Text("Abrir PDF", color = Color.White)
                                }
                            }

                            // Status badge
                            Text(
                                text = task.status,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (task.status == "Completado") Color(0xFF10B981) else BrightBlue
                            )
                        }
                    }
                }
                }
            }
        }

        // Modal de interacción con actividades Moodle (Foro / Tarea / Evaluación)
        selectedActivityDialog?.let { activity ->
            androidx.compose.material3.AlertDialog(
                onDismissRequest = { selectedActivityDialog = null },
                title = {
                    Text(
                        text = activity.title,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = NavyPrimary
                    )
                },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            text = "Módulo Académico: ${activity.dueDate.uppercase()}",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = BrightBlue
                        )
                        Text(
                            text = "Estado: ${activity.status}",
                            fontSize = 13.sp,
                            color = Color.DarkGray
                        )
                        activity.grade?.let { g ->
                            Text(
                                text = "Calificación Registrada: $g",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF10B981)
                            )
                        }
                        Text(
                            text = "Para participar en foros, entregar tareas o contestar cuestionarios con tu identidad única institucional, accede al Campus Virtual mediante Single Sign-On.",
                            fontSize = 12.sp,
                            color = TextMuted
                        )
                    }
                },
                confirmButton = {
                    androidx.compose.material3.Button(
                        onClick = {
                            selectedActivityDialog = null
                            val intent = Intent(
                                Intent.ACTION_VIEW,
                                android.net.Uri.parse("https://moodle.iinicia.org/course/view.php?id=$courseId")
                            )
                            try {
                                context.startActivity(intent)
                            } catch (_: Exception) {
                                Toast.makeText(context, "No se pudo abrir el navegador", Toast.LENGTH_SHORT).show()
                            }
                        },
                        colors = androidx.compose.material3.ButtonDefaults.buttonColors(containerColor = BrightBlue)
                    ) {
                        Text("Abrir en Campus Virtual (SSO)", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                },
                dismissButton = {
                    androidx.compose.material3.OutlinedButton(onClick = { selectedActivityDialog = null }) {
                        Text("Cerrar", fontSize = 12.sp)
                    }
                }
            )
        }
    }
}
