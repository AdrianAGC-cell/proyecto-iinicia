package com.example.iinicia.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.iinicia.ui.theme.CardBackgroundDark
import com.example.iinicia.ui.theme.CyanAccent
import com.example.iinicia.ui.theme.TextWhite

@Composable
fun RoleSimulationBar(
    currentRole: String,
    onRoleSelected: (String) -> Unit
) {
    val roles = listOf("Estudiante", "Aspirante", "Coordinador", "Admin TI")
    val scrollState = rememberScrollState()

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(CardBackgroundDark)
            .horizontalScroll(scrollState)
            .padding(horizontal = 16.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text(
            text = "Simulador de Rol:",
            color = Color(0xFF9CA3AF),
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.align(androidx.compose.ui.Alignment.CenterVertically)
        )
        roles.forEach { role ->
            val isSelected = currentRole == role
            FilterChip(
                selected = isSelected,
                onClick = { onRoleSelected(role) },
                label = { Text(role, fontSize = 12.sp, fontWeight = FontWeight.Bold) },
                colors = FilterChipDefaults.filterChipColors(
                    containerColor = Color(0xFF1F2937),
                    labelColor = TextWhite,
                    selectedContainerColor = CyanAccent,
                    selectedLabelColor = Color.Black
                ),
                shape = RoundedCornerShape(16.dp)
            )
        }
    }
}
