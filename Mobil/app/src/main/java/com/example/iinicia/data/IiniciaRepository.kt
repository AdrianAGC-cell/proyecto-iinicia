package com.example.iinicia.data

import android.content.Context
import android.util.Patterns
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

class IiniciaRepository(context: Context) {
    private val tokenManager = SecureTokenManager(context)
    
    private val client = OkHttpClient.Builder()
        .addInterceptor(AuthInterceptor(tokenManager))
        .addInterceptor(HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.NONE
        })
        .connectTimeout(8, TimeUnit.SECONDS)
        .readTimeout(8, TimeUnit.SECONDS)
        .build()

    private val retrofit = Retrofit.Builder()
        .baseUrl("https://api.iinicia.org/")
        .client(client)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    private val api = retrofit.create(IiniciaApi::class.java)

    // En el emulador Android, 10.0.2.2 apunta a la computadora anfitriona.
    private val moodleClient = OkHttpClient.Builder()
        .cookieJar(MoodleSessionCookies)
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    private val moodleRetrofit = Retrofit.Builder()
        .baseUrl("http://127.0.0.1:5000/")
        .client(moodleClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    private val moodleApi = moodleRetrofit.create(IiniciaApi::class.java)


    private val supabaseRetrofit = Retrofit.Builder()
        .baseUrl(SupabaseClient.SUPABASE_URL + "/")
        .client(client)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    private val supabaseApi = supabaseRetrofit.create(IiniciaApi::class.java)

    companion object {
        var currentUser: UserDto? = null
    }

    val demoUser = UserDto(
        id = "a0000000-0000-0000-0000-000000000001",
        name = "Valeria Morales Santillán",
        email = "valeria.morales@iinicia.edu.mx",
        role = "Estudiante",
        moodleId = "IIN-2024-8842",
        programName = "Licenciatura en Inteligencia Artificial y Ciencia de Datos"
    )

    val demoCourses = listOf(
        CourseDto(
            id = "c-01",
            title = "Redes Neuronales y Deep Learning con PyTorch",
            description = "Fundamentos avanzados de arquitectura de sistemas, cloud computing y desarrollo moderno en plataformas móviles y web.",
            progress = 0.78f,
            instructor = "Dr. Alejandro Méndez Vargas",
            semester = "Semestre 4",
            tasks = listOf(
                MoodleTaskDto("T-1", "c-01", "Entrega Práctica: Modelos Convolucionales", "28 Oct 2026", "Pendiente"),
                MoodleTaskDto("T-2", "c-01", "Cuestionario de Optimización con PyTorch", "30 Oct 2026", "Completado", "95/100")
            )
        ),
        CourseDto(
            id = "c-02",
            title = "Cloud Computing & MLOps con Docker y Kubernetes",
            description = "Estrategias de microservicios distribuidos, contenedores Docker y orquestación con Kubernetes.",
            progress = 0.64f,
            instructor = "Mtra. Elena Saldaña",
            semester = "Semestre 4",
            tasks = listOf(
                MoodleTaskDto("T-3", "c-02", "Deploy de Pods con Autoscaling en GCP", "29 Oct 2026", "Pendiente"),
                MoodleTaskDto("T-4", "c-02", "Foro de Discusión: Service Meshes Istio", "31 Oct 2026", "En curso")
            )
        ),
        CourseDto(
            id = "c-03",
            title = "Machine Learning II: Algoritmos No Supervisados",
            description = "Técnicas avanzadas de clustering, reducción de dimensionalidad con t-SNE y PCA, y modelos generativos.",
            progress = 0.85f,
            instructor = "Dr. Fernando Quiroz",
            semester = "Semestre 4",
            tasks = listOf(
                MoodleTaskDto("T-5", "c-03", "Proyecto: Segmentación de Clientes con K-Means", "02 Nov 2026", "Pendiente")
            )
        ),
        CourseDto(
            id = "c-04",
            title = "Optimización Numérica y Algoritmos Genéticos",
            description = "Algoritmos evolutivos, descenso de gradiente estocástico y optimización bayesiana de hiperparámetros.",
            progress = 0.70f,
            instructor = "Dra. Carmen Villalobos",
            semester = "Semestre 4",
            tasks = listOf(
                MoodleTaskDto("T-6", "c-04", "Laboratorio 4: Algoritmos Genéticos en Python", "05 Nov 2026", "En curso")
            )
        )
    )

    val demoNotifications = listOf(
        NotificationDto(
            id = "d717decd-5389-43c2-b1b3-2d75d5c3d4b2",
            title = "Próxima Entrega: Redes Neuronales",
            message = "Tu laboratorio práctico de PyTorch vence el 24 de Octubre a las 23:59 hrs.",
            timestamp = "Hace 15 min",
            type = "academic"
        ),
        NotificationDto(
            id = "6dad8859-213d-4b56-aa45-47b429f21bc7",
            title = "Bienvenido al Campus Virtual IINICIA",
            message = "Tu cuenta institucional ha sido vinculada exitosamente con Moodle LMS.",
            timestamp = "Hace 1 hora",
            type = "sso"
        )
    )

    suspend fun login(email: String, pass: String): Result<LoginResponse> {

        val identificador = email.trim()

        if (identificador.isBlank() || pass.isBlank()) {
            return Result.failure(
                Exception("Ingresa tu usuario y contraseña")
            )
        }

        val tipo = when {
            identificador.contains("@") -> "correo"
            identificador.startsWith("IIN-", ignoreCase = true) -> "matricula"
            else -> "usuario"
        }

        MoodleSessionCookies.clear()
        tokenManager.clear()

        // 1. Intentar inicio de sesión real con Moodle (mantener 100% intacto)
        try {
            val response = moodleApi.moodleLogin(
                MoodleLoginRequest(
                    identificador = identificador,
                    password = pass,
                    tipo = tipo
                )
            )

            val datos = response.body()

            if (response.isSuccessful && datos?.success == true && datos.usuario != null) {
                val usuario = datos.usuario
                val user = UserDto(
                    id = usuario.id.toString(),
                    name = usuario.nombre,
                    email = usuario.email?.ifBlank { if (tipo == "correo") identificador else "" } ?: (if (tipo == "correo") identificador else ""),
                    role = "Estudiante",
                    moodleId = usuario.matricula?.ifBlank { usuario.id.toString() } ?: usuario.id.toString()
                )
                currentUser = user
                return Result.success(
                    LoginResponse(
                        token = "",
                        user = user
                    )
                )
            }
        } catch (_: Exception) {
            // Moodle offline o sin servidor local disponible en este momento
        }

        return Result.failure(
            Exception("No se pudo autenticar en Moodle. Verifica tus credenciales y la conexion.")
        )
    }

    suspend fun getProfile(): Result<UserDto> {
        currentUser?.let { return Result.success(it) }
        return try {
            val response = moodleApi.moodleProfile()
            val datos = response.body()
            val usuario = datos?.usuario

            if (response.isSuccessful &&
                datos?.success == true &&
                usuario != null
            ) {
                val u = UserDto(
                    id = usuario.id.toString(),
                    name = usuario.nombre,
                    email = usuario.email ?: "",
                    role = "Estudiante",
                    moodleId = usuario.matricula?.ifBlank { usuario.id.toString() } ?: usuario.id.toString()
                )
                currentUser = u
                Result.success(u)
            } else {
                Result.failure(Exception("No hay sesión activa"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun cerrarSesionMoodle() {
        currentUser = null
        try {
            val response = moodleApi.moodleLogout()
            if (!response.isSuccessful) {
                throw Exception("No se pudo cerrar la sesión en el servidor")
            }
        } finally {
            MoodleSessionCookies.clear()
            tokenManager.clear()
        }
    }

    suspend fun descargarPdf(
        courseId: Long,
        moduleId: Long,
        destino: java.io.File
    ): Result<java.io.File> =
        kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
            try {
                // Limpiar archivos temporales antiguos en la carpeta de destino
                destino.parentFile?.let { dir ->
                    if (dir.exists()) {
                        dir.listFiles()?.forEach { file ->
                            if (file.isFile && file.name != destino.name && file.name.endsWith(".pdf")) {
                                file.delete()
                            }
                        }
                    }
                }

                val response = moodleApi.descargarPdf(
                    courseId,
                    moduleId
                )

                val body = response.body()

                if (!response.isSuccessful || body == null) {
                    response.errorBody()?.close()
                    body?.close()
                    throw Exception("No se pudo descargar el PDF")
                }

                body.use { pdf ->
                    if (pdf.contentType()?.subtype != "pdf") {
                        throw Exception("El archivo no es un PDF")
                    }

                    pdf.byteStream().use { input ->
                        destino.outputStream().use { output ->
                            input.copyTo(output)
                        }
                    }
                }

                Result.success(destino)

            } catch (e: kotlinx.coroutines.CancellationException) {
                destino.delete()
                throw e
            } catch (e: Exception) {
                destino.delete()
                Result.failure(e)
            }
        }

    suspend fun getCourses(): Result<List<CourseDto>> {
        return try {
            val perfil = moodleApi.moodleProfile()

            if (!perfil.isSuccessful ||
                perfil.body()?.success != true
            ) {
                return Result.failure(
                    Exception("No hay una sesión activa")
                )
            }

            val response = moodleApi.getMoodleCourses()
            val payload = response.body()

            if (response.isSuccessful &&
                payload?.conectado == true
            ) {
                val cursos = payload.cursos
                    .filter { it.visible == 1 }
                    .map { curso ->
                        CourseDto(
                            id = curso.id.toString(),
                            title = curso.nombre,
                            description = curso.resumen
                                .replace(Regex("<[^>]*>"), " ")
                                .trim(),
                            progress = (curso.progress ?: 0f) / 100f,
                            instructor = "Curso de Moodle",
                            semester = curso.nombreCorto.trim(),
                            tasks = emptyList()
                        )
                    }

                Result.success(cursos)
            } else {
                Result.failure(
                    Exception("No se pudieron obtener los cursos de Moodle")
                )
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getCourseDetail(courseId: String): Result<CourseDto> {
        val baseCourse = getCourses().getOrNull()?.find { it.id == courseId }
        val cidLong = courseId.toLongOrNull()
        if (baseCourse != null && cidLong != null) {
            return try {
                val response = moodleApi.getMoodleCourseContents(cidLong)
                val payload = response.body()
                if (response.isSuccessful && payload?.conectado == true) {
                    // Consultar calificaciones reales de Moodle
                    val gradesMap = mutableMapOf<String, String>()
                    try {
                        val gradesResponse = moodleApi.getMoodleCourseGrades(cidLong)
                        val gradesBody = gradesResponse.body()
                        if (gradesResponse.isSuccessful && gradesBody?.success == true) {
                            gradesBody.usergrades.firstOrNull()?.gradeitems?.forEach { item ->
                                val name = item.itemname?.trim()?.lowercase()
                                val gradeText = item.gradeformatted?.trim()
                                if (!name.isNullOrBlank() && !gradeText.isNullOrBlank() && gradeText != "-") {
                                    gradesMap[name] = gradeText
                                }
                            }
                        }
                    } catch (_: Exception) {}

                    val tasks = payload.secciones.flatMap { seccion ->
                        seccion.actividades.map { actividad ->
                            val activityName = actividad.nombre.trim().lowercase()
                            val matchedGrade = gradesMap[activityName]
                            MoodleTaskDto(
                                id = actividad.id.toString(),
                                courseId = courseId,
                                title = actividad.nombre,
                                dueDate = actividad.tipo,
                                status = if (actividad.visible == 1) "Disponible" else "Oculta",
                                grade = matchedGrade,
                                sectionName = seccion.nombre
                            )
                        }
                    }
                    Result.success(baseCourse.copy(tasks = tasks))
                } else {
                    Result.success(baseCourse)
                }
            } catch (_: Exception) {
                Result.success(baseCourse)
            }
        }

        return Result.failure(
            Exception("No se encontro el curso solicitado")
        )
    }

    suspend fun getNotifications(): Result<List<NotificationDto>> {
        return try {
            val response = supabaseApi.getNotificationsSupabase(
                apiKey = SupabaseClient.SUPABASE_KEY,
                auth = "Bearer ${tokenManager.getToken() ?: SupabaseClient.SUPABASE_KEY}"
            )
            if (response.isSuccessful && !response.body().isNullOrEmpty()) {
                return Result.success(response.body()!!)
            }
            Result.success(demoNotifications)
        } catch (e: Exception) {
            Result.success(demoNotifications)
        }
    }

    fun logout() {
        tokenManager.clear()
    }

    fun getTokenManager() = tokenManager
}
