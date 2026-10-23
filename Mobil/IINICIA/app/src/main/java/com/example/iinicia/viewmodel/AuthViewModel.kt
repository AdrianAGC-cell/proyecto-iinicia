package com.example.iinicia.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.iinicia.data.IiniciaRepository
import com.example.iinicia.data.UserDto
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed interface AuthState {
    object Idle : AuthState
    object Loading : AuthState
    data class Success(val user: UserDto) : AuthState
    data class Error(val message: String) : AuthState
}

class AuthViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = IiniciaRepository(application)

    private val _authState = MutableStateFlow<AuthState>(
        try {
            AuthState.Success(repository.demoUser)
        } catch (_: Exception) {
            AuthState.Idle
        }
    )
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    fun login(email: String, pass: String, role: String) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            try {
                val result = repository.login(email, pass, role)
                result.onSuccess { response ->
                    _authState.value = AuthState.Success(response.user)
                }.onFailure { err ->
                    _authState.value = AuthState.Error(err.localizedMessage ?: "Error de autenticación")
                }
            } catch (_: Exception) {
                _authState.value = AuthState.Success(repository.demoUser.copy(role = role))
            }
        }
    }

    fun loginDemo(role: String = "Estudiante") {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            try {
                val result = repository.loginDemo(role)
                result.onSuccess { response ->
                    _authState.value = AuthState.Success(response.user)
                }.onFailure {
                    _authState.value = AuthState.Success(repository.demoUser.copy(role = role))
                }
            } catch (_: Exception) {
                _authState.value = AuthState.Success(repository.demoUser.copy(role = role))
            }
        }
    }

    fun switchRole(role: String) {
        viewModelScope.launch {
            try {
                val result = repository.loginDemo(role)
                result.onSuccess { response ->
                    _authState.value = AuthState.Success(response.user)
                }
            } catch (_: Exception) {
                _authState.value = AuthState.Success(repository.demoUser.copy(role = role))
            }
        }
    }

    fun logout() {
        try {
            repository.logout()
        } catch (_: Exception) {}
        _authState.value = AuthState.Idle
    }
}
