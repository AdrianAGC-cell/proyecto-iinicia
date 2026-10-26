package com.example.iinicia.data

import com.google.gson.annotations.SerializedName

data class LoginRequest(
    val email: String,
    val password: String
)

data class LoginResponse(
    val token: String,
    val user: UserDto
)

data class UserDto(
    @SerializedName(value = "id")
    val id: String = "",

    @SerializedName(value = "name", alternate = ["full_name"])
    val name: String = "",

    @SerializedName(value = "email")
    val email: String = "",

    @SerializedName(value = "role", alternate = ["role_id"])
    val role: String = "Estudiante",

    @SerializedName(value = "moodleId", alternate = ["matricula", "moodle_id"])
    val moodleId: String = "MOODLE-RG-8849"
)

data class CourseDto(
    @SerializedName(value = "id")
    val id: String = "",

    @SerializedName(value = "title", alternate = ["name"])
    val title: String = "",

    @SerializedName(value = "description", alternate = ["code"])
    val description: String = "",

    @SerializedName(value = "progress")
    val progress: Float = 0.78f,

    @SerializedName(value = "instructor", alternate = ["professor_name"])
    val instructor: String = "Claustro Docente IINICIA",

    @SerializedName(value = "semester")
    val semester: String = "Semestre 2026-I",

    @SerializedName(value = "tasks")
    val tasks: List<MoodleTaskDto> = emptyList()
)

data class MoodleTaskDto(
    @SerializedName(value = "id")
    val id: String = "",

    @SerializedName(value = "courseId", alternate = ["course_id"])
    val courseId: String = "",

    @SerializedName(value = "title")
    val title: String = "",

    @SerializedName(value = "dueDate", alternate = ["due_date", "next_deadline"])
    val dueDate: String = "",

    @SerializedName(value = "status")
    val status: String = "Pendiente",

    @SerializedName(value = "grade")
    val grade: String? = null
)

data class NotificationDto(
    @SerializedName(value = "id")
    val id: String = "",

    @SerializedName(value = "title")
    val title: String = "",

    @SerializedName(value = "message")
    val message: String = "",

    @SerializedName(value = "timestamp", alternate = ["created_at"])
    val timestamp: String = "",

    @SerializedName(value = "type")
    val type: String = "academic"
)

data class AdmissionApplicationDto(
    @SerializedName("id")
    val id: String = "",

    @SerializedName("full_name")
    val fullName: String = "",

    @SerializedName("email")
    val email: String = "",

    @SerializedName("phone")
    val phone: String? = null,

    @SerializedName("program_id")
    val programId: String = "",

    @SerializedName("program_name")
    val programName: String = "",

    @SerializedName("previous_school")
    val previousSchool: String? = null,

    @SerializedName("average_grade")
    val averageGrade: Double? = null,

    @SerializedName("status")
    val status: String = "EN REVISION",

    @SerializedName("moodle_synced")
    val moodleSynced: Boolean = false
)
