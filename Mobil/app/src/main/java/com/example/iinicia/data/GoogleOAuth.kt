package com.example.iinicia.data

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.util.Base64
import java.security.MessageDigest
import java.security.SecureRandom
import kotlinx.coroutines.flow.MutableStateFlow

object GoogleOAuth {

    const val REDIRECT =
        "com.example.iinicia://auth/callback"

    private var verifier: String? = null
    private var iniciado: Long = 0

    val retorno = MutableStateFlow<Uri?>(null)

    private fun base64(bytes: ByteArray): String =
        Base64.encodeToString(
            bytes,
            Base64.URL_SAFE or
                Base64.NO_WRAP or
                Base64.NO_PADDING
        )

    fun iniciar(context: Context) {

        val bytes = ByteArray(32)
        SecureRandom().nextBytes(bytes)

        val codigo = base64(bytes)

        verifier = codigo
        iniciado = System.currentTimeMillis()
        retorno.value = null

        val challenge = base64(
            MessageDigest.getInstance("SHA-256")
                .digest(codigo.toByteArray(Charsets.US_ASCII))
        )

        val url = Uri.parse(
            SupabaseClient.SUPABASE_URL + "/auth/v1/authorize"
        ).buildUpon()
            .appendQueryParameter("provider", "google")
            .appendQueryParameter("redirect_to", REDIRECT)
            .appendQueryParameter("code_challenge", challenge)
            .appendQueryParameter("code_challenge_method", "s256")
            .appendQueryParameter("prompt", "select_account")
            .build()

        try {
            context.startActivity(
                Intent(Intent.ACTION_VIEW, url)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            )
        } catch (e: Exception) {
            verifier = null
            iniciado = 0
            throw e
        }
    }

    fun recibir(uri: Uri?) {
        if (
            uri?.scheme == "com.example.iinicia" &&
            uri.host == "auth" &&
            uri.path == "/callback" &&
            verifier != null
        ) {
            retorno.value = uri
        }
    }

    fun consumirVerifier(): String? {
        val codigo = verifier
        verifier = null
        retorno.value = null

        val vigente =
            System.currentTimeMillis() - iniciado in 0L..600000L

        iniciado = 0

        return if (vigente) codigo else null
    }
}
