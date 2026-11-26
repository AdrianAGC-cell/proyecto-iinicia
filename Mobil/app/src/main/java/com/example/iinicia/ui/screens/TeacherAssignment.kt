package com.example.iinicia.ui.screens

import androidx.compose.foundation.layout.*
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.ui.platform.LocalContext
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.text.font.FontWeight
import com.example.iinicia.data.IiniciaRepository
import com.example.iinicia.ui.theme.*
import com.google.gson.JsonObject
import kotlinx.coroutines.launch

@Composable
fun AssignmentByPermission(
    courseId: Long,
    tarea: JsonObject,
    repository: IiniciaRepository
) {
    var permisos by remember(courseId, tarea) {
        mutableStateOf<JsonObject?>(null)
    }

    var error by remember { mutableStateOf("") }
    var revision by remember { mutableStateOf(0) }

    val id = tarea.get("id").asLong

    LaunchedEffect(courseId, id, revision) {
        error = ""
        permisos = null

        repository.consultarGestion(
            "api/auth/courses/$courseId/assignments/$id/permissions"
        ).onSuccess {
            permisos = it
        }.onFailure {
            error = it.message ?: "No se pudieron consultar los permisos"
        }
    }

    when {
        error.isNotBlank() -> {
            Text(error, color = MaterialTheme.colorScheme.error)

            TextButton(onClick = { revision++ }) {
                Text("Reintentar", color = BrightBlue)
            }
        }

        permisos == null -> {
            LinearProgressIndicator(
                modifier = Modifier.fillMaxWidth()
            )
        }

        permisos?.get("puedeCalificar")?.asBoolean == true -> {
            TeacherAssignment(
                courseId = courseId,
                assignmentId = id,
                repository = repository
            )
        }

        permisos?.get("puedeEntregar")?.asBoolean == true -> {
            AssignmentSubmission(
                courseId = courseId,
                tarea = tarea,
                repository = repository
            )
        }

        else -> {
            Text(
                "No tienes permisos de entrega o evaluación.",
                color = TextMuted
            )
        }
    }
}

@Composable
fun TeacherAssignment(
    courseId: Long,
    assignmentId: Long,
    repository: IiniciaRepository
) {
    val scope = rememberCoroutineScope()

    val ruta =
        "api/auth/teacher/courses/$courseId/assignments/$assignmentId"

    var datos by remember { mutableStateOf<JsonObject?>(null) }
    var seleccionado by remember { mutableStateOf<JsonObject?>(null) }

    var nota by remember { mutableStateOf("") }
    var comentario by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }
    var mensaje by remember { mutableStateOf("") }
    var ocupado by remember { mutableStateOf(false) }

    val context = LocalContext.current

    var rutaDescarga by remember {
        mutableStateOf("")
    }

    var solicitudes by remember {
        mutableStateOf<com.google.gson.JsonArray?>(null)
    }

    var errorSolicitudes by remember {
        mutableStateOf("")
    }

    var solicitudSeleccionada by remember {
        mutableStateOf<JsonObject?>(null)
    }

    var aprobarSolicitud by remember {
        mutableStateOf(false)
    }

    val selectorDescarga = rememberLauncherForActivityResult(
        ActivityResultContracts.CreateDocument("application/pdf")
    ) { destino ->
        if (destino != null && rutaDescarga.isNotBlank()) {
            ocupado = true
            error = ""
            mensaje = ""

            scope.launch {
                try {
                    repository.descargarDocumentoDocente(
                        rutaDescarga,
                        context.contentResolver,
                        destino
                    ).onSuccess {
                        mensaje = "Documento descargado"
                    }.onFailure {
                        error = it.message ?: "Error de descarga"
                    }
                } finally {
                    ocupado = false
                }
            }
        }
    }



    suspend fun actualizar() {
        ocupado = true

        try {
            repository.consultarGestion("$ruta/submissions")
                .onSuccess { datos = it }
                .onFailure {
                    datos = null
                    error = it.message
                        ?: "No se pudieron consultar las entregas"
                }
            repository.consultarGestion("$ruta/cancellation")
                .onSuccess {
                    solicitudes = it.getAsJsonArray("solicitudes")
                    errorSolicitudes = ""
                }
                .onFailure {
                    solicitudes = null
                    errorSolicitudes = it.message
                        ?: "No se pudieron consultar las solicitudes"
                }

        } finally {
            ocupado = false
        }
    }

    LaunchedEffect(courseId, assignmentId) {
        actualizar()
    }

    val maximo = datos?.getAsJsonObject("tarea")
        ?.get("calificacionMaxima")?.asDouble ?: 0.0

    HorizontalDivider()

    Text(
        "Evaluación docente",
        color = BrightBlue,
        fontWeight = FontWeight.Bold
    )

    Text(
        "Estudiantes: ${datos?.get("totalEstudiantes")?.asInt ?: 0}",
        color = TextMuted
    )

    Text(
        "Entregados: ${datos?.get("totalEntregados")?.asInt ?: 0}",
        color = BrightBlue
    )

    datos?.getAsJsonArray("estudiantes")?.forEach { elemento ->

        val estudiante = elemento.asJsonObject

        val estado = estudiante.get("estado").asString

        val calificacion = estudiante.get("calificacion")
            ?.takeUnless { it.isJsonNull }?.asString

        Card(
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    estudiante.get("nombre").asString,
                    fontWeight = FontWeight.Bold,
                    color = BrightBlue
                )

                Text(
                    when (estado) {
                        "submitted" -> "Entrega enviada"
                        "draft" -> "Borrador"
                        else -> "Sin entrega activa"
                    }
                )

                Text(
                    "Calificación: " +
                        (calificacion ?: "Pendiente")
                )

                estudiante.getAsJsonArray("archivos")?.forEach { elemento ->
                    val archivo = elemento.asJsonObject
                    val nombre = archivo.get("nombre").asString
                    val indice = archivo.get("indice").asInt
                    val estudianteId = estudiante.get("id").asLong

                    Text(nombre, color = TextMuted)

                    if (nombre.endsWith(".pdf", true)) {
                        OutlinedButton(
                            enabled = !ocupado,
                            modifier = Modifier.fillMaxWidth(),
                            onClick = {
                                rutaDescarga =
                                    "$ruta/students/$estudianteId/files/$indice"

                                selectorDescarga.launch(nombre)
                            }
                        ) {
                            Text("Descargar PDF", color = BrightBlue)
                        }
                    }
                }

                if (estado == "submitted" && maximo > 0) {
                    Button(
                        enabled = !ocupado,
                        modifier = Modifier.fillMaxWidth(),
                        onClick = {
                            nota = calificacion ?: ""
                            comentario = ""
                            error = ""
                            seleccionado = estudiante
                        }
                    ) {
                        Text(
                            if (calificacion == null)
                                "Calificar"
                            else "Editar calificación"
                        )
                    }
                }
            }
        }
    }


    HorizontalDivider()

    Text(
        "Solicitudes de cancelación",
        color = BrightBlue,
        fontWeight = FontWeight.Bold
    )

    if (errorSolicitudes.isNotBlank()) {
        Text(
            errorSolicitudes,
            color = MaterialTheme.colorScheme.error
        )
    }

    if (solicitudes?.size() == 0) {
        Text("No hay solicitudes registradas", color = TextMuted)
    }

    solicitudes?.forEach { elemento ->

        val solicitud = elemento.asJsonObject

        val estadoSolicitud = solicitud.get("status")
            ?.asString ?: ""

        val usuarioId = solicitud.get("userid")
            ?.asString.orEmpty()

        val nombre = datos?.getAsJsonArray("estudiantes")
            ?.firstOrNull {
                it.asJsonObject.get("id")?.asString == usuarioId
            }?.asJsonObject?.get("nombre")?.asString
            ?: "Usuario $usuarioId"

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(
                modifier = Modifier.padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {

                Text(nombre, color = BrightBlue)

                Text(
                    when (estadoSolicitud) {
                        "pending" -> "Pendiente de revisión"
                        "approved" -> "Aprobada"
                        "rejected" -> "Rechazada"
                        else -> estadoSolicitud
                    }
                )

                if (estadoSolicitud == "pending") {

                    Button(
                        enabled = !ocupado,
                        modifier = Modifier.fillMaxWidth(),
                        onClick = {
                            aprobarSolicitud = true
                            solicitudSeleccionada = solicitud
                            error = ""
                        }
                    ) {
                        Text("Aprobar cancelación")
                    }

                    OutlinedButton(
                        enabled = !ocupado,
                        modifier = Modifier.fillMaxWidth(),
                        onClick = {
                            aprobarSolicitud = false
                            solicitudSeleccionada = solicitud
                            error = ""
                        }
                    ) {
                        Text("Rechazar solicitud")
                    }
                }
            }
        }
    }

    solicitudSeleccionada?.let { solicitud ->

        AlertDialog(
            containerColor = CardBackground,
            onDismissRequest = {
                if (!ocupado) solicitudSeleccionada = null
            },
            title = {
                Text(
                    if (aprobarSolicitud)
                        "Aprobar cancelación"
                    else
                        "Rechazar cancelación",
                    color = BrightBlue
                )
            },
            text = {
                Column {
                    Text(
                        if (aprobarSolicitud)
                            "La entrega volverá a borrador si Moodle permite la operación."
                        else
                            "La entrega conservará su estado actual."
                    )

                    if (error.isNotBlank()) {
                        Text(
                            error,
                            color = MaterialTheme.colorScheme.error
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    enabled = !ocupado,
                    onClick = {
                        val id = solicitud.get("requestid").asLong

                        val cuerpo = JsonObject().apply {
                            addProperty("aprobar", aprobarSolicitud)
                        }

                        ocupado = true
                        error = ""

                        scope.launch {
                            try {
                                repository.crearGestion(
                                    "$ruta/cancellation/$id",
                                    cuerpo
                                ).onSuccess {
                                    mensaje = it.get("mensaje")
                                        ?.asString
                                        ?: "Solicitud revisada"

                                    solicitudSeleccionada = null
                                }.onFailure {
                                    error = it.message
                                        ?: "No se confirmó la operación"
                                }
                            } finally {
                                actualizar()
                                ocupado = false
                            }
                        }
                    }
                ) {
                    Text("Confirmar")
                }
            },
            dismissButton = {
                TextButton(
                    enabled = !ocupado,
                    onClick = {
                        solicitudSeleccionada = null
                    }
                ) {
                    Text("Volver")
                }
            }
        )
    }

    seleccionado?.let { estudiante ->

        AlertDialog(
            containerColor = CardBackground,
            onDismissRequest = {
                if (!ocupado) seleccionado = null
            },
            title = {
                Text(
                    "Evaluar estudiante",
                    color = BrightBlue
                )
            },
            text = {
                Column(
                    modifier = Modifier
                        .heightIn(max = 400.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {

                    Text(estudiante.get("nombre").asString)

                    OutlinedTextField(
                        value = nota,
                        onValueChange = { nota = it },
                        enabled = !ocupado,
                        label = {
                            Text("Calificación de 0 a $maximo")
                        },
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = comentario,
                        onValueChange = { comentario = it },
                        enabled = !ocupado,
                        label = { Text("Retroalimentación") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 3
                    )

                    Text(
                        "La retroalimentación ingresada sustituirá " +
                        "el comentario anterior.",
                        color = TextMuted
                    )

                    if (error.isNotBlank()) {
                        Text(
                            error,
                            color = MaterialTheme.colorScheme.error
                        )
                    }

                    if (ocupado) {
                        LinearProgressIndicator(
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    enabled = !ocupado,
                    onClick = {
                        val valor = nota.toDoubleOrNull()

                        val intento = estudiante.get("intento")
                            ?.takeUnless { it.isJsonNull }
                            ?.asInt

                        if (
                            valor == null ||
                            !valor.isFinite() ||
                            valor < 0 ||
                            valor > maximo ||
                            intento == null
                        ) {
                            error = "Revisa la calificación y el intento"
                        } else {
                            ocupado = true
                            error = ""

                            val cuerpo = JsonObject().apply {
                                addProperty("calificacion", valor)
                                addProperty("comentario", comentario)
                                addProperty("intento", intento)
                            }

                            val id = estudiante.get("id").asLong

                            scope.launch {
                                try {
                                    repository.crearGestion(
                                        "$ruta/students/$id/grade",
                                        cuerpo
                                    ).onSuccess {
                                        seleccionado = null
                                        mensaje = "Calificación guardada en Moodle"
                                    }.onFailure {
                                        error = it.message
                                            ?: "No se confirmó el guardado"
                                    }
                                } finally {
                                    actualizar()
                                    ocupado = false
                                }
                            }
                        }
                    }
                ) {
                    Text("Guardar calificación")
                }
            },
            dismissButton = {
                TextButton(
                    enabled = !ocupado,
                    onClick = { seleccionado = null }
                ) {
                    Text("Cancelar")
                }
            }
        )
    }

    if (mensaje.isNotBlank()) {
        Text(mensaje, color = BrightBlue)
    }

    if (error.isNotBlank() && seleccionado == null) {
        Text(error, color = MaterialTheme.colorScheme.error)
    }

    if (ocupado) {
        LinearProgressIndicator(
            modifier = Modifier.fillMaxWidth()
        )
    }

    TextButton(
        enabled = !ocupado,
        onClick = {
            error = ""
            scope.launch { actualizar() }
        }
    ) {
        Text("Actualizar entregas", color = BrightBlue)
    }
}
