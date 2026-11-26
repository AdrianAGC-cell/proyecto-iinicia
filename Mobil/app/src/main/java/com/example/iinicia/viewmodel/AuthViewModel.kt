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
        if (_authState.value is AuthState.Loading) return

        try {
            _authState.value = AuthState.Idle

            com.example.iinicia.data.GoogleOAuth.iniciar(
                getApplication<Application>()
            )

        } catch (e: Exception) {
            _authState.value = AuthState.Error(
                "No se pudo abrir el acceso con Google"
            )
        }
    }

    fun completarGoogle(uri: android.net.Uri) {

        val verifier =
            com.example.iinicia.data.GoogleOAuth.consumirVerifier()
                ?: return

        val codigo = uri.getQueryParameter("code")

        if (codigo.isNullOrBlank()) {
            _authState.value = AuthState.Error(
                "Acceso con Google cancelado o no autorizado"
            )
            return
        }

        viewModelScope.launch {
            _authState.value = AuthState.Loading

            repository.completarGoogle(codigo, verifier)
                .onSuccess {
                    _authState.value = AuthState.Success(it.user)
                }
                .onFailure {
                    _authState.value = AuthState.Error(
                        it.message ?: "Error de autenticacion Google"
                    )
                }
        }
    }



    private val _mensajeCuenta = MutableStateFlow("")
    val mensajeCuenta: StateFlow<String> =
        _mensajeCuenta.asStateFlow()

    fun limpiarMensajeCuenta() {
        _mensajeCuenta.value = ""
    }

    fun register(name: String, email: String, pass: String) {
        if (_authState.value is AuthState.Loading) return

        viewModelScope.launch {
            _authState.value = AuthState.Loading

            repository.registrarAspirante(name, email, pass)
                .onSuccess {
                    _authState.value = AuthState.Idle
                    _mensajeCuenta.value =
                        "Solicitud de registro procesada. Revisa tu correo para confirmar la cuenta."
                }
                .onFailure {
                    _authState.value = AuthState.Error(
                        it.message ?: "No se pudo registrar"
                    )
                }
        }
    }

    fun recuperarPassword(email: String) {
        if (_authState.value is AuthState.Loading) return

        viewModelScope.launch {
            _authState.value = AuthState.Loading

            repository.recuperarCuenta(email)
                .onSuccess {
                    _authState.value = AuthState.Idle
                    _mensajeCuenta.value =
                        "Si existe una cuenta asociada, recibiras instrucciones de recuperacion."
                }
                .onFailure {
                    _authState.value = AuthState.Error(
                        it.message ?: "No se pudo recuperar la cuenta"
                    )
                }
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
