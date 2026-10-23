package com.example.iinicia.data

data class LoginRequest(
    val email: String,
    val password: String
)

data class LoginResponse(
    val token: String,
    val user: UserDto
)

data class UserDto(
    val id: String,
    val name: String,
    val email: String,
    val role: String, // Estudiante, Profesor, Administrativo
    val moodleId: String
)

data class CourseDto(
    val id: String,
    val title: String,
    val description: String,
    val progress: Float, // 0.0 to 1.0
    val instructor: String,
    val semester: String,
    val tasks: List<MoodleTaskDto> = emptyList()
)

data class MoodleTaskDto(
    val id: String,
    val courseId: String,
    val title: String,
    val dueDate: String,
    val status: String, // Pendiente, Completado, En curso
    val grade: String? = null
)

data class NotificationDto(
    val id: String,
    val title: String,
    val message: String,
    val timestamp: String,
    val type: String // academic, sso, alert
)
