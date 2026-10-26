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

    // Supabase REST endpoints
    @GET("rest/v1/courses?select=*")
    suspend fun getCursosSupabase(
        @Header("apikey") apiKey: String,
        @Header("Authorization") auth: String
    ): Response<List<CourseDto>>

    @GET("rest/v1/users?select=*")
    suspend fun getUsuariosSupabase(
        @Header("apikey") apiKey: String,
        @Header("Authorization") auth: String,
        @Query("email") emailQuery: String? = null
    ): Response<List<UserDto>>

    @GET("rest/v1/admission_applications?select=*")
    suspend fun getApplicationsSupabase(
        @Header("apikey") apiKey: String,
        @Header("Authorization") auth: String
    ): Response<List<AdmissionApplicationDto>>

    @POST("rest/v1/admission_applications")
    suspend fun submitApplicationSupabase(
        @Header("apikey") apiKey: String,
        @Header("Authorization") auth: String,
        @Header("Prefer") prefer: String = "return=representation",
        @Body application: AdmissionApplicationDto
    ): Response<List<AdmissionApplicationDto>>
}
