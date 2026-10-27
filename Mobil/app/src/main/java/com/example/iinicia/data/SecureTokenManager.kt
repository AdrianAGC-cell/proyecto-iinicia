package com.example.iinicia.data

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class SecureTokenManager(context: Context) {
    private val sharedPreferences: SharedPreferences = try {
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
        // Fallback to standard SharedPreferences if EncryptedSharedPreferences/KeyStore fails
        context.getSharedPreferences("iinicia_insecure_fallback", Context.MODE_PRIVATE)
    }

    fun saveToken(token: String) {
        try {
            sharedPreferences.edit().putString("jwt_token", token).apply()
        } catch (_: Exception) {}
    }

    fun getToken(): String? {
        return try {
            sharedPreferences.getString("jwt_token", null)
        } catch (_: Exception) {
            null
        }
    }

    fun saveUser(user: UserDto) {
        try {
            sharedPreferences.edit()
                .putString("user_id", user.id)
                .putString("user_name", user.name)
                .putString("user_email", user.email)
                .putString("user_role", user.role)
                .putString("user_moodle_id", user.moodleId)
                .putString("user_program", user.programName ?: "")
                .apply()
        } catch (_: Exception) {}
    }

    fun getUser(): UserDto? {
        return try {
            val email = sharedPreferences.getString("user_email", null) ?: return null
            val id = sharedPreferences.getString("user_id", email) ?: email
            val name = sharedPreferences.getString("user_name", "Usuario IINICIA") ?: "Usuario IINICIA"
            val role = sharedPreferences.getString("user_role", "Estudiante") ?: "Estudiante"
            val moodleId = sharedPreferences.getString("user_moodle_id", "MOODLE-01") ?: "MOODLE-01"
            val program = sharedPreferences.getString("user_program", null)
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
            sharedPreferences.edit().putString("user_role", role).apply()
        } catch (_: Exception) {}
    }

    fun getUserRole(): String {
        return try {
            sharedPreferences.getString("user_role", "Estudiante") ?: "Estudiante"
        } catch (_: Exception) {
            "Estudiante"
        }
    }

    fun clear() {
        try {
            sharedPreferences.edit().clear().apply()
        } catch (_: Exception) {}
    }
}
