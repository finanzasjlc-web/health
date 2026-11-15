# Modelo de datos

Diseñado para coincidir con los documentos de la plantilla, de modo que lo registrado en papel/markdown durante la Fase 1 se pueda migrar a la app.

## Entidades

### deportista
| Campo | Tipo | Nota |
|---|---|---|
| id | uuid | |
| user_id | uuid | referencia a auth |
| nombre | text | |
| fecha_nacimiento | date | |
| sexo | text | |
| altura_cm | numeric | |
| deporte | text | |
| nivel | text | |
| preparador_id | uuid | |
| activo | boolean | |

### registro_diario
| Campo | Tipo | Nota |
|---|---|---|
| id | uuid | |
| deportista_id | uuid | |
| fecha | date | único por deportista+fecha |
| peso_kg | numeric | |
| sueno_h | numeric | |
| calidad_sueno | int 1-10 | |
| fc_reposo | int | |
| hrv_ms | numeric | opcional |
| energia | int 1-10 | |
| estres | int 1-10 | |
| dolor | text | zona + intensidad |
| hambre | int 1-10 | |
| pasos | int | |
| notas | text | |
| creado_en / actualizado_en | timestamp | |

### sesion_planificada
| Campo | Tipo |
|---|---|
| id | uuid |
| deportista_id | uuid |
| plan_version | text |
| fecha | date |
| nombre | text |
| tipo | text (fuerza / resistencia / técnica / movilidad / descanso) |
| duracion_prevista_min | int |
| intensidad_objetivo | text |
| detalle_json | jsonb (ejercicios, series, reps, cargas) |

### sesion_realizada
| Campo | Tipo |
|---|---|
| id | uuid |
| sesion_planificada_id | uuid nullable |
| deportista_id | uuid |
| fecha | date |
| estado | text (completa / parcial / no realizada) |
| duracion_min | int |
| rpe | int 1-10 |
| carga_srpe | int (calculado) |
| fc_media / fc_max | int |
| distancia_km / potencia_media_w / ritmo | numeric |
| detalle_json | jsonb (series reales, cargas, reps) |
| notas | text |
| fuente | text (manual / strava / garmin / health_connect) |

### registro_nutricion
| Campo | Tipo |
|---|---|
| id | uuid |
| deportista_id | uuid |
| fecha | date |
| kcal | int |
| proteina_g / carbohidratos_g / grasas_g / fibra_g | numeric |
| agua_l | numeric |
| adherencia | int 0-100 |
| tipo_dia | text (fuerte / ligero / descanso / competición) |
| notas | text |
| fuente | text (manual / app externa) |

### plan_nutricional
| Campo | Tipo |
|---|---|
| id | uuid |
| deportista_id | uuid |
| version | text |
| vigente_desde / vigente_hasta | date |
| objetivos_json | jsonb (kcal y macros por tipo de día) |

### medicion
Para antropometría y tests repetidos (equivalente a `02_estado_inicial.md` y `revisiones.md`).
| Campo | Tipo |
|---|---|
| id | uuid |
| deportista_id | uuid |
| fecha | date |
| tipo | text (peso / pliegue / perimetro / 1RM / test_resistencia / …) |
| nombre | text (ej. "sentadilla", "cintura", "5km") |
| valor | numeric |
| unidad | text |
| metodo | text |
| condiciones | text |

### documento
Metadatos de los archivos aportados (el archivo en storage).
| Campo | Tipo |
|---|---|
| id | uuid |
| deportista_id | uuid |
| fecha | date |
| tipo | text (analitica / informe / foto / plan_previo / export) |
| url_storage | text |
| notas | text |

## Vistas / cálculos derivados

- `peso_media_7d` por deportista y fecha.
- `carga_semanal` = Σ carga_srpe por semana ISO.
- `acwr` = carga 7 días / media carga 28 días.
- `adherencia_semanal` = sesiones completas / planificadas.
- Alertas: sin registro ≥ 3 días; ACWR > 1,3 o < 0,8; peso media 7 d fuera del rango esperado; sueño < 6 h 3 días seguidos.

## Seguridad

- Row Level Security: `deportista_id` debe coincidir con el usuario autenticado, o el usuario debe tener rol `preparador` asignado a ese deportista.
- Datos de salud: cifrado en reposo (Supabase lo incluye), consentimiento explícito registrado en `deportista`.
