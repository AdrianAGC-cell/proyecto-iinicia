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
