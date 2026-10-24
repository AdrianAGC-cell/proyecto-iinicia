package com.example.iinicia.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.iinicia.ui.theme.BrightBlue
import com.example.iinicia.ui.theme.CardBackground
import com.example.iinicia.ui.theme.CardBorder
import com.example.iinicia.ui.theme.IvoryBackground
import com.example.iinicia.ui.theme.NavyPrimary
import com.example.iinicia.ui.theme.TextMuted
import com.example.iinicia.viewmodel.DashboardViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CourseDetailScreen(
    courseId: String,
    viewModel: DashboardViewModel,
    onBackClick: () -> Unit
) {
    val course by viewModel.selectedCourse.collectAsState()

    LaunchedEffect(courseId) {
        viewModel.selectCourse(courseId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Detalle del Curso Moodle", color = Color.White) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Regresar",
                            tint = Color.White
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = NavyPrimary)
            )
        },
        containerColor = IvoryBackground
    ) { paddingValues ->
        val currentCourse = course
        if (currentCourse != null) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Course Info Card
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = CardBackground),
                        border = BorderStroke(1.dp, CardBorder)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(20.dp)
                        ) {
                            Text(
                                text = currentCourse.title,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = NavyPrimary
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = currentCourse.description,
                                fontSize = 14.sp,
                                color = TextMuted
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = "Profesor: ${currentCourse.instructor}",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = BrightBlue
                            )
                            Text(
                                text = "Periodo: ${currentCourse.semester}",
                                fontSize = 13.sp,
                                color = TextMuted
                            )
                        }
                    }
                }

                // Section Title: Activities
                item {
                    Text(
                        text = "Actividades y Tareas Moodle",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = NavyPrimary,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }

                // Tasks List
                items(currentCourse.tasks) { task ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = CardBackground),
                        border = BorderStroke(1.dp, CardBorder)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = null,
                                tint = BrightBlue,
                                modifier = Modifier.size(32.dp)
                            )
                            Spacer(modifier = Modifier.width(16.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = task.title,
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = NavyPrimary
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "Fecha límite: ${task.dueDate}",
                                    fontSize = 12.sp,
                                    color = TextMuted
                                )
                                if (task.grade != null) {
                                    Text(
                                        text = "Calificación: ${task.grade}",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color(0xFF10B981)
                                    )
                                }
                            }
                            // Status badge
                            Text(
                                text = task.status,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (task.status == "Completado") Color(0xFF10B981) else BrightBlue
                            )
                        }
                    }
                }
            }
        }
    }
}
