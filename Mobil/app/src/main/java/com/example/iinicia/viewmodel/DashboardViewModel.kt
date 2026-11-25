package com.example.iinicia.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.iinicia.data.CourseDto
import com.example.iinicia.data.IiniciaRepository
import com.example.iinicia.data.NotificationDto
import com.example.iinicia.data.UserDto
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class DashboardViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = IiniciaRepository(application)

    private val _user = MutableStateFlow<UserDto>(UserDto())
    val user: StateFlow<UserDto> = _user.asStateFlow()

    private val _courses = MutableStateFlow<List<CourseDto>>(emptyList())
    val courses: StateFlow<List<CourseDto>> = _courses.asStateFlow()

    private val _selectedCourse = MutableStateFlow<CourseDto?>(null)
    val selectedCourse: StateFlow<CourseDto?> = _selectedCourse.asStateFlow()

    private val _notifications = MutableStateFlow<List<NotificationDto>>(emptyList())
    val notifications: StateFlow<List<NotificationDto>> = _notifications.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _isOfflineMode = MutableStateFlow(false)
    val isOfflineMode: StateFlow<Boolean> = _isOfflineMode.asStateFlow()

    fun loadData() {
        viewModelScope.launch {
            _isLoading.value = true
            _selectedCourse.value = null
            try {
                // 1. Cargar Perfil
                repository.getProfile().onSuccess { perfil ->
                    _user.value = perfil
                }.onFailure {
                    if (_user.value.name.isBlank()) {
                        _user.value = repository.demoUser
                    }
                }

                // 2. Cargar Cursos
                val cursosResultado = repository.getCourses()
                if (cursosResultado.isSuccess) {
                    _courses.value = cursosResultado.getOrNull().orEmpty()
                    _isOfflineMode.value = false
                } else {
                    _courses.value = emptyList()
                    _isOfflineMode.value = true
                }

                // 3. Cargar Notificaciones
                repository.getNotifications().onSuccess { notifs ->
                    _notifications.value = notifs
                }.onFailure {
                    _notifications.value = repository.demoNotifications
                }

            } catch (_: Exception) {
                _courses.value = emptyList()
                if (_user.value.name.isBlank()) {
                    _user.value = repository.demoUser
                }
                _notifications.value = repository.demoNotifications
                _isOfflineMode.value = true
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun switchRole(newRole: String) {
        // Simulacion de roles deshabilitada.
    }

    fun selectCourse(courseId: String) {
        _selectedCourse.value = null
        viewModelScope.launch {
            try {
                repository.getCourseDetail(courseId).onSuccess {
                    _selectedCourse.value = it
                }.onFailure {
                    val local = _courses.value.find { it.id == courseId }
                    _selectedCourse.value = local
                }
            } catch (_: Exception) {
                val local = _courses.value.find { it.id == courseId }
                _selectedCourse.value = local
            }
        }
    }
}
