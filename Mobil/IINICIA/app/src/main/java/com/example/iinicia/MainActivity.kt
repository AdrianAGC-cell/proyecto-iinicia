package com.example.iinicia

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.example.iinicia.ui.navigation.IiniciaNavGraph
import com.example.iinicia.ui.theme.IiniciaTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            IiniciaTheme {
                IiniciaNavGraph()
            }
        }
    }
}
