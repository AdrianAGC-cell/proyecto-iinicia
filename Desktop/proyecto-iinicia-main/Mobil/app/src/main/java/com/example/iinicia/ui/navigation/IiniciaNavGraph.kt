package com.example.iinicia.ui.navigation

import android.content.Intent
import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NamedNavArgument
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.example.iinicia.ui.screens.CourseDetailScreen
import com.example.iinicia.ui.screens.DashboardScreen
import com.example.iinicia.ui.screens.LoginScreen
import com.example.iinicia.ui.screens.NotificationsScreen
import com.example.iinicia.ui.screens.ProfileScreen
import com.example.iinicia.viewmodel.AuthViewModel
import com.example.iinicia.viewmodel.DashboardViewModel

@Composable
fun IiniciaNavGraph() {
    val navController = rememberNavController()
    val authViewModel: AuthViewModel = viewModel()
    val dashboardViewModel: DashboardViewModel = viewModel()

    // Static startDestination avoids NavHost initialization crashes
    NavHost(navController = navController, startDestination = "login") {
        composable("login") {
            LoginScreen(
                authViewModel = authViewModel,
                onLoginSuccess = {
                    dashboardViewModel.loadData()
                    navController.navigate("dashboard") {
                        popUpTo("login") { inclusive = true }
                    }
                }
            )
        }

        composable("dashboard") {
            val localContext = LocalContext.current
            DashboardScreen(

                dashboardViewModel = dashboardViewModel,
                authViewModel = authViewModel,
                onCourseClick = { courseId ->
                    navController.navigate("courseDetail/$courseId")
                },
                onProfileClick = {
                    navController.navigate("profile")
                },
                onNotificationsClick = {
                    navController.navigate("notifications")
                },
                onMoodleSsoClick = {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://moodle.iinicia.org/login/index.php"))
                    try {
                        localContext.startActivity(intent)
                    } catch (_: Exception) {
                    }
                }
            )
        }

        composable(
            route = "courseDetail/{courseId}",
            arguments = listOf(navArgument("courseId") { type = NavType.StringType })
        ) { backStackEntry ->
            val courseId = backStackEntry.arguments?.getString("courseId") ?: "C-TECH-101"
            CourseDetailScreen(
                courseId = courseId,
                viewModel = dashboardViewModel,
                onBackClick = { navController.popBackStack() }
            )
        }

        composable("profile") {
            ProfileScreen(
                dashboardViewModel = dashboardViewModel,
                authViewModel = authViewModel,
                onBackClick = { navController.popBackStack() },
                onLogoutSuccess = {
                    navController.navigate("login") {
                        popUpTo("dashboard") { inclusive = true }
                    }
                }
            )
        }

        composable("notifications") {
            NotificationsScreen(
                viewModel = dashboardViewModel,
                onBackClick = { navController.popBackStack() }
            )
        }
    }
}
