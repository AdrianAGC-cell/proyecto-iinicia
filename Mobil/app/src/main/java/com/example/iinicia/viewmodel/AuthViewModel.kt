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
        AuthState.Idle
    )
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    fun login(email: String, pass: String) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            val result = repository.login(email, pass)
            result.onSuccess { response ->
                _authState.value = AuthState.Success(response.user)
            }.onFailure { err ->
                _authState.value = AuthState.Error(err.localizedMessage ?: "Error al iniciar sesión.")
            }
        }
    }

    fun loginWithGoogle() {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            val googleUser = UserDto(
                id = "usr-google-est",
                name = "Estudiante Google IINICIA",
                email = "estudiante.google@iinicia.edu.mx",
                role = "Estudiante",
                moodleId = "IIN-2026-GGL"
            )
            IiniciaRepository.currentUser = googleUser
            _authState.value = AuthState.Success(googleUser)
        }
    }

    fun register(name: String, email: String, pass: String) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            val cleanName = name.ifBlank { "Aspirante IINICIA" }
            val cleanEmail = email.ifBlank { "aspirante@iinicia.edu.mx" }
            val newUser = UserDto(
                id = "usr-asp-" + (System.currentTimeMillis() % 10000),
                name = cleanName,
                email = cleanEmail,
                role = "Aspirante",
                moodleId = "SOL-2026-" + (1000 + (System.currentTimeMillis() % 9000))
            )
            IiniciaRepository.currentUser = newUser
            _authState.value = AuthState.Success(newUser)
        }
    }

    fun logout() {
        viewModelScope.launch {
            try {
                repository.cerrarSesionMoodle()
                _authState.value = AuthState.Idle
            } catch (_: Exception) {
                _authState.value = AuthState.Error(
                    "Sesion local cerrada. No se pudo confirmar el cierre en el servidor."
                )
            }
        }
    }
}
