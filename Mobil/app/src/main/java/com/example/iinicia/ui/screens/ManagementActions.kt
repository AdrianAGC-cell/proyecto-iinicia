package com.example.iinicia.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.iinicia.data.IiniciaRepository
import com.example.iinicia.ui.theme.*
import com.google.gson.JsonElement
import com.google.gson.JsonObject
import kotlinx.coroutines.launch

private data class CampoGestion(
    val clave: String,
    val etiqueta: String,
    val numerico: Boolean = false,
    val inicial: String = "",
    val opciones: List<String> = emptyList(),
    val requerido: Boolean = true
)

private data class AccionGestion(
    val titulo: String,
    val ruta: String,
    val metodo: String,
    val campos: List<CampoGestion>
)

@Composable
fun ManagementActions(
    ruta: String,
    roles: List<String>,
    datos: JsonElement?,
    repository: IiniciaRepository,
    onSaved: () -> Unit
) {
    val scope = rememberCoroutineScope()

    var accion by remember {
        mutableStateOf<AccionGestion?>(null)
    }

    var valores by remember {
        mutableStateOf<Map<String, String>>(emptyMap())
    }

    var ocupado by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf("") }
    var mensaje by remember { mutableStateOf("") }

    val superadmin = roles.any {
        it in listOf("superadmin", "superadministrador")
    }

    val academico = superadmin || roles.any {
        it in listOf("adminacademico", "administradoracademico")
    }

    val coordinador = roles.contains("coordinador")
    val soporte = superadmin || roles.contains("soporte")


    if (
        ruta == "api/auth/admisiones/mis-solicitudes" &&
        roles.contains("aspirante")
    ) {
        AdmissionForm(
            repository = repository,
            onSaved = onSaved
        )
    }

    val acciones = mutableListOf<AccionGestion>()

    fun agregar(
        titulo: String,
        destino: String,
        metodo: String = "POST",
        vararg campos: CampoGestion
    ) {
        acciones.add(
            AccionGestion(
                titulo, destino, metodo, campos.toList()
            )
        )
    }

    val registros = if (datos?.isJsonArray == true) {
        datos.asJsonArray.filter { it.isJsonObject }
            .map { it.asJsonObject }
    } else {
        emptyList()
    }

    fun valor(obj: JsonObject, clave: String): String =
        obj.get(clave)?.takeIf { it.isJsonPrimitive }
            ?.asString.orEmpty()

    when (ruta) {

        "api/auth/admin/cursos" -> {

            if (academico) {
                agregar(
                    "Crear curso",
                    ruta,
                    "POST",
                    CampoGestion("nombre", "Nombre del curso"),
                    CampoGestion("clave", "Nombre corto"),
                    CampoGestion("categoria", "ID de categoría", true)
                )
            }

            registros.forEach { curso ->
                val id = valor(curso, "id")
                val nombre = valor(curso, "nombre")

                if (id.toLongOrNull() != null) {

                    if (academico || coordinador) {
                        agregar(
                            "Renombrar $nombre",
                            "$ruta/$id",
                            "PATCH",
                            CampoGestion(
                                "nombre", "Nuevo nombre",
                                inicial = nombre
                            )
                        )
                    }

                    if (academico) {
                        agregar(
                            "Matricular estudiante en $nombre",
                            "$ruta/$id/matriculas",
                            "POST",
                            CampoGestion(
                                "usuarioId",
                                "ID del usuario Moodle",
                                true
                            )
                        )
                    }
                }
            }
        }

        "api/auth/admin/cohortes" -> {

            if (academico) {
                agregar(
                    "Crear cohorte",
                    ruta,
                    "POST",
                    CampoGestion("nombre", "Nombre"),
                    CampoGestion("clave", "Identificador")
                )

                registros.forEach { cohorte ->
                    val id = valor(cohorte, "id")
                    val nombre = valor(cohorte, "nombre")

                    if (id.toLongOrNull() != null) {
                        agregar(
                            "Agregar integrante a $nombre",
                            "$ruta/$id/integrantes",
                            "POST",
                            CampoGestion(
                                "usuarioId",
                                "ID del usuario Moodle",
                                true
                            )
                        )
                    }
                }
            }
        }

        "api/auth/admin/programas-cursos" -> {
            if (academico) {
                agregar(
                    "Vincular programa con curso",
                    ruta,
                    "POST",
                    CampoGestion("programaId", "ID del programa"),
                    CampoGestion("cursoId", "ID del curso Moodle", true)
                )
            }
        }

        "api/auth/soporte/mis-tickets" -> {
            agregar(
                "Crear ticket de soporte",
                ruta,
                "POST",
                CampoGestion("asunto", "Asunto"),
                CampoGestion("descripcion", "Describe el problema"),
                CampoGestion(
                    "categoria", "Categoría",
                    inicial = "ACCESO",
                    opciones = listOf(
                        "ACCESO", "MOODLE", "PLATAFORMA", "OTRO"
                    )
                )
            )
        }

        "api/auth/soporte/tickets" -> {

            if (soporte) {
                registros.forEach { ticket ->

                    val id = valor(ticket, "id")
                    val asunto = valor(ticket, "subject")
                    val estado = valor(ticket, "status")

                    val siguiente = when (estado) {
                        "ABIERTO" -> "EN PROCESO"
                        "EN PROCESO" -> "RESUELTO"
                        "RESUELTO" -> "CERRADO"
                        else -> ""
                    }

                    if (id.isNotBlank() && siguiente.isNotBlank()) {
                        agregar(
                            "$siguiente: $asunto",
                            "$ruta/$id",
                            "PATCH",
                            CampoGestion(
                                "estado", "Nuevo estado",
                                inicial = siguiente,
                                opciones = listOf(siguiente)
                            ),
                            CampoGestion(
                                "prioridad", "Prioridad",
                                inicial = valor(ticket, "priority")
                                    .ifBlank { "MEDIA" },
                                opciones = listOf("BAJA", "MEDIA", "ALTA")
                            ),
                            CampoGestion(
                                "resolucion", "Resolución",
                                inicial = valor(ticket, "resolution"),
                                requerido = siguiente == "RESUELTO"
                            )
                        )
                    }
                }
            }
        }

        "api/auth/admisiones/admin/solicitudes" -> {

            if (academico) {
                registros.forEach { solicitud ->
                    val id = valor(solicitud, "id")
                    val estado = valor(solicitud, "status")
                        .ifBlank { valor(solicitud, "estado") }

                    if (id.isNotBlank()) {
                        agregar(
                            "Revisar solicitud $id",
                            "$ruta/$id",
                            "PATCH",
                            CampoGestion(
                                "estado",
                                "Nuevo estado",
                                inicial = estado,
                                opciones = listOf(
                                    "EN REVISION",
                                    "ADMITIDO",
                                    "RECHAZADO"
                                )
                            )
                        )

                        if (superadmin && estado == "ADMITIDO") {
                            agregar(
                                "Vincular aspirante con Moodle",
                                "$ruta/$id/vincular"
                            )
                        }
                    }
                }
            }
        }
    }

    if (mensaje.isNotBlank()) {
        Text(mensaje, color = BrightBlue)
    }

    if (acciones.isNotEmpty()) {
        HorizontalDivider()

        Text("Operaciones disponibles", color = BrightBlue)

        acciones.forEach { item ->
            OutlinedButton(
                enabled = !ocupado,
                modifier = Modifier.fillMaxWidth(),
                onClick = {
                    valores = item.campos.associate {
                        it.clave to it.inicial
                    }
                    error = ""
                    mensaje = ""
                    accion = item
                }
            ) {
                Text(item.titulo, color = BrightBlue)
            }
        }
    }

    accion?.let { item ->

        AlertDialog(
            containerColor = CardBackground,
            onDismissRequest = {
                if (!ocupado) accion = null
            },
            title = {
                Text(item.titulo, color = BrightBlue)
            },
            text = {
                Column(
                    modifier = Modifier
                        .heightIn(max = 450.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {

                    item.campos.forEach { campo ->

                        Text(campo.etiqueta, color = BrightBlue)

                        if (campo.opciones.isNotEmpty()) {

                            campo.opciones.forEach { opcion ->
                                FilterChip(
                                    selected = valores[campo.clave] == opcion,
                                    enabled = !ocupado,
                                    onClick = {
                                        valores = valores +
                                            (campo.clave to opcion)
                                    },
                                    label = { Text(opcion) }
                                )
                            }

                        } else {
                            OutlinedTextField(
                                value = valores[campo.clave].orEmpty(),
                                enabled = !ocupado,
                                onValueChange = {
                                    valores = valores +
                                        (campo.clave to it)
                                },
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    }

                    Text(
                        "Los cambios se guardarán en los servicios reales de IINICIA.",
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
                        val cuerpo = JsonObject()
                        error = ""

                        item.campos.forEach { campo ->
                            val valor =
                                valores[campo.clave].orEmpty().trim()

                            if (campo.requerido && valor.isBlank()) {
                                error = "Completa ${campo.etiqueta}"
                            }

                            if (campo.numerico) {
                                val numero = valor.toLongOrNull()

                                if (numero == null || numero <= 0) {
                                    error = "Revisa ${campo.etiqueta}"
                                } else {
                                    cuerpo.addProperty(campo.clave, numero)
                                }
                            } else {
                                cuerpo.addProperty(campo.clave, valor)
                            }
                        }

                        if (error.isBlank()) {
                            ocupado = true

                            scope.launch {
                                try {
                                    val resultado =
                                        if (item.metodo == "PATCH") {
                                            repository.actualizarGestion(
                                                item.ruta, cuerpo
                                            )
                                        } else {
                                            repository.crearGestion(
                                                item.ruta, cuerpo
                                            )
                                        }

                                    resultado.onSuccess {
                                        accion = null
                                        mensaje = "Operación completada"
                                        onSaved()
                                    }.onFailure {
                                        error = it.message
                                            ?: "No se pudo confirmar la operación"
                                    }
                                } finally {
                                    ocupado = false
                                }
                            }
                        }
                    }
                ) {
                    Text("Guardar cambios")
                }
            },
            dismissButton = {
                TextButton(
                    enabled = !ocupado,
                    onClick = { accion = null }
                ) {
                    Text("Cancelar")
                }
            }
        )
    }
}
