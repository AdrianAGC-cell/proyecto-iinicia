package com.example.iinicia.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.platform.LocalContext
import com.example.iinicia.data.IiniciaRepository
import com.example.iinicia.ui.theme.*
import com.google.gson.JsonObject
import java.text.DateFormat
import java.util.Date

@Composable
fun AssignmentDialog(
    courseId: Long,
    moduleId: Long,
    title: String,
    grade: String?,
    onClose: () -> Unit
) {
    val context = LocalContext.current
    val repository = remember {
        IiniciaRepository(context.applicationContext)
    }

    var datos by remember { mutableStateOf<JsonObject?>(null) }
    var error by remember { mutableStateOf("") }
    var cargando by remember { mutableStateOf(true) }

    LaunchedEffect(courseId, moduleId) {
        repository.getAssignment(courseId, moduleId)
            .onSuccess { datos = it }
            .onFailure {
                error = it.message ?: "No se pudo cargar"
            }

        cargando = false
    }

    AlertDialog(
        onDismissRequest = onClose,
        containerColor = CardBackground,
        title = {
            Text(
                title,
                color = BrightBlue,
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 500.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                if (cargando) {
                    CircularProgressIndicator(color = BrightBlue)
                    Text("Consultando Moodle...", color = TextMuted)
                }

                if (error.isNotBlank()) {
                    Text(
                        error,
                        color = MaterialTheme.colorScheme.error
                    )
                }

                datos?.let { tarea ->

                    Text(
                        "Instrucciones",
                        color = BrightBlue,
                        fontWeight = FontWeight.Bold
                    )

                    val descripcion = tarea.get("descripcion")
                        ?.takeUnless { it.isJsonNull }
                        ?.asString.orEmpty()

                    Text(
                        android.text.Html.fromHtml(
                            descripcion,
                            android.text.Html.FROM_HTML_MODE_LEGACY
                        ).toString().ifBlank {
                            "Sin instrucciones adicionales"
                        },
                        color = MaterialTheme.colorScheme.onSurface
                    )

                    HorizontalDivider()

                    listOf(
                        "permiteEntregasDesde" to "Apertura",
                        "fechaLimite" to "Fecha de entrega",
                        "fechaCierre" to "Fecha de cierre"
                    ).forEach { (clave, etiqueta) ->

                        val fecha = tarea.get(clave)
                            ?.takeUnless { it.isJsonNull }
                            ?.asLong ?: 0L

                        Text(
                            "$etiqueta: " +
                                if (fecha > 0) {
                                    DateFormat.getDateTimeInstance()
                                        .format(Date(fecha * 1000))
                                } else {
                                    "Sin fecha establecida"
                                },
                            color = TextMuted
                        )
                    }

                    HorizontalDivider()

                    Text(
                        "Calificación",
                        color = BrightBlue,
                        fontWeight = FontWeight.Bold
                    )

                    Text(
                        grade ?: "Sin calificación",
                        color = MaterialTheme.colorScheme.onSurface
                    )

                    HorizontalDivider()

                    Text(
                        "Entrega de archivos",
                        color = BrightBlue,
                        fontWeight = FontWeight.Bold
                    )

                    AssignmentByPermission(
                        courseId = courseId,
                        tarea = tarea,
                        repository = repository
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = onClose,
                colors = ButtonDefaults.buttonColors(
                    containerColor = BrightBlue
                )
            ) {
                Text("Cerrar")
            }
        }
    )
}
