package com.example.iinicia.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.iinicia.data.IiniciaRepository
import com.example.iinicia.ui.components.InstitutionalHeader
import com.example.iinicia.ui.theme.*
import com.example.iinicia.viewmodel.AuthViewModel
import com.example.iinicia.viewmodel.DashboardViewModel
import java.text.DateFormat
import java.util.Date

private data class ActividadProxima(
    val cursoId: String,
    val curso: String,
    val nombre: String,
    val fecha: Long
)

@Composable
fun DashboardScreen(
    dashboardViewModel: DashboardViewModel,
    authViewModel: AuthViewModel,
    onCourseClick: (String) -> Unit,
    onProfileClick: () -> Unit,
    onNotificationsClick: () -> Unit,
    onMoodleSsoClick: () -> Unit
) {
    val user by dashboardViewModel.user.collectAsState()
    val courses by dashboardViewModel.courses.collectAsState()
    val isLoading by dashboardViewModel.isLoading.collectAsState()

    val context = LocalContext.current
    val repository = remember {
        IiniciaRepository(context.applicationContext)
    }

    var roles by remember(user.id) {
        mutableStateOf<List<String>>(emptyList())
    }

    var mostrarGestion by remember { mutableStateOf(false) }
    var identidadCargando by remember { mutableStateOf(true) }
    var errorIdentidad by remember { mutableStateOf("") }

    var actividades by remember {
        mutableStateOf<List<ActividadProxima>>(emptyList())
    }

    var cargandoActividades by remember { mutableStateOf(false) }
    var errorActividades by remember { mutableStateOf(false) }

    LaunchedEffect(user.id) {
        identidadCargando = true
        roles = emptyList()

        repository.identidadReal().onSuccess {
            roles = it.getAsJsonObject("usuario")
                ?.getAsJsonArray("roles")
                ?.mapNotNull { rol ->
                    if (rol.isJsonPrimitive) rol.asString
                    else null
                } ?: emptyList()
        }.onFailure {
            errorIdentidad = "No se pudieron verificar los permisos."
        }

        identidadCargando = false
    }

    val permisos = roles.map {
        it.lowercase()
            .replace("_", "")
            .replace("-", "")
            .replace(" ", "")
    }

    val esAdmin = permisos.any {
        it in listOf("superadmin", "superadministrador")
    }

    val esAcademico = permisos.any {
        it in listOf("adminacademico", "administradoracademico")
    }

    val esTecnico = permisos.any {
        it in listOf("admintecnico", "administradortecnico")
    }

    val esProfesor = permisos.contains("profesor")
    val esEstudiante = permisos.contains("estudiante")
    val esCoordinador = permisos.contains("coordinador")
    val esAspirante = permisos.contains("aspirante")
    val esSoporte = permisos.contains("soporte")

    val titulo = when {
        esAdmin -> "Administración general"
        esAcademico -> "Administración académica"
        esTecnico -> "Administración técnica"
        esCoordinador -> "Coordinación académica"
        esProfesor -> "Portal docente"
        esEstudiante -> "Portal estudiantil"
        esAspirante -> "Portal de admisiones"
        esSoporte -> "Centro de soporte"
        else -> "Mi IINICIA"
    }

    LaunchedEffect(user.id, roles, courses) {
        actividades = emptyList()
        errorActividades = false

        if (esEstudiante && !esAdmin) {
            cargandoActividades = true
            val resultado = mutableListOf<ActividadProxima>()
            val ahora = System.currentTimeMillis() / 1000

            for (curso in courses) {
                repository.consultarGestion(
                    "api/auth/courses/${curso.id}/assignments"
                ).onSuccess { respuesta ->

                    respuesta.getAsJsonArray("tareas")?.forEach {
                        val tarea = it.asJsonObject

                        val fecha = tarea.get("fechaLimite")
                            ?.takeUnless { valor -> valor.isJsonNull }
                            ?.asLong ?: 0L

                        if (fecha > ahora) {
                            resultado.add(
                                ActividadProxima(
                                    curso.id,
                                    curso.title,
                                    tarea.get("nombre").asString,
                                    fecha
                                )
                            )
                        }
                    }
                }.onFailure {
                    errorActividades = true
                }
            }

            actividades = resultado.sortedBy { it.fecha }
            cargandoActividades = false
        }
    }


    var cursoGestion by remember(user.id) {
        mutableStateOf<Long?>(null)
    }

    cursoGestion?.let { id ->
        TeacherCourseManagement(
            courseId = id,
            onClose = { cursoGestion = null }
        )
    }

    if (mostrarGestion) {
        RoleManagementScreen(
            onClose = { mostrarGestion = false }
        )
    }

    Scaffold(
        containerColor = DarkBackground,
        topBar = {
            InstitutionalHeader(
                userName = user.name,
                onProfileClick = onProfileClick,
                onMoodleSsoClick = {
                    mostrarGestion = true
                }
            )
        },
        bottomBar = {
            NavigationBar(containerColor = CardBackgroundDark) {

                NavigationBarItem(
                    selected = !mostrarGestion,
                    onClick = { mostrarGestion = false },
                    icon = {
                        Icon(Icons.Default.Home, null)
                    },
                    label = { Text("Inicio") }
                )

                NavigationBarItem(
                    selected = mostrarGestion,
                    onClick = { mostrarGestion = true },
                    icon = {
                        Icon(Icons.Default.Search, null)
                    },
                    label = { Text("Gestión") }
                )

                NavigationBarItem(
                    selected = false,
                    onClick = onProfileClick,
                    icon = {
                        Icon(Icons.Default.Person, null)
                    },
                    label = { Text("Mi IINICIA") }
                )
            }
        }
    ) { padding ->

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {

            item {
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = CardBackgroundDark
                    ),
                    shape = RoundedCornerShape(18.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp),
                        verticalArrangement =
                            Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            titulo,
                            color = CyanAccent,
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold
                        )

                        Text(
                            user.name,
                            color = TextWhite,
                            fontSize = 17.sp
                        )

                        Text(user.email, color = TextMuted)

                        Text(
                            "Roles: ${roles.joinToString(", ")}",
                            color = TextMuted
                        )

                        if (identidadCargando) {
                            LinearProgressIndicator(
                                modifier = Modifier.fillMaxWidth()
                            )
                        }

                        if (errorIdentidad.isNotBlank()) {
                            Text(
                                errorIdentidad,
                                color = MaterialTheme.colorScheme.error
                            )
                        }
                    }
                }
            }

            if (roles.isNotEmpty()) {

                item {
                    Text(
                        "Servicios disponibles",
                        color = TextWhite,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                if (esAdmin) {
                    item {
                        TarjetaPortal(
                            "Administración institucional",
                            "Resumen, usuarios y servicios"
                        ) { mostrarGestion = true }
                    }
                }

                if (esAdmin || esTecnico) {
                    item {
                        TarjetaPortal(
                            "Diagnóstico técnico",
                            "Estado de los servicios de IINICIA"
                        ) { mostrarGestion = true }
                    }
                }

                if (esAdmin || esAcademico || esCoordinador) {
                    item {
                        TarjetaPortal(
                            "Gestión académica",
                            "Cursos y categorías autorizadas"
                        ) { mostrarGestion = true }
                    }
                }

                if (esAdmin || esAcademico) {
                    item {
                        TarjetaPortal(
                            "Admisiones y matrículas",
                            "Solicitudes, programas y cohortes"
                        ) { mostrarGestion = true }
                    }
                }

                if (esProfesor) {
                    item {
                        TarjetaPortal(
                            "Portal docente",
                            "Cursos y actividades asignadas"
                        ) { mostrarGestion = true }
                    }
                }

                if (esAspirante) {
                    item {
                        TarjetaPortal(
                            "Mis solicitudes",
                            "Seguimiento de admisión"
                        ) { mostrarGestion = true }
                    }
                }

                if (esAdmin || esSoporte) {
                    item {
                        TarjetaPortal(
                            "Atención de tickets",
                            "Revisión y resolución de incidencias"
                        ) { mostrarGestion = true }
                    }
                }

                item {
                    TarjetaPortal(
                        "Soporte",
                        "Consultar o registrar una incidencia"
                    ) { mostrarGestion = true }
                }
            }

            if (esEstudiante && !esAdmin) {

                item {
                    Text(
                        "Próximas actividades",
                        color = TextWhite,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                if (cargandoActividades) {
                    item {
                        LinearProgressIndicator(
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }

                if (errorActividades) {
                    item {
                        Text(
                            "No se pudieron consultar todas las actividades.",
                            color = TextMuted
                        )
                    }
                }

                if (
                    actividades.isEmpty() &&
                    !cargandoActividades &&
                    !errorActividades
                ) {
                    item {
                        Text(
                            "No hay próximas entregas registradas.",
                            color = TextMuted
                        )
                    }
                }

                items(actividades.take(10)) { actividad ->
                    TarjetaPortal(
                        actividad.nombre,
                        actividad.curso + "\nVence: " +
                            DateFormat.getDateTimeInstance().format(
                                Date(actividad.fecha * 1000)
                            )
                    ) {
                        onCourseClick(actividad.cursoId)
                    }
                }
            }

            if (esProfesor || esEstudiante) {

                item {
                    Text(
                        "Cursos autorizados (${courses.size})",
                        color = TextWhite,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                if (isLoading) {
                    item {
                        LinearProgressIndicator(
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }

                if (courses.isEmpty() && !isLoading) {
                    item {
                        Text(
                            "No hay cursos asignados.",
                            color = TextMuted
                        )
                    }
                }

                items(courses) { curso ->
                    TarjetaPortal(
                        curso.title,
                        curso.description.ifBlank {
                            "Curso de Moodle"
                        }
                    ) {
                        onCourseClick(curso.id)
                    }

                    if (esProfesor || esAdmin) {
                        OutlinedButton(
                            modifier = Modifier.fillMaxWidth(),
                            onClick = {
                                cursoGestion = curso.id.toLongOrNull()
                            }
                        ) {
                            Text(
                                "Gestionar actividades",
                                color = CyanAccent
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TarjetaPortal(
    titulo: String,
    descripcion: String,
    onClick: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = CardBackgroundDark
        ),
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                titulo,
                color = CyanAccent,
                fontWeight = FontWeight.Bold,
                fontSize = 17.sp
            )

            Text(descripcion, color = TextMuted)

            OutlinedButton(
                onClick = onClick,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Abrir", color = CyanAccent)
            }
        }
    }
}
