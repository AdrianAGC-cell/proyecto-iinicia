package com.example.iinicia.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.iinicia.data.IiniciaRepository
import com.example.iinicia.ui.theme.*
import com.google.gson.JsonObject
import kotlinx.coroutines.launch

@Composable
fun AdmissionForm(
    repository: IiniciaRepository,
    onSaved: () -> Unit
) {
    val scope = rememberCoroutineScope()

    var abierto by remember { mutableStateOf(false) }
    var ocupado by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf("") }
    var mensaje by remember { mutableStateOf("") }

    var nombre by remember { mutableStateOf("") }
    var telefono by remember { mutableStateOf("") }
    var escuela by remember { mutableStateOf("") }
    var promedio by remember { mutableStateOf("") }
    var programa by remember { mutableStateOf("") }
    var acepta by remember { mutableStateOf(false) }

    var programas by remember {
        mutableStateOf<List<Pair<String, String>>>(emptyList())
    }

    if (mensaje.isNotBlank()) {
        Text(mensaje, color = BrightBlue)
    }

    OutlinedButton(
        modifier = Modifier.fillMaxWidth(),
        onClick = {
            error = ""
            mensaje = ""
            acepta = false
            programa = ""
            programas = emptyList()
            abierto = true
            ocupado = true

            scope.launch {
                try {
                    repository.getProfile().onSuccess {
                        nombre = it.name
                    }

                    repository.consultarProgramasAdmisiones()
                        .onSuccess { lista ->
                            programas = lista.mapNotNull { elemento ->
                                if (!elemento.isJsonObject) {
                                    null
                                } else {
                                    val obj = elemento.asJsonObject
                                    val id = obj.get("id")
                                        ?.takeIf { it.isJsonPrimitive }
                                        ?.asString
                                    val titulo = obj.get("title")
                                        ?.takeIf { it.isJsonPrimitive }
                                        ?.asString

                                    if (id != null && titulo != null) {
                                        id to titulo
                                    } else null
                                }
                            }

                            if (programas.isEmpty()) {
                                error = "No hay programas disponibles"
                            }
                        }
                        .onFailure {
                            error = it.message ?: "Error de conexion"
                        }
                } finally {
                    ocupado = false
                }
            }
        }
    ) {
        Text("Nueva solicitud de admision", color = BrightBlue)
    }

    if (abierto) {
        AlertDialog(
            containerColor = CardBackground,
            onDismissRequest = {
                if (!ocupado) abierto = false
            },
            title = {
                Text("Solicitud de admision", color = BrightBlue)
            },
            text = {
                Column(
                    modifier = Modifier
                        .heightIn(max = 480.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {

                    OutlinedTextField(
                        value = nombre,
                        onValueChange = { nombre = it },
                        label = { Text("Nombre completo") },
                        enabled = !ocupado
                    )

                    OutlinedTextField(
                        value = telefono,
                        onValueChange = { telefono = it },
                        label = { Text("Telefono") },
                        enabled = !ocupado
                    )

                    OutlinedTextField(
                        value = escuela,
                        onValueChange = { escuela = it },
                        label = { Text("Escuela de procedencia") },
                        enabled = !ocupado
                    )

                    OutlinedTextField(
                        value = promedio,
                        onValueChange = { promedio = it },
                        label = { Text("Promedio de 0 a 10") },
                        enabled = !ocupado
                    )

                    Text(
                        "Programa academico",
                        color = BrightBlue
                    )

                    programas.forEach { (id, titulo) ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment =
                                androidx.compose.ui.Alignment.CenterVertically
                        ) {
                            RadioButton(
                                selected = programa == id,
                                enabled = !ocupado,
                                onClick = { programa = id }
                            )

                            Text(titulo)
                        }
                    }

                    Row(
                        verticalAlignment =
                            androidx.compose.ui.Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = acepta,
                            enabled = !ocupado,
                            onCheckedChange = { acepta = it }
                        )

                        Text(
                            "Confirmo mis datos y acepto enviarlos para revision de admision."
                        )
                    }

                    if (error.isNotBlank()) {
                        Text(
                            error,
                            color = MaterialTheme.colorScheme.error
                        )
                    }

                    if (ocupado) {
                        LinearProgressIndicator(
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    enabled = !ocupado,
                    onClick = {
                        val nota = promedio
                            .replace(",", ".")
                            .toDoubleOrNull()

                        error = when {
                            nombre.trim().length !in 3..150 ->
                                "Revisa el nombre completo"

                            telefono.length > 20 ->
                                "Revisa el telefono"

                            escuela.trim().length !in 1..150 ->
                                "Indica tu escuela de procedencia"

                            nota == null || !nota.isFinite() ||
                                nota !in 0.0..10.0 ->
                                "Ingresa un promedio valido"

                            programas.none { it.first == programa } ->
                                "Selecciona un programa"

                            !acepta ->
                                "Debes confirmar el envio"

                            else -> ""
                        }

                        if (error.isBlank()) {
                            ocupado = true

                            val cuerpo = JsonObject().apply {
                                addProperty("fullName", nombre.trim())
                                addProperty("phone", telefono.trim())
                                addProperty("previousSchool", escuela.trim())
                                addProperty("averageGrade", nota)
                                addProperty("programId", programa)
                                addProperty("acceptedTerms", acepta)
                            }

                            scope.launch {
                                try {
                                    repository.crearGestion(
                                        "api/auth/admisiones/solicitudes",
                                        cuerpo
                                    ).onSuccess {
                                        abierto = false
                                        mensaje = "Solicitud registrada correctamente"
                                        onSaved()
                                    }.onFailure {
                                        error = it.message
                                            ?: "No se pudo registrar"
                                    }
                                } finally {
                                    ocupado = false
                                }
                            }
                        }
                    }
                ) {
                    Text("Enviar solicitud")
                }
            },
            dismissButton = {
                TextButton(
                    enabled = !ocupado,
                    onClick = { abierto = false }
                ) {
                    Text("Cancelar")
                }
            }
        )
    }
}
