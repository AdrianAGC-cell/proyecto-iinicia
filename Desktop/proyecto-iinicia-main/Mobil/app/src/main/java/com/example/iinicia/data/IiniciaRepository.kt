package com.example.iinicia.data

import android.content.Context
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
        .connectTimeout(5, TimeUnit.SECONDS)
        .readTimeout(5, TimeUnit.SECONDS)
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
        moodleId = "IIN-2024-8842"
    )

    val demoCourses = listOf(
        CourseDto(
            id = "c-01",
            title = "Redes Neuronales y Deep Learning con PyTorch",
            description = "IA-401 • MLOps y Deep Learning",
            progress = 0.78f,
            instructor = "Dr. Alejandro Méndez Vargas",
            semester = "Semestre 4",
            tasks = listOf(
                MoodleTaskDto("T-1", "c-01", "Laboratorio 3: PyTorch Convolucional", "24 Oct 2026", "Pendiente"),
                MoodleTaskDto("T-2", "c-01", "Cuestionario de Arquitecturas Transformers", "28 Oct 2026", "Completado", "95/100")
            )
        ),
        CourseDto(
            id = "c-02",
            title = "Cloud Computing & MLOps con Docker y Kubernetes",
            description = "IA-402 • Orquestación y Microservicios",
            progress = 0.64f,
            instructor = "Mtra. Elena Saldaña",
            semester = "Semestre 4",
            tasks = listOf(
                MoodleTaskDto("T-3", "c-02", "Pipeline CI/CD con Docker y despliegue en K8s", "27 Oct 2026", "Pendiente")
            )
        ),
        CourseDto(
            id = "c-03",
            title = "Machine Learning II: Algoritmos No Supervisados",
            description = "IA-403 • Clustering y PCA",
            progress = 0.90f,
            instructor = "Dr. Fernando Quiroz",
            semester = "Semestre 4",
            tasks = listOf(
                MoodleTaskDto("T-5", "c-03", "Clustering K-Means en dataset de producción", "30 Oct 2026", "Completado", "98/100")
            )
        )
    )

    val demoNotifications = listOf(
        NotificationDto(
            id = "N-1",
            title = "Moodle SSO Disponible",
            message = "Su sesión académica en el Campus Virtual Moodle ha sido sincronizada correctamente.",
            timestamp = "Hace 10 min",
            type = "sso"
        ),
        NotificationDto(
            id = "N-2",
            title = "Próxima Entrega: Redes Neuronales",
            message = "Tu laboratorio práctico de PyTorch vence el 24 de Octubre a las 23:59 hrs.",
            timestamp = "Hace 2 horas",
            type = "academic"
        ),
        NotificationDto(
            id = "N-3",
            title = "Mantenimiento del Sistema IINICIA",
            message = "El portal institucional tendrá una ventana de actualización este domingo a las 02:00 AM.",
            timestamp = "Ayer",
            type = "alert"
        )
    )

    suspend fun login(email: String, pass: String, role: String): Result<LoginResponse> {
        return try {
            val response = supabaseApi.getUsuariosSupabase(
                apiKey = SupabaseClient.SUPABASE_KEY,
                auth = "Bearer ${SupabaseClient.SUPABASE_KEY}",
                emailQuery = "eq.$email"
            )
            if (response.isSuccessful && !response.body().isNullOrEmpty()) {
                val dbUser = response.body()!!.first()
                tokenManager.saveToken("supabase_jwt_${dbUser.id}")
                tokenManager.saveUserRole(dbUser.role)
                return Result.success(LoginResponse(token = "supabase_jwt_${dbUser.id}", user = dbUser))
            }
            loginDemo(role)
        } catch (e: Exception) {
            loginDemo(role)
        }
    }

    fun loginDemo(role: String): Result<LoginResponse> {
        val user = when(role) {
            "Aspirante" -> demoUser.copy(id = "a0000000-0000-0000-0000-000000000002", name = "Diego Armando Solís", email = "diego.solis@gmail.com", role = "Aspirante", moodleId = "ASP-2026-092")
            "Coordinador" -> demoUser.copy(id = "a0000000-0000-0000-0000-000000000004", name = "Dra. Sofía Alarcón Ruiz", email = "sofia.alarcon@iinicia.edu.mx", role = "Coordinador", moodleId = "COORD-2021-004")
            "Profesor" -> demoUser.copy(id = "a0000000-0000-0000-0000-000000000003", name = "Dr. Alejandro Méndez Vargas", email = "alejandro.mendez@iinicia.edu.mx", role = "Profesor", moodleId = "DOC-2022-019")
            "Admin TI" -> demoUser.copy(id = "a0000000-0000-0000-0000-000000000005", name = "Ing. Roberto Peña Guzmán", email = "admin.sistemas@iinicia.edu.mx", role = "Admin TI", moodleId = "ADM-2020-001")
            else -> demoUser
        }
        tokenManager.saveToken("demo_jwt_token_iinicia_2026")
        tokenManager.saveUserRole(user.role)
        return Result.success(LoginResponse(token = "demo_jwt_token_iinicia_2026", user = user))
    }

    suspend fun getProfile(role: String = "Estudiante"): Result<UserDto> {
        return try {
            val email = when(role) {
                "Aspirante" -> "diego.solis@gmail.com"
                "Coordinador" -> "sofia.alarcon@iinicia.edu.mx"
                "Profesor" -> "alejandro.mendez@iinicia.edu.mx"
                "Admin TI" -> "admin.sistemas@iinicia.edu.mx"
                else -> demoUser.email
            }
            val response = supabaseApi.getUsuariosSupabase(
                apiKey = SupabaseClient.SUPABASE_KEY,
                auth = "Bearer ${SupabaseClient.SUPABASE_KEY}",
                emailQuery = "eq.$email"
            )
            if (response.isSuccessful && !response.body().isNullOrEmpty()) {
                return Result.success(response.body()!!.first())
            }
            val user = when(role) {
                "Aspirante" -> demoUser.copy(id = "a0000000-0000-0000-0000-000000000002", name = "Diego Armando Solís", email = "diego.solis@gmail.com", role = "Aspirante", moodleId = "ASP-2026-092")
                "Coordinador" -> demoUser.copy(id = "a0000000-0000-0000-0000-000000000004", name = "Dra. Sofía Alarcón Ruiz", email = "sofia.alarcon@iinicia.edu.mx", role = "Coordinador", moodleId = "COORD-2021-004")
                "Profesor" -> demoUser.copy(id = "a0000000-0000-0000-0000-000000000003", name = "Dr. Alejandro Méndez Vargas", email = "alejandro.mendez@iinicia.edu.mx", role = "Profesor", moodleId = "DOC-2022-019")
                "Admin TI" -> demoUser.copy(id = "a0000000-0000-0000-0000-000000000005", name = "Ing. Roberto Peña Guzmán", email = "admin.sistemas@iinicia.edu.mx", role = "Admin TI", moodleId = "ADM-2020-001")
                else -> demoUser
            }
            Result.success(user)
        } catch (e: Exception) {
            val user = when(role) {
                "Aspirante" -> demoUser.copy(id = "a0000000-0000-0000-0000-000000000002", name = "Diego Armando Solís", email = "diego.solis@gmail.com", role = "Aspirante", moodleId = "ASP-2026-092")
                "Coordinador" -> demoUser.copy(id = "a0000000-0000-0000-0000-000000000004", name = "Dra. Sofía Alarcón Ruiz", email = "sofia.alarcon@iinicia.edu.mx", role = "Coordinador", moodleId = "COORD-2021-004")
                "Profesor" -> demoUser.copy(id = "a0000000-0000-0000-0000-000000000003", name = "Dr. Alejandro Méndez Vargas", email = "alejandro.mendez@iinicia.edu.mx", role = "Profesor", moodleId = "DOC-2022-019")
                "Admin TI" -> demoUser.copy(id = "a0000000-0000-0000-0000-000000000005", name = "Ing. Roberto Peña Guzmán", email = "admin.sistemas@iinicia.edu.mx", role = "Admin TI", moodleId = "ADM-2020-001")
                else -> demoUser
            }
            Result.success(user)
        }
    }

    suspend fun getCourses(): Result<List<CourseDto>> {
        return try {
            val response = supabaseApi.getCursosSupabase(
                apiKey = SupabaseClient.SUPABASE_KEY,
                auth = "Bearer ${SupabaseClient.SUPABASE_KEY}"
            )
            if (response.isSuccessful && !response.body().isNullOrEmpty()) {
                return Result.success(response.body()!!)
            }
            Result.success(demoCourses)
        } catch (e: Exception) {
            Result.success(demoCourses)
        }
    }

    suspend fun getCourseDetail(courseId: String): Result<CourseDto> {
        return try {
            val response = supabaseApi.getCursosSupabase(
                apiKey = SupabaseClient.SUPABASE_KEY,
                auth = "Bearer ${SupabaseClient.SUPABASE_KEY}"
            )
            if (response.isSuccessful && !response.body().isNullOrEmpty()) {
                val found = response.body()!!.find { it.id == courseId }
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
            val response = api.getNotifications()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.success(demoNotifications)
            }
        } catch (e: Exception) {
            Result.success(demoNotifications)
        }
    }

    suspend fun getAdmissionApplications(): Result<List<AdmissionApplicationDto>> {
        return try {
            val response = supabaseApi.getApplicationsSupabase(
                apiKey = SupabaseClient.SUPABASE_KEY,
                auth = "Bearer ${SupabaseClient.SUPABASE_KEY}"
            )
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Error al consultar solicitudes"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun submitAdmissionApplication(app: AdmissionApplicationDto): Result<AdmissionApplicationDto> {
        return try {
            val response = supabaseApi.submitApplicationSupabase(
                apiKey = SupabaseClient.SUPABASE_KEY,
                auth = "Bearer ${SupabaseClient.SUPABASE_KEY}",
                application = app
            )
            if (response.isSuccessful && !response.body().isNullOrEmpty()) {
                Result.success(response.body()!!.first())
            } else {
                Result.failure(Exception("Error al registrar solicitud"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun logout() {
        tokenManager.clear()
    }

    fun getTokenManager() = tokenManager
}
