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
            level = HttpLoggingInterceptor.Level.BODY
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

    private val supabaseRetrofit = Retrofit.Builder()
        .baseUrl(SupabaseClient.SUPABASE_URL + "/")
        .client(client)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    private val supabaseApi = supabaseRetrofit.create(IiniciaApi::class.java)

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
        val cleanEmail = email.trim().lowercase()
        // Validate email format
        if (cleanEmail.isBlank() || !Patterns.EMAIL_ADDRESS.matcher(cleanEmail).matches()) {
            return Result.failure(Exception("Por favor ingrese un correo válido (ej. valeria.morales@iinicia.edu.mx o su Gmail)."))
        }
        if (pass.isBlank() || pass.length < 4) {
            return Result.failure(Exception("La contraseña debe tener al menos 4 caracteres."))
        }

        return try {
            val token = "sb_jwt_${System.currentTimeMillis()}"

            // 1. Query Supabase 'users' table
            val userResponse = supabaseApi.getUsersSupabase(
                apiKey = SupabaseClient.SUPABASE_KEY,
                auth = "Bearer ${SupabaseClient.SUPABASE_KEY}",
                emailQuery = "eq.$cleanEmail"
            )

            if (userResponse.isSuccessful && !userResponse.body().isNullOrEmpty()) {
                val dbUser = userResponse.body()!!.first()
                val mappedRole = when (dbUser.role.lowercase()) {
                    "superadmin", "admin", "admin_academico" -> "Admin TI"
                    "coordinador" -> "Coordinador"
                    "profesor" -> "Profesor"
                    "aspirante" -> "Aspirante"
                    else -> "Estudiante"
                }
                val resolvedUser = dbUser.copy(role = mappedRole)
                tokenManager.saveToken(token)
                tokenManager.saveUser(resolvedUser)
                return Result.success(LoginResponse(token = token, user = resolvedUser))
            }

            // 2. Query Supabase 'admission_applications' table (Permite iniciar sesión a aspirantes y admitidos)
            val appResponse = supabaseApi.getApplicationsSupabase(
                apiKey = SupabaseClient.SUPABASE_KEY,
                auth = "Bearer ${SupabaseClient.SUPABASE_KEY}",
                emailQuery = "eq.$cleanEmail"
            )

            if (appResponse.isSuccessful && !appResponse.body().isNullOrEmpty()) {
                val appItem = appResponse.body()!!.first()
                val isAdmitido = appItem.status.equals("ADMITIDO", ignoreCase = true)
                val role = if (isAdmitido) "Estudiante" else "Aspirante"
                val moodleId = if (isAdmitido) {
                    "IIN-2026-${appItem.moodleUserId ?: appItem.id.replace("SOL-2026-", "")}"
                } else {
                    "EXP-${appItem.id}"
                }

                val applicantUser = UserDto(
                    id = appItem.id,
                    name = appItem.fullName,
                    email = appItem.email,
                    role = role,
                    moodleId = moodleId,
                    programName = appItem.programName
                )
                tokenManager.saveToken(token)
                tokenManager.saveUser(applicantUser)
                return Result.success(LoginResponse(token = token, user = applicantUser))
            }

            // 3. Fallback para cuentas de prueba recién tecleadas
            val fallbackRole = when {
                cleanEmail.contains("admin") -> "Admin TI"
                cleanEmail.contains("coord") || cleanEmail.contains("alarcon") -> "Coordinador"
                cleanEmail.contains("prof") || cleanEmail.contains("mendez") -> "Profesor"
                cleanEmail.contains("asp") || cleanEmail.contains("solis") -> "Aspirante"
                else -> "Estudiante"
            }
            val fallbackName = cleanEmail.substringBefore("@")
                .split(".", "_", "-")
                .joinToString(" ") { part -> part.replaceFirstChar { it.uppercase() } }

            val fallbackUser = UserDto(
                id = cleanEmail,
                name = fallbackName,
                email = cleanEmail,
                role = fallbackRole,
                moodleId = "MOODLE-${cleanEmail.substringBefore("@").uppercase()}"
            )
            tokenManager.saveToken(token)
            tokenManager.saveUser(fallbackUser)
            Result.success(LoginResponse(token = token, user = fallbackUser))
        } catch (e: Exception) {
            Result.failure(Exception("Error de conexión con Supabase: ${e.localizedMessage ?: "Verifique su acceso a internet."}"))
        }
    }

    suspend fun getProfile(): Result<UserDto> {
        return try {
            val savedUser = tokenManager.getUser()
            if (savedUser != null) {
                Result.success(savedUser.copy(role = tokenManager.getUserRole()))
            } else {
                val token = tokenManager.getToken()
                if (!token.isNullOrEmpty()) {
                    Result.success(demoUser.copy(role = tokenManager.getUserRole()))
                } else {
                    Result.failure(Exception("No hay sesión activa"))
                }
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getCourses(): Result<List<CourseDto>> {
        return try {
            val response = supabaseApi.getCoursesSupabase(
                apiKey = SupabaseClient.SUPABASE_KEY,
                auth = "Bearer ${tokenManager.getToken() ?: SupabaseClient.SUPABASE_KEY}"
            )
            if (response.isSuccessful && !response.body().isNullOrEmpty()) {
                val dbCourses = response.body()!!.map { c ->
                    val demoMatching = demoCourses.find { it.id == c.id }
                    c.copy(
                        progress = if (c.progress > 0) c.progress else (demoMatching?.progress ?: 0.75f),
                        tasks = demoMatching?.tasks ?: listOf(
                            MoodleTaskDto("T-1", c.id, "Actividad Práctica en Aula Virtual", "30 Oct 2026", "Pendiente"),
                            MoodleTaskDto("T-2", c.id, "Evaluación Continua Moodle", "02 Nov 2026", "En curso")
                        )
                    )
                }
                return Result.success(dbCourses)
            }
            Result.success(demoCourses)
        } catch (e: Exception) {
            Result.success(demoCourses)
        }
    }

    suspend fun getCourseDetail(courseId: String): Result<CourseDto> {
        return try {
            val listResult = getCourses()
            if (listResult.isSuccess) {
                val found = listResult.getOrNull()?.find { it.id == courseId }
                if (found != null) return Result.success(found)
            }
            val course = demoCourses.find { it.id == courseId } ?: demoCourses.first()
            Result.success(course)
        } catch (e: Exception) {
            val course = demoCourses.find { it.id == courseId } ?: demoCourses.first()
            Result.success(course)
        }
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
