package com.example.iinicia.data

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import java.util.concurrent.ConcurrentHashMap

class SecureTokenManager(context: Context) {
    // VULN-010 FIX: Memory-only fallback cache prevents persisting cleartext tokens on disk if KeyStore is unavailable
    private val memoryFallback = ConcurrentHashMap<String, String>()

    private val sharedPreferences: SharedPreferences? = try {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

        EncryptedSharedPreferences.create(
            context,
            "iinicia_secure_prefs",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    } catch (e: Exception) {
        // Safe in-memory operation if hardware KeyStore fails
        null
    }

    fun saveToken(token: String) {
        try {
            if (sharedPreferences != null) {
                sharedPreferences.edit().putString("jwt_token", token).apply()
            } else {
                memoryFallback["jwt_token"] = token
            }
        } catch (_: Exception) {}
    }

    fun getToken(): String? {
        return try {
            sharedPreferences?.getString("jwt_token", null) ?: memoryFallback["jwt_token"]
        } catch (_: Exception) {
            memoryFallback["jwt_token"]
        }
    }

    fun saveUser(user: UserDto) {
        try {
            if (sharedPreferences != null) {
                sharedPreferences.edit()
                    .putString("user_id", user.id)
                    .putString("user_name", user.name)
                    .putString("user_email", user.email)
                    .putString("user_role", user.role)
                    .putString("user_moodle_id", user.moodleId)
                    .putString("user_program", user.programName ?: "")
                    .apply()
            } else {
                memoryFallback["user_id"] = user.id
                memoryFallback["user_name"] = user.name
                memoryFallback["user_email"] = user.email
                memoryFallback["user_role"] = user.role
                memoryFallback["user_moodle_id"] = user.moodleId
                memoryFallback["user_program"] = user.programName ?: ""
            }
        } catch (_: Exception) {}
    }

    fun getUser(): UserDto? {
        return try {
            val email = sharedPreferences?.getString("user_email", null) ?: memoryFallback["user_email"] ?: return null
            val id = sharedPreferences?.getString("user_id", email) ?: memoryFallback["user_id"] ?: email
            val name = sharedPreferences?.getString("user_name", "Usuario IINICIA") ?: memoryFallback["user_name"] ?: "Usuario IINICIA"
            val role = sharedPreferences?.getString("user_role", "Estudiante") ?: memoryFallback["user_role"] ?: "Estudiante"
            val moodleId = sharedPreferences?.getString("user_moodle_id", "MOODLE-01") ?: memoryFallback["user_moodle_id"] ?: "MOODLE-01"
            val program = sharedPreferences?.getString("user_program", null) ?: memoryFallback["user_program"]
            UserDto(
                id = id,
                name = name,
                email = email,
                role = role,
                moodleId = moodleId,
                programName = program
            )
        } catch (_: Exception) {
            null
        }
    }

    fun saveUserRole(role: String) {
        try {
            if (sharedPreferences != null) {
                sharedPreferences.edit().putString("user_role", role).apply()
            } else {
                memoryFallback["user_role"] = role
            }
        } catch (_: Exception) {}
    }

    fun getUserRole(): String {
        return try {
            sharedPreferences?.getString("user_role", "Estudiante") ?: memoryFallback["user_role"] ?: "Estudiante"
        } catch (_: Exception) {
            "Estudiante"
        }
    }

    fun clear() {
        try {
            sharedPreferences?.edit()?.clear()?.apply()
            memoryFallback.clear()
        } catch (_: Exception) {}
    }
}
