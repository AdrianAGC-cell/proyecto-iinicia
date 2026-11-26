package com.example.iinicia.data

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface IiniciaApi {
    @POST("api/auth/institucional")
    suspend fun autenticarInstitucional(
        @Header("Authorization") authorization: String
    ): Response<com.google.gson.JsonObject>


    @GET("rest/v1/programs")
    suspend fun programasAdmisiones(
        @Header("apikey") apiKey: String,
        @Header("Authorization") authorization: String,
        @Query("select") campos: String = "id,title",
        @Query("is_active") activos: String = "eq.true",
        @Query("order") orden: String = "title.asc"
    ): Response<com.google.gson.JsonArray>


    @POST("auth/v1/token")
    suspend fun autenticarSupabase(
        @Header("apikey") apiKey: String,
        @Query("grant_type") grantType: String,
        @Body datos: com.google.gson.JsonObject
    ): Response<com.google.gson.JsonObject>

    @GET("auth/v1/user")
    suspend fun identidadSupabase(
        @Header("apikey") apiKey: String,
        @Header("Authorization") authorization: String
    ): Response<com.google.gson.JsonObject>

    @POST("auth/v1/signup")
    suspend fun registrarSupabase(
        @Header("apikey") apiKey: String,
        @Body datos: com.google.gson.JsonObject
    ): Response<com.google.gson.JsonObject>


    @POST("auth/v1/verify")
    suspend fun verificarSupabase(
        @Header("apikey") apiKey: String,
        @Body datos: com.google.gson.JsonObject
    ): Response<com.google.gson.JsonObject>

    @POST("auth/v1/resend")
    suspend fun reenviarSupabase(
        @Header("apikey") apiKey: String,
        @Body datos: com.google.gson.JsonObject
    ): Response<com.google.gson.JsonObject>

    @POST("auth/v1/recover")
    suspend fun recuperarSupabase(
        @Header("apikey") apiKey: String,
        @Query("redirect_to") redirectTo: String,
        @Body datos: com.google.gson.JsonObject
    ): Response<com.google.gson.JsonObject>

    @POST("auth/v1/logout")
    suspend fun cerrarSupabase(
        @Header("apikey") apiKey: String,
        @Header("Authorization") authorization: String
    ): Response<okhttp3.ResponseBody>


    @retrofit2.http.Streaming
    @GET
    suspend fun downloadManagement(
        @retrofit2.http.Url ruta: String
    ): Response<okhttp3.ResponseBody>


    @GET("api/auth/me")
    suspend fun getRealIdentity(): Response<com.google.gson.JsonObject>

    @GET
    suspend fun getManagement(
        @retrofit2.http.Url ruta: String
    ): Response<com.google.gson.JsonObject>

    @retrofit2.http.Headers("Origin: http://localhost:5173")
    @POST
    suspend fun postManagement(
        @retrofit2.http.Url ruta: String,
        @Body datos: com.google.gson.JsonObject
    ): Response<com.google.gson.JsonObject>

    @retrofit2.http.Headers("Origin: http://localhost:5173")
    @retrofit2.http.PATCH
    suspend fun patchManagement(
        @retrofit2.http.Url ruta: String,
        @Body datos: com.google.gson.JsonObject
    ): Response<com.google.gson.JsonObject>


    @GET("api/auth/courses/{courseId}/assignments/{assignmentId}/cancellation")
    suspend fun getCancellation(
        @Path("courseId") courseId: Long,
        @Path("assignmentId") assignmentId: Long
    ): Response<com.google.gson.JsonObject>

    @retrofit2.http.Headers("Origin: http://localhost:5173")
    @POST("api/auth/courses/{courseId}/assignments/{assignmentId}/cancellation")
    suspend fun requestCancellation(
        @Path("courseId") courseId: Long,
        @Path("assignmentId") assignmentId: Long
    ): Response<com.google.gson.JsonObject>

    @retrofit2.http.Streaming
    @GET("api/auth/courses/{courseId}/assignments/{assignmentId}/submission-files/{index}")
    suspend fun downloadSubmission(
        @Path("courseId") courseId: Long,
        @Path("assignmentId") assignmentId: Long,
        @Path("index") index: Int
    ): Response<okhttp3.ResponseBody>


    @GET("api/auth/courses/{courseId}/assignments/{assignmentId}/status")
    suspend fun getAssignmentStatus(
        @Path("courseId") courseId: Long,
        @Path("assignmentId") assignmentId: Long
    ): Response<com.google.gson.JsonObject>

    @retrofit2.http.Multipart
    @POST("api/auth/courses/{courseId}/assignments/{assignmentId}/submit")
    suspend fun submitAssignment(
        @Path("courseId") courseId: Long,
        @Path("assignmentId") assignmentId: Long,
        @retrofit2.http.Part archivos: List<okhttp3.MultipartBody.Part>
    ): Response<com.google.gson.JsonObject>

    @retrofit2.http.Headers("Origin: http://localhost:5173")
    @POST("api/auth/courses/{courseId}/assignments/{assignmentId}/confirm")
    suspend fun confirmAssignment(
        @Path("courseId") courseId: Long,
        @Path("assignmentId") assignmentId: Long
    ): Response<com.google.gson.JsonObject>


    @GET("api/auth/courses/{courseId}/assignments")
    suspend fun getAssignments(
        @Path("courseId") courseId: Long
    ): Response<com.google.gson.JsonObject>



    @retrofit2.http.Streaming
    @GET("api/auth/courses/{courseId}/resources/{moduleId}")
    suspend fun descargarPdf(
        @Path("courseId") courseId: Long,
        @Path("moduleId") moduleId: Long
    ): Response<okhttp3.ResponseBody>


    @POST("api/auth/login")
    suspend fun moodleLogin(
        @Body request: MoodleLoginRequest
    ): Response<MoodleAuthResponse>

    @GET("api/auth/me")
    suspend fun moodleProfile(): Response<MoodleAuthResponse>

    @POST("api/auth/logout")
    suspend fun moodleLogout(): Response<MoodleAuthResponse>

    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @GET("api/user/profile")
    suspend fun getProfile(): Response<UserDto>

    @GET("api/courses")
    suspend fun getCourses(): Response<List<CourseDto>>

    @GET("api/courses/{id}")
    suspend fun getCourseDetail(@Path("id") courseId: String): Response<CourseDto>

    @GET("api/notifications")
    suspend fun getNotifications(): Response<List<NotificationDto>>

    // Backend propio: cursos y contenidos reales autenticados de Moodle
    @GET("api/auth/courses")
    suspend fun getMoodleCourses(): Response<MoodleCoursesResponse>

    @GET("api/auth/courses/{id}/contents")
    suspend fun getMoodleCourseContents(
        @Path("id") courseId: Long
    ): Response<MoodleContentsResponse>

    @GET("api/auth/courses/{id}/grades")
    suspend fun getMoodleCourseGrades(
        @Path("id") courseId: Long
    ): Response<MoodleGradesResponse>

    // Supabase Auth endpoint
    @POST("auth/v1/token")
    suspend fun supabaseSignIn(
        @Header("apikey") apiKey: String,
        @Query("grant_type") grantType: String = "password",
        @Body request: SupabaseLoginRequest
    ): Response<SupabaseAuthResponse>

    // Supabase REST endpoints
    @GET("rest/v1/courses")
    suspend fun getCoursesSupabase(
        @Header("apikey") apiKey: String,
        @Header("Authorization") auth: String,
        @Query("select") select: String = "*"
    ): Response<List<CourseDto>>

    @GET("rest/v1/users")
    suspend fun getUsersSupabase(
        @Header("apikey") apiKey: String,
        @Header("Authorization") auth: String,
        @Query("email") emailQuery: String,
        @Query("select") select: String = "*"
    ): Response<List<UserDto>>

    @GET("rest/v1/admission_applications")
    suspend fun getApplicationsSupabase(
        @Header("apikey") apiKey: String,
        @Header("Authorization") auth: String,
        @Query("email") emailQuery: String,
        @Query("select") select: String = "*"
    ): Response<List<AdmissionApplicationDto>>

    @GET("rest/v1/notifications")
    suspend fun getNotificationsSupabase(
        @Header("apikey") apiKey: String,
        @Header("Authorization") auth: String,
        @Query("select") select: String = "*"
    ): Response<List<NotificationDto>>
}
