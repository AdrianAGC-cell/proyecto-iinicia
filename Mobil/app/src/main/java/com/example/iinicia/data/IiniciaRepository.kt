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
        id = "U-2024-089",
        name = "Ramos Gordo",
        email = "ramos.gordo@iinicia.org",
        role = "Estudiante",
        moodleId = "MOODLE-RG-8849"
    )

    val demoCourses = listOf(
        CourseDto(
            id = "C-TECH-101",
            title = "Licenciatura en Tecnología y Sistemas Digitales",
            description = "Fundamentos avanzados de arquitectura de sistemas, cloud computing y desarrollo moderno en plataformas móviles y web.",
            progress = 0.78f,
            instructor = "Dra. Elena Valenzuela",
            semester = "Semestre 2024-II",
            tasks = listOf(
                MoodleTaskDto("T-1", "C-TECH-101", "Entrega Proyecto Arquitectura Microservicios", "15 Oct 2024", "Pendiente"),
                MoodleTaskDto("T-2", "C-TECH-101", "Cuestionario de Seguridad en APIs REST", "20 Oct 2024", "Completado", "95/100")
            )
        ),
        CourseDto(
            id = "C-INNOV-202",
            title = "Metodologías de Innovación Educativa",
            description = "Estrategias pedagógicas disruptivas, design thinking aplicado a la educación y transformación digital en entornos académicos.",
            progress = 0.64f,
            instructor = "Dr. Carlos Mendoza",
            semester = "Semestre 2024-II",
            tasks = listOf(
                MoodleTaskDto("T-3", "C-INNOV-202", "Ensayo: El impacto de la IA en el aula virtual", "18 Oct 2024", "Pendiente"),
                MoodleTaskDto("T-4", "C-INNOV-202", "Foro de Discusión: Tendencias EdTech 2025", "22 Oct 2024", "En curso")
            )
        ),
        CourseDto(
            id = "C-DATA-303",
            title = "Analítica de Datos y Gobierno Digital",
            description = "Gestión de bases de datos distribuidas, análisis predictivo y normativas éticas para el gobierno digital institucional.",
            progress = 0.90f,
            instructor = "Ing. Sofía Morales",
            semester = "Semestre 2024-II",
            tasks = listOf(
                MoodleTaskDto("T-5", "C-DATA-303", "Dashboard interactivo en PowerBI / Looker", "25 Oct 2024", "Completado", "98/100")
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
            title = "Nueva Tarea Asignada",
            message = "Se agregó la tarea 'Entrega Proyecto Arquitectura Microservicios' en Tecnología y Sistemas Digitales.",
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
            "Aspirante" -> demoUser.copy(name = "Valeria Gomez", email = "valeria.gomez@aspirante.org", role = "Aspirante", moodleId = "MOODLE-ASP-992")
            "Coordinador" -> demoUser.copy(name = "Dr. Carlos Mendoza", email = "carlos.mendoza@iinicia.org", role = "Coordinador", moodleId = "MOODLE-COORD-301")
            "Admin TI" -> demoUser.copy(name = "Ing. Roberto Soto", email = "roberto.soto@iinicia.org", role = "Admin TI", moodleId = "MOODLE-ADM-001")
            else -> demoUser
        }
        tokenManager.saveToken("demo_jwt_token_iinicia_2024")
        tokenManager.saveUserRole(user.role)
        return Result.success(LoginResponse(token = "demo_jwt_token_iinicia_2024", user = user))
    }

    suspend fun getProfile(role: String = "Estudiante"): Result<UserDto> {
        return try {
            val email = demoUser.email
            val response = supabaseApi.getUsuariosSupabase(
                apiKey = SupabaseClient.SUPABASE_KEY,
                auth = "Bearer ${SupabaseClient.SUPABASE_KEY}",
                emailQuery = "eq.$email"
            )
            if (response.isSuccessful && !response.body().isNullOrEmpty()) {
                return Result.success(response.body()!!.first())
            }
            val user = when(role) {
                "Aspirante" -> demoUser.copy(name = "Valeria Gomez", email = "valeria.gomez@aspirante.org", role = "Aspirante", moodleId = "MOODLE-ASP-992")
                "Coordinador" -> demoUser.copy(name = "Dr. Carlos Mendoza", email = "carlos.mendoza@iinicia.org", role = "Coordinador", moodleId = "MOODLE-COORD-301")
                "Admin TI" -> demoUser.copy(name = "Ing. Roberto Soto", email = "roberto.soto@iinicia.org", role = "Admin TI", moodleId = "MOODLE-ADM-001")
                else -> demoUser
            }
            Result.success(user)
        } catch (e: Exception) {
            val user = when(role) {
                "Aspirante" -> demoUser.copy(name = "Valeria Gomez", email = "valeria.gomez@aspirante.org", role = "Aspirante", moodleId = "MOODLE-ASP-992")
                "Coordinador" -> demoUser.copy(name = "Dr. Carlos Mendoza", email = "carlos.mendoza@iinicia.org", role = "Coordinador", moodleId = "MOODLE-COORD-301")
                "Admin TI" -> demoUser.copy(name = "Ing. Roberto Soto", email = "roberto.soto@iinicia.org", role = "Admin TI", moodleId = "MOODLE-ADM-001")
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

    fun logout() {
        tokenManager.clear()
    }

    fun getTokenManager() = tokenManager
}
