package com.example.iinicia.ui.screens

import android.net.Uri
import android.provider.OpenableColumns
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.example.iinicia.data.IiniciaRepository
import com.example.iinicia.ui.theme.*
import com.google.gson.JsonObject
import kotlinx.coroutines.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.MultipartBody

@Composable
fun AssignmentSubmission(
    courseId: Long,
    tarea: JsonObject,
    repository: IiniciaRepository
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    val assignmentId = tarea.get("id").asLong

    val limites = tarea.getAsJsonObject("limites")
    val maxArchivos = (limites?.get("maxArchivos")?.asInt ?: 0)
        .coerceIn(0, 10)
    val maxBytes = (limites?.get("maxBytes")?.asLong ?: 0L)
        .coerceIn(0L, 20L * 1024 * 1024)

    var estado by remember(assignmentId) {
        mutableStateOf<JsonObject?>(null)
    }

    var archivos by remember(assignmentId) {
        mutableStateOf<List<Uri>>(emptyList())
    }

    var ocupado by remember { mutableStateOf(false) }
    var mensaje by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }
    var confirmar by remember { mutableStateOf(false) }

    var cancelacion by remember(assignmentId) {
        mutableStateOf<JsonObject?>(null)
    }

    var confirmarCancelacion by remember {
        mutableStateOf(false)
    }

    var indiceDescarga by remember {
        mutableStateOf(0)
    }

    val guardarDocumento = rememberLauncherForActivityResult(
        ActivityResultContracts.CreateDocument("application/pdf")
    ) { destino ->
        if (destino != null) {
            ocupado = true
            error = ""
            mensaje = ""

            scope.launch {
                try {
                    repository.descargarEntrega(
                        courseId,
                        assignmentId,
                        indiceDescarga,
                        context.contentResolver,
                        destino
                    ).onSuccess {
                        mensaje = "Documento descargado correctamente"
                    }.onFailure {
                        error = it.message ?: "Error descargando el PDF"
                    }
                } finally {
                    ocupado = false
                }
            }
        }
    }


    fun nombreArchivo(uri: Uri): String {
        return context.contentResolver.query(
            uri, arrayOf(OpenableColumns.DISPLAY_NAME),
            null, null, null
        )?.use { cursor ->
            if (cursor.moveToFirst()) cursor.getString(0)
            else null
        } ?: "documento.pdf"
    }

    suspend fun actualizar() {
        repository.consultarEntrega(courseId, assignmentId)
            .onSuccess { estado = it }
            .onFailure {
                estado = null
                error = it.message ?: "No se pudo consultar la entrega"
            }

        repository.consultarCancelacion(
            courseId, assignmentId
        ).onSuccess {
            cancelacion = it
        }.onFailure {
            cancelacion = null
        }
    }

    LaunchedEffect(assignmentId) {
        ocupado = true
        actualizar()
        ocupado = false
    }

    val selector = rememberLauncherForActivityResult(
        ActivityResultContracts.OpenMultipleDocuments()
    ) { seleccion ->
        if (seleccion.isNotEmpty()) {
            error = ""
            if (seleccion.size > maxArchivos) {
                error = "Solo puedes seleccionar $maxArchivos archivos."
            } else {
                archivos = seleccion.distinct()
            }
        }
    }

    val actual = estado?.get("estado")?.asString ?: ""
    val calificada = estado?.get("calificada")?.asBoolean == true

    val puedeSubir =
        estado?.get("puedeEditar")?.asBoolean == true &&
        actual in listOf("new", "reopened") &&
        !calificada && maxArchivos > 0 && maxBytes > 0

    val puedeConfirmar =
        estado?.get("puedeEnviar")?.asBoolean == true &&
        actual == "draft" && !calificada

    Text(
        when {
            calificada -> "Estado: Calificada"
            actual == "submitted" -> "Estado: Enviada para calificación"
            actual == "draft" -> "Estado: Borrador"
            actual == "new" -> "Estado: Sin entrega"
            actual == "reopened" -> "Estado: Reabierta"
            else -> "Estado: No disponible"
        },
        color = BrightBlue
    )

    estado?.getAsJsonArray("archivosEntregados")?.forEachIndexed { index, elemento ->
        val archivo = elemento.asJsonObject
        val nombre = archivo.get("nombre").asString

        Text(
            nombre,
            color = MaterialTheme.colorScheme.onSurface
        )

        if (nombre.endsWith(".pdf", true)) {
            OutlinedButton(
                enabled = !ocupado,
                onClick = {
                    indiceDescarga = index
                    guardarDocumento.launch(nombre)
                },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Descargar PDF", color = BrightBlue)
            }
        }
    }

    if (puedeSubir) {
        Text(
            "Máximo $maxArchivos PDF. " +
                "${maxBytes / 1024 / 1024} MB por archivo.",
            color = TextMuted
        )

        OutlinedButton(
            enabled = !ocupado,
            onClick = {
                selector.launch(arrayOf("application/pdf"))
            },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Seleccionar PDF", color = BrightBlue)
        }

        archivos.forEach { uri ->
            Row(modifier = Modifier.fillMaxWidth()) {
                Text(
                    nombreArchivo(uri),
                    modifier = Modifier.weight(1f),
                    color = MaterialTheme.colorScheme.onSurface
                )

                TextButton(
                    enabled = !ocupado,
                    onClick = {
                        archivos = archivos.filterNot { it == uri }
                    }
                ) {
                    Text("Quitar")
                }
            }
        }

        Button(
            enabled = archivos.isNotEmpty() && !ocupado,
            modifier = Modifier.fillMaxWidth(),
            onClick = {
                ocupado = true
                error = ""
                mensaje = ""

                scope.launch {
                    try {
                        val partes = withContext(Dispatchers.IO) {
                            var total = 0L
                            val nombres = mutableSetOf<String>()

                            archivos.map { uri ->
                                val nombre = nombreArchivo(uri)

                                require(nombre.endsWith(".pdf", true)) {
                                    "Selecciona únicamente archivos PDF"
                                }

                                require(nombres.add(nombre.lowercase())) {
                                    "No se permiten nombres duplicados"
                                }

                                val bytes = context.contentResolver
                                    .openInputStream(uri)?.use { input ->
                                        val salida = java.io.ByteArrayOutputStream()
                                        val buffer = ByteArray(8192)
                                        var cantidad: Int

                                        while (input.read(buffer).also {
                                            cantidad = it
                                        } != -1) {
                                            total += cantidad

                                            require(
                                                salida.size().toLong() +
                                                    cantidad <= maxBytes
                                            ) {
                                                "El archivo supera el límite permitido"
                                            }

                                            require(total <= 50L * 1024 * 1024) {
                                                "La entrega supera 50 MB"
                                            }

                                            salida.write(buffer, 0, cantidad)
                                        }

                                        salida.toByteArray()
                                    } ?: throw Exception("No se pudo leer el PDF")

                                require(
                                    bytes.size >= 5 &&
                                    String(bytes.copyOfRange(0, 5)) == "%PDF-"
                                ) {
                                    "El documento no es un PDF válido"
                                }

                                MultipartBody.Part.createFormData(
                                    "archivo",
                                    nombre,
                                    bytes.toRequestBody(
                                        "application/pdf".toMediaType()
                                    )
                                )
                            }
                        }

                        repository.subirEntrega(
                            courseId, assignmentId, partes
                        ).onSuccess {
                            archivos = emptyList()
                            mensaje = "Archivos guardados en Moodle"
                        }.onFailure {
                            error = it.message ?: "No se pudo guardar"
                        }

                    } catch (e: CancellationException) {
                        throw e
                    } catch (e: Exception) {
                        error = e.message ?: "Error leyendo los archivos"
                    } finally {
                        actualizar()
                        ocupado = false
                    }
                }
            }
        ) {
            Text("Guardar archivos")
        }
    }

    if (puedeConfirmar) {
        Button(
            enabled = !ocupado,
            onClick = { confirmar = true },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Confirmar entrega")
        }
    }


    val pendiente =
        cancelacion?.get("pendiente")?.asBoolean == true

    val puedeSolicitar =
        cancelacion?.get("puedeSolicitar")?.asBoolean == true &&
        !calificada && actual == "submitted"

    val solicitud = cancelacion?.get("solicitud")
        ?.takeUnless { it.isJsonNull }
        ?.asJsonObject

    val estadoSolicitud = solicitud?.get("status")?.asString

    if (pendiente) {
        Text(
            "Solicitud de cancelación pendiente de revisión.",
            color = BrightBlue
        )
    } else if (estadoSolicitud == "approved") {
        Text(
            "Última solicitud: aprobada",
            color = BrightBlue
        )
    } else if (estadoSolicitud == "rejected") {
        Text(
            "Última solicitud: rechazada",
            color = TextMuted
        )
    }

    if (puedeSolicitar && !pendiente) {
        OutlinedButton(
            enabled = !ocupado,
            onClick = { confirmarCancelacion = true },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Solicitar cancelación", color = BrightBlue)
        }
    }

    if (confirmarCancelacion) {
        AlertDialog(
            onDismissRequest = {
                confirmarCancelacion = false
            },
            containerColor = CardBackground,
            title = {
                Text(
                    "Solicitar cancelación",
                    color = BrightBlue
                )
            },
            text = {
                Text(
                    "El profesor deberá aprobar tu solicitud. " +
                    "Tus archivos no se eliminarán al solicitarla."
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        confirmarCancelacion = false
                        ocupado = true
                        error = ""
                        mensaje = ""

                        scope.launch {
                            try {
                                repository.solicitarCancelacion(
                                    courseId, assignmentId
                                ).onSuccess {
                                    mensaje = "Solicitud enviada al profesor"
                                }.onFailure {
                                    error = it.message
                                        ?: "No se pudo enviar la solicitud"
                                }
                            } finally {
                                actualizar()
                                ocupado = false
                            }
                        }
                    }
                ) {
                    Text("Enviar solicitud")
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        confirmarCancelacion = false
                    }
                ) {
                    Text("Volver")
                }
            }
        )
    }

    if (confirmar) {
        AlertDialog(
            onDismissRequest = { confirmar = false },
            containerColor = CardBackground,
            title = {
                Text("Confirmar entrega", color = BrightBlue)
            },
            text = {
                Text(
                    "Los archivos serán enviados al profesor para su evaluación."
                )
            },
            confirmButton = {
                Button(onClick = {
                    confirmar = false
                    ocupado = true
                    error = ""
                    mensaje = ""

                    scope.launch {
                        try {
                            repository.confirmarEntrega(
                                courseId, assignmentId
                            ).onSuccess {
                                mensaje = "Entrega confirmada correctamente"
                            }.onFailure {
                                error = it.message ?: "No se pudo confirmar"
                            }
                        } finally {
                            actualizar()
                            ocupado = false
                        }
                    }
                }) {
                    Text("Enviar entrega")
                }
            },
            dismissButton = {
                TextButton(onClick = { confirmar = false }) {
                    Text("Cancelar")
                }
            }
        )
    }

    if (ocupado) {
        LinearProgressIndicator(
            modifier = Modifier.fillMaxWidth()
        )
        Text("Comunicando con Moodle...", color = TextMuted)
    }

    if (mensaje.isNotBlank()) {
        Text(mensaje, color = BrightBlue)
    }

    if (error.isNotBlank()) {
        Text(error, color = MaterialTheme.colorScheme.error)
    }

    TextButton(
        enabled = !ocupado,
        onClick = {
            ocupado = true
            error = ""

            scope.launch {
                actualizar()
                ocupado = false
            }
        }
    ) {
        Text("Actualizar estado", color = BrightBlue)
    }
}
