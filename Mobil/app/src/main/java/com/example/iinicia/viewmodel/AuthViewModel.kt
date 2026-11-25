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
        _authState.value = AuthState.Error(
            "El acceso con Google requiere autenticacion real."
        )
    }

    fun register(name: String, email: String, pass: String) {
        _authState.value = AuthState.Error(
            "Por el momento realiza tu registro desde el portal web."
        )
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
