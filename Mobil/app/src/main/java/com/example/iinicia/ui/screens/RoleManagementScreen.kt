package com.example.iinicia.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.iinicia.data.IiniciaRepository
import com.example.iinicia.ui.theme.*
import com.google.gson.JsonElement
import com.google.gson.JsonObject
import kotlinx.coroutines.launch

private data class ModuloGestion(
    val titulo: String,
    val ruta: String,
    val clave: String
)

@Composable
fun RoleManagementScreen(
    rutaInicial: String? = null,
    onClose: () -> Unit
) {
    val context = LocalContext.current
    val repository = remember {
        IiniciaRepository(context.applicationContext)
    }
    val scope = rememberCoroutineScope()

    var roles by remember {
        mutableStateOf<List<String>>(emptyList())
    }
    var modulo by remember {
        mutableStateOf<ModuloGestion?>(null)
    }
    var datos by remember {
        mutableStateOf<JsonElement?>(null)
    }
    var cargando by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        repository.identidadReal()
            .onSuccess { respuesta ->
                roles = respuesta.getAsJsonObject("usuario")
                    ?.getAsJsonArray("roles")
                    ?.mapNotNull {
                        if (it.isJsonPrimitive) it.asString
                        else null
                    } ?: emptyList()
            }
            .onFailure {
                error = it.message ?: "No se pudo verificar la identidad"
            }

        cargando = false
    }

    val normalizados = roles.map {
        it.lowercase().replace("_", "").replace("-", "")
            .replace(" ", "")
    }

    fun tiene(vararg opciones: String): Boolean =
        normalizados.any { it in opciones }

    val superadmin = tiene("superadmin", "superadministrador")
    val academico = tiene("adminacademico", "administradoracademico")
    val tecnico = tiene("admintecnico", "administradortecnico")
    val coordinador = tiene("coordinador")
    val soporte = tiene("soporte")
    val profesor = tiene("profesor")
    val estudiante = tiene("estudiante")
    val aspirante = tiene("aspirante")

    val modulos = mutableListOf<ModuloGestion>()

    if (superadmin) {
        modulos.add(ModuloGestion(
            "Resumen administrativo",
            "api/auth/admin/resumen", ""
        ))
    }

    if (superadmin || tecnico) {
        modulos.add(ModuloGestion(
            "Diagnóstico técnico",
            "api/auth/admin/diagnostico", ""
        ))
    }

    if (superadmin || academico || coordinador) {
        modulos.add(ModuloGestion(
            "Gestión de cursos",
            "api/auth/admin/cursos", "cursos"
        ))
        modulos.add(ModuloGestion(
            "Categorías",
            "api/auth/admin/categorias", "categorias"
        ))
    }

    if (superadmin || academico) {
        modulos.add(ModuloGestion(
            "Cohortes",
            "api/auth/admin/cohortes", "cohortes"
        ))
        modulos.add(ModuloGestion(
            "Programas y cursos",
            "api/auth/admin/programas-cursos", ""
        ))
        modulos.add(ModuloGestion(
            "Solicitudes de admisión",
            "api/auth/admisiones/admin/solicitudes",
            "solicitudes"
        ))
    }

    if (superadmin || soporte) {
        modulos.add(ModuloGestion(
            "Tickets de soporte",
            "api/auth/soporte/tickets", "tickets"
        ))
    }

    if (profesor || estudiante) {
        modulos.add(ModuloGestion(
            "Mis cursos",
            "api/auth/courses", "cursos"
        ))
    }

    if (aspirante) {
        modulos.add(ModuloGestion(
            "Mis solicitudes de admisión",
            "api/auth/admisiones/mis-solicitudes",
            "solicitudes"
        ))
    }

    if (roles.isNotEmpty()) {
        modulos.add(ModuloGestion(
            "Mis tickets de soporte",
            "api/auth/soporte/mis-tickets", "tickets"
        ))
    }

    fun consultar(item: ModuloGestion) {
        modulo = item
        datos = null
        error = ""
        cargando = true

        scope.launch {
            repository.consultarGestion(item.ruta)
                .onSuccess { respuesta ->
                    datos = if (item.clave.isBlank()) {
                        respuesta
                    } else {
                        respuesta.get(item.clave) ?: respuesta
                    }
                }
                .onFailure {
                    error = it.message ?: "Servicio no disponible"
                }

            cargando = false
        }
    }


    LaunchedEffect(roles, rutaInicial) {
        if (roles.isNotEmpty() && rutaInicial != null) {
            val destino = modulos.firstOrNull {
                it.ruta == rutaInicial
            }

            if (destino != null) {
                consultar(destino)
            } else {
                error = "No tienes acceso a este módulo"
            }
        }
    }

    AlertDialog(
        onDismissRequest = onClose,
        containerColor = CardBackground,
        title = {
            Text(
                modulo?.titulo ?: "Gestión IINICIA",
                color = BrightBlue,
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 540.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                if (roles.isNotEmpty()) {
                    Text(
                        "Roles: ${roles.joinToString(", ")}",
                        color = BrightBlue
                    )
                }

                if (cargando) {
                    LinearProgressIndicator(
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                if (error.isNotBlank()) {
                    Text(
                        error,
                        color = MaterialTheme.colorScheme.error
                    )
                }

                if (modulo == null) {
                    modulos.forEach { item ->
                        OutlinedButton(
                            enabled = !cargando,
                            onClick = { consultar(item) },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(item.titulo, color = BrightBlue)
                        }
                    }
                } else {
                    datos?.let { GestionDatos(it) }

                    modulo?.let { item ->
                        ManagementActions(
                            ruta = item.ruta,
                            roles = normalizados,
                            datos = datos,
                            repository = repository,
                            onSaved = { consultar(item) }
                        )
                    }

                    TextButton(
                        enabled = !cargando,
                        onClick = {
                            modulo?.let { consultar(it) }
                        }
                    ) {
                        Text("Actualizar", color = BrightBlue)
                    }
                }
            }
        },
        confirmButton = {
            Button(onClick = onClose) {
                Text("Cerrar")
            }
        },
        dismissButton = {
            if (modulo != null) {
                TextButton(onClick = {
                    modulo = null
                    datos = null
                    error = ""
                }) {
                    Text("Volver")
                }
            }
        }
    )
}

@Composable
private fun GestionDatos(datos: JsonElement) {
    when {
        datos.isJsonNull -> {
            Text("Sin información", color = TextMuted)
        }

        datos.isJsonArray -> {
            val lista = datos.asJsonArray

            if (lista.size() == 0) {
                Text("No hay registros", color = TextMuted)
            }

            lista.forEach { elemento ->
                Card(
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        verticalArrangement =
                            Arrangement.spacedBy(5.dp)
                    ) {
                        GestionDatos(elemento)
                    }
                }
            }
        }

        datos.isJsonObject -> {
            datos.asJsonObject.entrySet().forEach { campo ->
                val clave = campo.key

                if (clave in listOf(
                    "nombre", "name", "fullname", "title",
                    "subject", "asunto", "estado", "status",
                    "id", "clave", "categoriaNombre",
                    "description", "descripcion",
                    "priority", "prioridad", "resolution",
                    "email", "visible", "activo",
                    "backend", "moodle", "supabase",
                    "uptime", "latencia", "version",
                    "cursos", "categorias", "cohortes",
                    "tickets", "solicitudes", "programas",
                    "mapeos", "resumen", "total",
                    "usuarios", "estudiantes", "profesores",
                    "full_name", "program_name",
                    "previous_school", "average_grade",
                    "phone", "created_at",
                    "moodle_synced", "iinicia_sync_state",
                    "category", "resolved_at", "updated_at"

                )) {
                    if (campo.value.isJsonPrimitive) {
                        Text(
                            "$clave: ${campo.value.asString}",
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    } else {
                        Text(clave, color = BrightBlue)
                        GestionDatos(campo.value)
                    }
                }
            }
        }

        else -> {
            Text(
                datos.asString,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
    }
}
