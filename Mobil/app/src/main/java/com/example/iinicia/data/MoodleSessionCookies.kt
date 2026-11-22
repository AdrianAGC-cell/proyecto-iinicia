package com.example.iinicia.data

import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl

object MoodleSessionCookies : CookieJar {

    private val cookies = mutableListOf<Cookie>()

    @Synchronized
    override fun saveFromResponse(
        url: HttpUrl,
        cookies: List<Cookie>
    ) {
        for (cookie in cookies) {
            this.cookies.removeAll {
                it.name == cookie.name &&
                it.domain == cookie.domain &&
                it.path == cookie.path
            }

            if (cookie.expiresAt > System.currentTimeMillis()) {
                this.cookies.add(cookie)
            }
        }
    }

    @Synchronized
    override fun loadForRequest(url: HttpUrl): List<Cookie> {
        cookies.removeAll {
            it.expiresAt <= System.currentTimeMillis()
        }

        return cookies.filter { it.matches(url) }
    }

    @Synchronized
    fun clear() {
        cookies.clear()
    }
}
