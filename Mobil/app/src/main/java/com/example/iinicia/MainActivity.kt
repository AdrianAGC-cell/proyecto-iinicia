package com.example.iinicia

import android.os.Bundle
import android.content.Intent
import com.example.iinicia.data.GoogleOAuth
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.example.iinicia.ui.navigation.IiniciaNavGraph
import com.example.iinicia.ui.theme.IiniciaTheme

class MainActivity : ComponentActivity() {

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        GoogleOAuth.recibir(intent.data)
    }


    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        GoogleOAuth.recibir(intent?.data)
        enableEdgeToEdge()
        setContent {
            IiniciaTheme {
                IiniciaNavGraph()
            }
        }
    }
}
