package com.example.iinicia.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.example.iinicia.data.IiniciaRepository
import com.example.iinicia.ui.theme.*
import com.google.gson.JsonObject
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Locale

@Composable
fun TeacherCourseManagement(
    courseId: Long,
    onClose: () -> Unit
) {
    val context = LocalContext.current
    val repository = remember {
        IiniciaRepository(context.applicationContext)
    }
    val scope = rememberCoroutineScope()

    var datos by remember { mutableStateOf<JsonObject?>(null) }
    var ocupado by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf("") }
    var mensaje by remember { mutableStateOf("") }
    var seccion by remember { mutableStateOf<Int?>(null) }
    var actividad by remember { mutableStateOf<JsonObject?>(null) }

    var nombre by remember { mutableStateOf("") }
    var descripcion by remember { mutableStateOf("") }
    var fecha by remember { mutableStateOf("") }
    var cierre by remember { mutableStateOf("") }
    var nota by remember { mutableStateOf("100") }
    var archivos by remember { mutableStateOf("1") }
    var mb by remember { mutableStateOf("10") }
    var visible by remember { mutableStateOf(false) }

    suspend fun actualizar() {
        ocupado = true
        try {
            repository.consultarGestion(
                "api/auth/courses/$courseId/contents"
            ).onSuccess {
                datos = it
            }.onFailure {
                datos = null
                error = it.message ?: "Error consultando Moodle"
            }
        } finally {
            ocupado = false
        }
    }

    LaunchedEffect(courseId) {
        actualizar()
    }

    val permisos = datos?.getAsJsonObject("permisos")

    AlertDialog(
        containerColor = CardBackground,
        onDismissRequest = {
            if (!ocupado) onClose()
        },
        title = {
            Text("Gestión docente", color = BrightBlue)
        },
        text = {
            Column(
                modifier = Modifier
                    .heightIn(max = 520.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {

                datos?.getAsJsonArray("secciones")?.forEach { elemento ->
                    val sec = elemento.asJsonObject

                    Text(
                        sec.get("nombre").asString,
                        color = BrightBlue
                    )

                    if (permisos?.get("puedeCrear")?.asBoolean == true) {
                        Button(
                            enabled = !ocupado,
                            modifier = Modifier.fillMaxWidth(),
                            onClick = {
                                nombre = ""
                                descripcion = ""
                                fecha = ""
                                cierre = ""
                                nota = "100"
                                archivos = "1"
                                mb = "10"
                                visible = false
                                error = ""
                                seccion = sec.get("numero").asInt
                            }
                        ) {
                            Text("Crear asignación")
                        }
                    }

                    sec.getAsJsonArray("actividades")?.forEach { elemento ->
                        val tarea = elemento.asJsonObject

                        if (tarea.get("tipo").asString == "assign") {

                            val publicada =
                                tarea.get("visible").asInt == 1

                            Card(
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(
                                    modifier = Modifier.padding(12.dp)
                                ) {
                                    Text(tarea.get("nombre").asString)

                                    Text(
                                        if (publicada) "Visible"
                                        else "Oculta",
                                        color = TextMuted
                                    )

                                    if (
                                        permisos?.get(
                                            "puedeCambiarVisibilidad"
                                        )?.asBoolean == true
                                    ) {
                                        TextButton(
                                            enabled = !ocupado,
                                            onClick = {
                                                actividad = tarea
                                                error = ""
                                            }
                                        ) {
                                            Text(
                                                if (publicada)
                                                    "Ocultar"
                                                else "Publicar",
                                                color = BrightBlue
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                if (ocupado) {
                    LinearProgressIndicator(
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                if (mensaje.isNotBlank()) {
                    Text(mensaje, color = BrightBlue)
                }

                if (error.isNotBlank()) {
                    Text(
                        error,
                        color = MaterialTheme.colorScheme.error
                    )
                }
            }
        },
        confirmButton = {
            TextButton(
                enabled = !ocupado,
                onClick = onClose
            ) {
                Text("Cerrar", color = BrightBlue)
            }
        },
        dismissButton = {
            TextButton(
                enabled = !ocupado,
                onClick = {
                    error = ""
                    scope.launch { actualizar() }
                }
            ) {
                Text("Actualizar")
            }
        }
    )

    seccion?.let { numero ->

        AlertDialog(
            containerColor = CardBackground,
            onDismissRequest = {
                if (!ocupado) seccion = null
            },
            title = {
                Text("Nueva asignación", color = BrightBlue)
            },
            text = {
                Column(
                    modifier = Modifier
                        .heightIn(max = 450.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {

                    CampoDocente("Nombre", nombre) { nombre = it }
                    CampoDocente("Instrucciones", descripcion) {
                        descripcion = it
                    }

                    Text(
                        "Fechas: dd/MM/yyyy HH:mm",
                        color = TextMuted
                    )

                    CampoDocente("Fecha límite", fecha) { fecha = it }
                    CampoDocente("Fecha de cierre", cierre) { cierre = it }
                    CampoDocente("Calificación máxima", nota) { nota = it }
                    CampoDocente("Cantidad de PDF", archivos) { archivos = it }
                    CampoDocente("MB por archivo", mb) { mb = it }

                    Row {
                        Checkbox(
                            checked = visible,
                            enabled = !ocupado,
                            onCheckedChange = { visible = it }
                        )
                        Text("Publicar inmediatamente")
                    }

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

                        fun convertir(texto: String): Long? =
                            runCatching {
                                val formato = SimpleDateFormat(
                                    "dd/MM/yyyy HH:mm",
                                    Locale.getDefault()
                                )
                                formato.isLenient = false
                                formato.parse(texto)?.time?.div(1000)
                            }.getOrNull()

                        val limite = convertir(fecha)
                        val final = convertir(cierre)
                        val calificacion = nota.toIntOrNull()
                        val cantidad = archivos.toIntOrNull()
                        val peso = mb.toIntOrNull()
                        val ahora = System.currentTimeMillis() / 1000

                        if (
                            nombre.isBlank() ||
                            nombre.length > 200 ||
                            descripcion.length > 10000 ||
                            limite == null ||
                            final == null ||
                            limite <= ahora ||
                            final < limite ||
                            calificacion == null ||
                            calificacion !in 1..100 ||
                            cantidad == null ||
                            cantidad !in 1..10 ||
                            peso == null ||
                            peso !in 1..20
                        ) {
                            error = "Revisa los campos, fechas y límites"
                        } else {
                            ocupado = true
                            error = ""

                            val cuerpo = JsonObject().apply {
                                addProperty("section", numero)
                                addProperty("name", nombre.trim())
                                addProperty("description", descripcion)
                                addProperty("availablefrom", ahora)
                                addProperty("duedate", limite)
                                addProperty("cutoffdate", final)
                                addProperty("grade", calificacion)
                                addProperty("maxfiles", cantidad)
                                addProperty("maxbytes", peso * 1048576)
                                addProperty("visible", visible)
                            }

                            scope.launch {
                                try {
                                    repository.crearGestion(
                                        "api/auth/teacher/courses/$courseId/assignments",
                                        cuerpo
                                    ).onSuccess {
                                        seccion = null
                                        mensaje = "Asignación creada"
                                    }.onFailure {
                                        error = it.message
                                            ?: "Creación no confirmada"
                                    }
                                } finally {
                                    actualizar()
                                }
                            }
                        }
                    }
                ) {
                    Text("Crear")
                }
            },
            dismissButton = {
                TextButton(
                    enabled = !ocupado,
                    onClick = { seccion = null }
                ) {
                    Text("Cancelar")
                }
            }
        )
    }

    actividad?.let { tarea ->

        val publicar = tarea.get("visible").asInt != 1

        AlertDialog(
            containerColor = CardBackground,
            onDismissRequest = {
                if (!ocupado) actividad = null
            },
            title = {
                Text(
                    if (publicar) "Publicar actividad"
                    else "Ocultar actividad",
                    color = BrightBlue
                )
            },
            text = {
                Text(
                    "¿Confirmas el cambio de visibilidad de " +
                    tarea.get("nombre").asString + "?"
                )
            },
            confirmButton = {
                Button(
                    enabled = !ocupado,
                    onClick = {
                        ocupado = true
                        error = ""

                        val id = tarea.get("id").asLong

                        val cuerpo = JsonObject().apply {
                            addProperty("visible", publicar)
                        }

                        scope.launch {
                            try {
                                repository.actualizarGestion(
                                    "api/auth/teacher/courses/$courseId/modules/$id/visibility",
                                    cuerpo
                                ).onSuccess {
                                    mensaje = "Visibilidad actualizada"
                                }.onFailure {
                                    error = it.message
                                        ?: "Cambio no confirmado"
                                }
                            } finally {
                                actividad = null
                                actualizar()
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
                    onClick = { actividad = null }
                ) {
                    Text("Cancelar")
                }
            }
        )
    }
}

@Composable
private fun CampoDocente(
    etiqueta: String,
    valor: String,
    cambio: (String) -> Unit
) {
    OutlinedTextField(
        value = valor,
        onValueChange = cambio,
        label = { Text(etiqueta) },
        modifier = Modifier.fillMaxWidth()
    )
}
