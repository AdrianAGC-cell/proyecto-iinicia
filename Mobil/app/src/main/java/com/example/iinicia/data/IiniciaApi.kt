package com.example.iinicia.data

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface IiniciaApi {
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
