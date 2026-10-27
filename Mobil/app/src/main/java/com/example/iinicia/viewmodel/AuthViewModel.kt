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
            val token = repository.getTokenManager().getToken()
            val savedUser = repository.getTokenManager().getUser()
            if (!token.isNullOrEmpty() && savedUser != null) {
                AuthState.Success(savedUser)
            } else {
                AuthState.Idle
            }
        } catch (_: Exception) {
            AuthState.Idle
        }
    )
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    fun login(email: String, pass: String) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            val result = repository.login(email, pass)
            result.onSuccess { response ->
                _authState.value = AuthState.Success(response.user)
            }.onFailure { err ->
                _authState.value = AuthState.Error(err.localizedMessage ?: "Error al iniciar sesión con Supabase.")
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
