package com.example.iinicia.data

import android.content.Context
import kotlinx.coroutines.sync.withLock
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
        .addInterceptor { chain ->
            val request = chain.request()
            val token = tokenAspirante
            val ruta = request.url.encodedPath

            val permitido = ruta in setOf(
                "/api/auth/admisiones/mis-solicitudes",
                "/api/auth/admisiones/solicitudes",
                "/api/auth/soporte/mis-tickets"
            )

            val nueva = if (
                token != null &&
                permitido &&
                request.url.host == "yolitomsi.tail54d206.ts.net" &&
                request.url.port == 443
            ) {
                request.newBuilder()
                    .header("Authorization", "Bearer $token")
                    .build()
            } else {
                request
            }

            chain.proceed(nueva)
        }

        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(180, TimeUnit.SECONDS)
        .writeTimeout(120, TimeUnit.SECONDS)
        .build()

    private val moodleRetrofit = Retrofit.Builder()
        .baseUrl("https://yolitomsi.tail54d206.ts.net/")
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

        private var tokenAspirante: String? = null
        private var tokenSupabase: String? = null
        private var refreshSupabase: String? = null
        private var renovarAntes: Long = 0L

        private val mutexSesion =
            kotlinx.coroutines.sync.Mutex()


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
        currentUser = null
        tokenAspirante = null
        tokenSupabase = null
        refreshSupabase = null
        renovarAntes = 0L

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
                    role = obtenerRolReal(),
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

        if (tipo == "correo") {
            return iniciarSesionAspirante(identificador, pass)
        }

        return Result.failure(
            Exception("No se pudo autenticar en Moodle. Verifica tus credenciales y la conexion.")
        )
    }


    private suspend fun iniciarSesionAspirante(
        email: String,
        password: String
    ): Result<LoginResponse> {
        return try {

            MoodleSessionCookies.clear()

            val cuerpo = com.google.gson.JsonObject().apply {
                addProperty("email", email)
                addProperty("password", password)
            }

            val respuesta = supabaseApi.autenticarSupabase(
                SupabaseClient.SUPABASE_KEY,
                "password",
                cuerpo
            )

            if (!respuesta.isSuccessful) {
                respuesta.errorBody()?.close()
                throw Exception(
                    "Credenciales incorrectas o correo sin confirmar"
                )
            }

            val token = respuesta.body()?.get("access_token")
                ?.asString
                ?: throw Exception("Sesion no disponible")

            val identidad = supabaseApi.identidadSupabase(
                SupabaseClient.SUPABASE_KEY,
                "Bearer $token"
            )

            val datos = identidad.body()

            if (!identidad.isSuccessful || datos == null) {
                throw Exception("No se pudo verificar la identidad")
            }

            if (
                datos.get("email_confirmed_at") == null ||
                datos.get("email_confirmed_at").isJsonNull
            ) {
                throw Exception("Confirma tu correo electronico")
            }

            val correo = datos.get("email").asString

            val metadata = datos.getAsJsonObject("user_metadata")

            val nombre = metadata?.get("full_name")
                ?.takeUnless { it.isJsonNull }?.asString
                ?: metadata?.get("name")
                    ?.takeUnless { it.isJsonNull }?.asString
                ?: correo

            val usuario = UserDto(
                id = datos.get("id").asString,
                name = nombre,
                email = correo,
                role = "aspirante",
                moodleId = ""
            )

            val identidadInstitucional =
                resolverUsuarioInstitucional(token, usuario)

            refreshSupabase = respuesta.body()
                ?.get("refresh_token")
                ?.takeUnless { it.isJsonNull }
                ?.asString

            renovarAntes = System.currentTimeMillis() +
                30 * 60 * 1000L

            tokenSupabase = token
            currentUser = identidadInstitucional

            Result.success(
                LoginResponse(
                    token = "",
                    user = identidadInstitucional
                )
            )

        } catch (e: kotlinx.coroutines.CancellationException) {
            throw e
        } catch (e: Exception) {
            tokenAspirante = null
            tokenSupabase = null
            refreshSupabase = null
            renovarAntes = 0L
            currentUser = null
            Result.failure(e)
        }
    }


    suspend fun consultarProgramasAdmisiones():
        Result<com.google.gson.JsonArray> {
        return try {
            renovarSesionSiNecesario()
            val token = tokenAspirante
                ?: throw Exception("Inicia sesion como aspirante")

            val respuesta = supabaseApi.programasAdmisiones(
                SupabaseClient.SUPABASE_KEY,
                "Bearer $token"
            )

            val datos = respuesta.body()

            if (!respuesta.isSuccessful || datos == null) {
                throw Exception("No se pudieron consultar los programas")
            }

            Result.success(datos)

        } catch (e: kotlinx.coroutines.CancellationException) {
            throw e
        } catch (e: Exception) {
            Result.failure(e)
        }
    }


    suspend fun registrarAspirante(
        nombre: String,
        correo: String,
        password: String
    ): Result<Unit> {
        return try {

            require(nombre.trim().length in 3..150) {
                "Ingresa tu nombre completo"
            }

            require(Patterns.EMAIL_ADDRESS.matcher(correo).matches()) {
                "Ingresa un correo electronico valido"
            }

            require(password.length >= 8) {
                "La contraseña debe tener al menos 8 caracteres"
            }

            val cuerpo = com.google.gson.JsonObject().apply {
                addProperty("email", correo.trim())
                addProperty("password", password)

                add("data", com.google.gson.JsonObject().apply {
                    addProperty("full_name", nombre.trim())
                    addProperty("name", nombre.trim())
                    addProperty("role", "aspirante")
                })
            }

            val respuesta = supabaseApi.registrarSupabase(
                SupabaseClient.SUPABASE_KEY,
                cuerpo
            )

            if (!respuesta.isSuccessful) {
                respuesta.errorBody()?.close()
                throw Exception(
                    "No se pudo registrar la cuenta. Revisa los datos o intenta mas tarde."
                )
            }

            Result.success(Unit)

        } catch (e: kotlinx.coroutines.CancellationException) {
            throw e
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun recuperarCuenta(correo: String): Result<Unit> {
        return try {

            require(Patterns.EMAIL_ADDRESS.matcher(correo).matches()) {
                "Ingresa un correo electronico valido"
            }

            val cuerpo = com.google.gson.JsonObject().apply {
                addProperty("email", correo.trim())
            }

            val respuesta = supabaseApi.recuperarSupabase(
                SupabaseClient.SUPABASE_KEY,
                "https://web-kappa-one-49.vercel.app/recuperar-password",
                cuerpo
            )

            if (!respuesta.isSuccessful) {
                respuesta.errorBody()?.close()
                throw Exception(
                    "No se pudo solicitar la recuperacion"
                )
            }

            Result.success(Unit)

        } catch (e: kotlinx.coroutines.CancellationException) {
            throw e
        } catch (e: Exception) {
            Result.failure(e)
        }
    }


    suspend fun completarGoogle(
        codigo: String,
        verifier: String
    ): Result<LoginResponse> {
        return try {

            MoodleSessionCookies.clear()
            tokenManager.clear()
            tokenAspirante = null
            tokenSupabase = null
            refreshSupabase = null
            renovarAntes = 0L
            currentUser = null

            val cuerpo = com.google.gson.JsonObject().apply {
                addProperty("auth_code", codigo)
                addProperty("code_verifier", verifier)
            }

            val respuesta = supabaseApi.autenticarSupabase(
                SupabaseClient.SUPABASE_KEY,
                "pkce",
                cuerpo
            )

            if (!respuesta.isSuccessful) {
                respuesta.errorBody()?.close()
                throw Exception(
                    "No se pudo completar el acceso con Google"
                )
            }

            val token = respuesta.body()?.get("access_token")
                ?.takeUnless { it.isJsonNull }
                ?.asString
                ?: throw Exception("Sesion Google no disponible")

            val identidad = supabaseApi.identidadSupabase(
                SupabaseClient.SUPABASE_KEY,
                "Bearer $token"
            )

            val datos = identidad.body()

            if (
                !identidad.isSuccessful ||
                datos == null ||
                datos.get("email_confirmed_at") == null ||
                datos.get("email_confirmed_at").isJsonNull
            ) {
                throw Exception("Cuenta Google no verificada")
            }

            val correo = datos.get("email").asString
            val metadata = datos.getAsJsonObject("user_metadata")

            val nombre = metadata?.get("full_name")
                ?.takeUnless { it.isJsonNull }?.asString
                ?: metadata?.get("name")
                    ?.takeUnless { it.isJsonNull }?.asString
                ?: correo

            val usuario = UserDto(
                id = datos.get("id").asString,
                name = nombre,
                email = correo,
                role = "aspirante",
                moodleId = ""
            )

            val identidadInstitucional =
                resolverUsuarioInstitucional(token, usuario)

            refreshSupabase = respuesta.body()
                ?.get("refresh_token")
                ?.takeUnless { it.isJsonNull }
                ?.asString

            renovarAntes = System.currentTimeMillis() +
                30 * 60 * 1000L

            tokenSupabase = token
            currentUser = identidadInstitucional

            Result.success(
                LoginResponse(
                    token = "",
                    user = identidadInstitucional
                )
            )

        } catch (e: kotlinx.coroutines.CancellationException) {
            throw e
        } catch (e: Exception) {
            tokenAspirante = null
            tokenSupabase = null
            refreshSupabase = null
            renovarAntes = 0L
            currentUser = null
            Result.failure(e)
        }
    }


    private suspend fun renovarSesionSiNecesario() {
        mutexSesion.withLock {

            val anterior = tokenSupabase
                ?: return@withLock

            if (
                System.currentTimeMillis() < renovarAntes
            ) {
                return@withLock
            }

            val refresh = refreshSupabase
                ?: throw Exception(
                    "Tu sesion vencio. Inicia sesion nuevamente."
                )

            val usuarioAnterior = currentUser
                ?: throw Exception("No hay una sesion activa")

            val cuerpo = com.google.gson.JsonObject().apply {
                addProperty("refresh_token", refresh)
            }

            val respuesta = supabaseApi.autenticarSupabase(
                SupabaseClient.SUPABASE_KEY,
                "refresh_token",
                cuerpo
            )

            val datos = respuesta.body()

            if (!respuesta.isSuccessful || datos == null) {
                respuesta.errorBody()?.close()
                throw Exception(
                    "No se pudo renovar la sesion. Vuelve a iniciar sesion."
                )
            }

            val nuevoToken = datos.get("access_token")
                ?.takeUnless { it.isJsonNull }
                ?.asString
                ?: throw Exception("Sesion no disponible")

            val nuevoRefresh = datos.get("refresh_token")
                ?.takeUnless { it.isJsonNull }
                ?.asString
                ?: throw Exception("Renovacion no disponible")

            if (tokenSupabase != anterior) {
                throw Exception("La sesion cambio")
            }

            refreshSupabase = nuevoRefresh
            tokenSupabase = nuevoToken

            try {
                val usuario = resolverUsuarioInstitucional(
                    nuevoToken,
                    usuarioAnterior
                )

                if (
                    usuario.id != usuarioAnterior.id ||
                    usuario.role != usuarioAnterior.role
                ) {
                    throw Exception(
                        "Tu identidad cambio. Inicia sesion nuevamente."
                    )
                }

                currentUser = usuario

                renovarAntes = System.currentTimeMillis() +
                    30 * 60 * 1000L

            } catch (e: Exception) {
                tokenSupabase = null
                tokenAspirante = null
                refreshSupabase = null
                renovarAntes = 0L
                currentUser = null
                MoodleSessionCookies.clear()
                tokenManager.clear()
                throw e
            }
        }
    }

    private suspend fun resolverUsuarioInstitucional(
        token: String,
        aspirante: UserDto
    ): UserDto {

        val respuesta = moodleApi.autenticarInstitucional(
            "Bearer $token"
        )

        val datos = respuesta.body()

        if (
            !respuesta.isSuccessful ||
            datos == null ||
            datos.get("success")?.asBoolean != true
        ) {
            respuesta.errorBody()?.close()
            throw Exception(
                "No se pudo verificar tu identidad institucional"
            )
        }

        if (
            datos.get("institucional")?.asBoolean == false &&
            datos.get("rol")?.asString == "aspirante"
        ) {
            tokenAspirante = token
            return aspirante
        }

        if (datos.get("institucional")?.asBoolean != true) {
            throw Exception("Identidad institucional invalida")
        }

        val usuario = datos.getAsJsonObject("usuario")
            ?: throw Exception("Usuario institucional no disponible")

        val roles = usuario.getAsJsonArray("roles")
            ?.map { it.asString }
            ?: emptyList()

        if (
            roles.size != 1 ||
            roles.firstOrNull() != "estudiante"
        ) {
            throw Exception("Rol institucional incompatible")
        }

        val id = usuario.get("id")?.asString
            ?: throw Exception("Identificador Moodle no disponible")

        tokenAspirante = null

        return UserDto(
            id = id,
            name = usuario.get("nombre").asString,
            email = usuario.get("email").asString,
            role = "estudiante",
            moodleId = id
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
                    role = obtenerRolReal(),
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

        val token = tokenSupabase ?: tokenAspirante

        tokenAspirante = null
        tokenSupabase = null
        refreshSupabase = null
        renovarAntes = 0L
        currentUser = null

        var fallo = false

        try {
            try {
                val respuesta = moodleApi.moodleLogout()

                if (!respuesta.isSuccessful &&
                    respuesta.code() != 401
                ) {
                    fallo = true
                }
            } catch (e: kotlinx.coroutines.CancellationException) {
                throw e
            } catch (e: Exception) {
                fallo = true
            }

            if (token != null) {
                try {
                    val respuesta = supabaseApi.cerrarSupabase(
                        SupabaseClient.SUPABASE_KEY,
                        "Bearer $token"
                    )

                    respuesta.body()?.close()
                    respuesta.errorBody()?.close()

                    if (!respuesta.isSuccessful) {
                        fallo = true
                    }

                } catch (e: kotlinx.coroutines.CancellationException) {
                    throw e
                } catch (e: Exception) {
                    fallo = true
                }
            }

        } finally {
            MoodleSessionCookies.clear()
            tokenManager.clear()
        }

        if (fallo) {
            throw Exception(
                "Sesion local cerrada. Cierre remoto no confirmado."
            )
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


    suspend fun getAssignment(
        courseId: Long,
        moduleId: Long
    ): Result<com.google.gson.JsonObject> {
        return try {
            val response = moodleApi.getAssignments(courseId)
            val body = response.body()

            if (!response.isSuccessful || body == null) {
                throw Exception("No se pudieron consultar las asignaciones")
            }

            val lista = body.getAsJsonArray("tareas")
                ?: throw Exception("Respuesta de asignaciones no disponible")

            val tarea = lista.map { it.asJsonObject }
                .firstOrNull {
                    it.get("moduloId")?.asLong == moduleId
                }
                ?: throw Exception("Asignacion no disponible")

            Result.success(tarea)
        } catch (e: kotlinx.coroutines.CancellationException) {
            throw e
        } catch (e: Exception) {
            Result.failure(e)
        }
    }


    private suspend fun operacionEntrega(
        operacion: suspend () -> retrofit2.Response<com.google.gson.JsonObject>
    ): Result<com.google.gson.JsonObject> {
        return try {
            renovarSesionSiNecesario()
            val response = operacion()
            val body = response.body()

            if (!response.isSuccessful || (body == null || (
                    body.get("success")?.asBoolean != true &&
                    body.get("conectado")?.asBoolean != true
                ))) {
                val mensaje = response.errorBody()?.use {
                    runCatching {
                        com.google.gson.JsonParser().parse(it.string())
                            .asJsonObject.get("error")?.asString
                    }.getOrNull()
                }

                throw Exception(
                    mensaje ?: "No se pudo completar la operacion (${response.code()})"
                )
            }

            Result.success(body)
        } catch (e: kotlinx.coroutines.CancellationException) {
            throw e
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun consultarEntrega(
        courseId: Long,
        assignmentId: Long
    ) = operacionEntrega {
        moodleApi.getAssignmentStatus(courseId, assignmentId)
    }

    suspend fun subirEntrega(
        courseId: Long,
        assignmentId: Long,
        archivos: List<okhttp3.MultipartBody.Part>
    ) = operacionEntrega {
        moodleApi.submitAssignment(courseId, assignmentId, archivos)
    }

    suspend fun confirmarEntrega(
        courseId: Long,
        assignmentId: Long
    ) = operacionEntrega {
        moodleApi.confirmAssignment(courseId, assignmentId)
    }


    suspend fun consultarCancelacion(
        courseId: Long,
        assignmentId: Long
    ) = operacionEntrega {
        moodleApi.getCancellation(courseId, assignmentId)
    }

    suspend fun solicitarCancelacion(
        courseId: Long,
        assignmentId: Long
    ) = operacionEntrega {
        moodleApi.requestCancellation(courseId, assignmentId)
    }

    suspend fun descargarEntrega(
        courseId: Long,
        assignmentId: Long,
        index: Int,
        resolver: android.content.ContentResolver,
        destino: android.net.Uri
    ): Result<Unit> =
        kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
            try {
                val response = moodleApi.downloadSubmission(
                    courseId, assignmentId, index
                )

                val body = response.body()

                if (!response.isSuccessful || body == null) {
                    response.errorBody()?.close()
                    body?.close()
                    throw Exception("No se pudo descargar el archivo")
                }

                body.use { archivo ->
                    val salida = resolver.openOutputStream(destino)
                        ?: throw Exception("No se pudo guardar el documento")

                    salida.use { output ->
                        archivo.byteStream().use { input ->
                            input.copyTo(output)
                        }
                    }
                }

                Result.success(Unit)
            } catch (e: kotlinx.coroutines.CancellationException) {
                throw e
            } catch (e: Exception) {
                Result.failure(e)
            }
        }


    suspend fun identidadReal(): Result<com.google.gson.JsonObject> {

        try {
            renovarSesionSiNecesario()
        } catch (e: kotlinx.coroutines.CancellationException) {
            throw e
        } catch (e: Exception) {
            return Result.failure(e)
        }

        val token = tokenAspirante

        if (token != null) {
            return try {
                val respuesta = supabaseApi.identidadSupabase(
                    SupabaseClient.SUPABASE_KEY,
                    "Bearer $token"
                )

                val datos = respuesta.body()

                if (
                    !respuesta.isSuccessful ||
                    datos == null ||
                    datos.get("email_confirmed_at") == null ||
                    datos.get("email_confirmed_at").isJsonNull
                ) {
                    throw Exception("Sesion de aspirante no valida")
                }

                Result.success(
                    com.google.gson.JsonObject().apply {
                        addProperty("success", true)
                        add("usuario", com.google.gson.JsonObject().apply {
                            addProperty("id", datos.get("id").asString)
                            addProperty("email", datos.get("email").asString)
                            add("roles", com.google.gson.JsonArray().apply {
                                add("aspirante")
                            })
                        })
                    }
                )

            } catch (e: kotlinx.coroutines.CancellationException) {
                throw e
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

        return operacionEntrega {
            moodleApi.getRealIdentity()
        }
    }

    suspend fun consultarGestion(ruta: String) = operacionEntrega {
        require(ruta.startsWith("api/auth/"))
        moodleApi.getManagement(ruta)
    }

    suspend fun crearGestion(
        ruta: String,
        datos: com.google.gson.JsonObject
    ) = operacionEntrega {
        require(ruta.startsWith("api/auth/"))
        moodleApi.postManagement(ruta, datos)
    }

    suspend fun actualizarGestion(
        ruta: String,
        datos: com.google.gson.JsonObject
    ) = operacionEntrega {
        require(ruta.startsWith("api/auth/"))
        moodleApi.patchManagement(ruta, datos)
    }

    private suspend fun obtenerRolReal(): String {
        val identidad = identidadReal().getOrThrow()

        val roles = identidad.getAsJsonObject("usuario")
            ?.getAsJsonArray("roles")
            ?: throw Exception("No se pudieron verificar los roles")

        return roles.mapNotNull {
            if (it.isJsonPrimitive) it.asString else null
        }.joinToString(", ").ifBlank {
            "Sin rol asignado"
        }
    }


    suspend fun descargarDocumentoDocente(
        ruta: String,
        resolver: android.content.ContentResolver,
        destino: android.net.Uri
    ): Result<Unit> =
        kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
            try {
                require(
                    ruta.matches(
                        Regex("api/auth/teacher/courses/[0-9]+/assignments/[0-9]+/students/[0-9]+/files/[0-9]+")
                    )
                )

                val response = moodleApi.downloadManagement(ruta)
                val body = response.body()

                if (!response.isSuccessful || body == null) {
                    response.errorBody()?.close()
                    body?.close()
                    throw Exception("No se pudo descargar el archivo")
                }

                body.use { archivo ->
                    val salida = resolver.openOutputStream(destino)
                        ?: throw Exception("No se pudo guardar el archivo")

                    salida.use { output ->
                        archivo.byteStream().use { input ->
                            input.copyTo(output)
                        }
                    }
                }

                Result.success(Unit)

            } catch (e: kotlinx.coroutines.CancellationException) {
                throw e
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun getCourses(): Result<List<CourseDto>> {

        try {
            renovarSesionSiNecesario()
        } catch (e: kotlinx.coroutines.CancellationException) {
            throw e
        } catch (e: Exception) {
            return Result.failure(e)
        }
        if (tokenAspirante != null) {
            return Result.success(emptyList())
        }

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
            Result.success(emptyList<NotificationDto>())
        } catch (e: Exception) {
            Result.success(emptyList<NotificationDto>())
        }
    }

    fun logout() {
        tokenManager.clear()
    }

    fun getTokenManager() = tokenManager
}
