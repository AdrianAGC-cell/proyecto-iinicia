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
    @SerializedName("id") val id: String = "",
    @SerializedName(value = "name", alternate = ["full_name"]) val name: String = "",
    @SerializedName("email") val email: String = "",
    @SerializedName(value = "role", alternate = ["role_id"]) val role: String = "Estudiante",
    @SerializedName(value = "moodleId", alternate = ["matricula"]) val moodleId: String = "",
    @SerializedName("avatar_url") val avatarUrl: String? = null,
    @SerializedName("program_name") val programName: String? = null
)

data class CourseDto(
    @SerializedName("id") val id: String = "",
    @SerializedName(value = "title", alternate = ["name"]) val title: String = "",
    @SerializedName("description") val description: String = "",
    @SerializedName("progress") val progress: Float = 0.75f,
    @SerializedName(value = "instructor", alternate = ["professor_name"]) val instructor: String = "Claustro IINICIA",
    @SerializedName(value = "semester", alternate = ["code"]) val semester: String = "Semestre 2026",
    @SerializedName("tasks") val tasks: List<MoodleTaskDto> = emptyList()
)

data class MoodleTaskDto(
    val id: String = "",
    val courseId: String = "",
    val title: String = "",
    val dueDate: String = "",
    val status: String = "",
    val grade: String? = null
)

data class NotificationDto(
    @SerializedName("id") val id: String = "",
    @SerializedName("title") val title: String = "",
    @SerializedName("message") val message: String = "",
    @SerializedName(value = "timestamp", alternate = ["created_at"]) val timestamp: String = "Reciente",
    @SerializedName("type") val type: String = "academic"
)

data class AdmissionApplicationDto(
    @SerializedName("id") val id: String = "",
    @SerializedName("full_name") val fullName: String = "",
    @SerializedName("email") val email: String = "",
    @SerializedName("phone") val phone: String? = null,
    @SerializedName("program_id") val programId: String = "",
    @SerializedName("program_name") val programName: String = "",
    @SerializedName("status") val status: String = "EN REVISION",
    @SerializedName("moodle_synced") val moodleSynced: Boolean = false,
    @SerializedName("moodle_user_id") val moodleUserId: Int? = null
)

data class SupabaseLoginRequest(
    val email: String,
    val password: String
)

data class SupabaseAuthResponse(
    val access_token: String? = null,
    val refresh_token: String? = null,
    val error: String? = null,
    val error_description: String? = null
)


data class MoodleCoursesResponse(
    val conectado: Boolean = false,
    val total: Int = 0,
    val cursos: List<MoodleCourseItem> = emptyList(),
    val error: String? = null
)

data class MoodleCourseItem(
    val id: Long = 0,
    val nombre: String = "",
    val nombreCorto: String = "",
    val idCategoria: Int = 0,
    val visible: Int = 1,
    val resumen: String = "",
    val progress: Float? = null
)

data class MoodleContentsResponse(
    val conectado: Boolean = false,
    val cursoId: Long = 0,
    val totalSecciones: Int = 0,
    val secciones: List<MoodleSectionItem> = emptyList(),
    val error: String? = null
)

data class MoodleSectionItem(
    val id: Long = 0,
    val nombre: String = "",
    val resumen: String = "",
    val visible: Int = 1,
    val actividades: List<MoodleActivityItem> = emptyList()
)

data class MoodleContentFile(
    val filename: String = "",
    val filesize: Long = 0,
    val mimetype: String = ""
)

data class MoodleActivityItem(
    val id: Long = 0,
    val nombre: String = "",
    val tipo: String = "",
    val url: String? = null,
    val visible: Int = 1,
    val descripcion: String = "",
    val contents: List<MoodleContentFile> = emptyList()
)

data class MoodleLoginRequest(
    val identificador: String,
    val password: String,
    val tipo: String
)

data class MoodleAuthResponse(
    val success: Boolean = false,
    val mensaje: String? = null,
    val error: String? = null,
    val usuario: MoodleUserProfile? = null
)

data class MoodleUserProfile(
    val id: Long = 0,
    val username: String = "",
    val nombre: String = "",
    val imagen: String? = null,
    val email: String? = null,
    val matricula: String? = null
)

data class MoodleGradesResponse(
    val success: Boolean = false,
    val usergrades: List<MoodleUserGradeItem> = emptyList(),
    val error: String? = null
)

data class MoodleUserGradeItem(
    val courseid: Long = 0,
    val userid: Long = 0,
    val gradeitems: List<MoodleGradeDetail> = emptyList()
)

data class MoodleGradeDetail(
    val id: Long = 0,
    val itemname: String? = null,
    val itemtype: String? = null,
    val itemmodule: String? = null,
    val iteminstance: Long? = null,
    val graderaw: Float? = null,
    val grademin: Float? = null,
    val grademax: Float? = null,
    val gradeformatted: String? = null,
    val percentageformatted: String? = null
)
