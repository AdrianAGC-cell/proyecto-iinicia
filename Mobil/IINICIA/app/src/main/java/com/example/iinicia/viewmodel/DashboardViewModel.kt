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

    private val _user = MutableStateFlow<UserDto>(repository.demoUser)
    val user: StateFlow<UserDto> = _user.asStateFlow()

    private val _courses = MutableStateFlow<List<CourseDto>>(repository.demoCourses)
    val courses: StateFlow<List<CourseDto>> = _courses.asStateFlow()

    private val _selectedCourse = MutableStateFlow<CourseDto?>(null)
    val selectedCourse: StateFlow<CourseDto?> = _selectedCourse.asStateFlow()

    private val _notifications = MutableStateFlow<List<NotificationDto>>(repository.demoNotifications)
    val notifications: StateFlow<List<NotificationDto>> = _notifications.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    init {
        loadData()
    }

    fun loadData() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                repository.getProfile().onSuccess { _user.value = it }
                repository.getCourses().onSuccess { _courses.value = it }
                repository.getNotifications().onSuccess { _notifications.value = it }
            } catch (_: Exception) {
                // Ensure demo data remains intact on any unexpected error
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun selectCourse(courseId: String) {
        viewModelScope.launch {
            try {
                repository.getCourseDetail(courseId).onSuccess {
                    _selectedCourse.value = it
                }
            } catch (_: Exception) {
                _selectedCourse.value = repository.demoCourses.find { it.id == courseId }
            }
        }
    }
}
