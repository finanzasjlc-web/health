# Metodología de trabajo

## Rol

Actuamos como un equipo de preparación física y nutrición de máximo nivel: el mismo rigor que se aplica a un deportista olímpico se aplica a cualquier deportista, adaptando el volumen y la complejidad a su nivel, tiempo y contexto.

## Principios

1. **Contrastar todo.** Cada dato (peso, marcas, horas de sueño, ingesta) se registra con fecha, método y fuente. Si un dato no está medido, se marca como `PENDIENTE` y se pregunta.
2. **No suponer.** Antes de cerrar cualquier documento se revisa la lista de dudas abiertas. Un plan no se entrega con dudas sin resolver que afecten a la seguridad o al objetivo.
3. **Seguridad primero.** Lesiones, patologías, medicación y señales de alarma condicionan el plan. Ante cualquier condición médica relevante se exige aval médico antes de empezar.
4. **Individualización.** El plan sale de los datos del deportista, no de una plantilla genérica. La plantilla solo garantiza que no se olvida nada.
5. **Medir → decidir → ajustar.** Toda decisión de ajuste se basa en datos del seguimiento, nunca en sensaciones aisladas.
6. **Entrenamiento y nutrición van juntos.** La periodización nutricional sigue a la periodización del entrenamiento (días de carga, descarga, competición).

## Fases

### Fase 1 — Diseño

| Paso | Documento | Entrada necesaria | Salida |
|---|---|---|---|
| 1. Objetivo principal | `03_objetivo_principal.md` | Cuestionario + estado inicial + documentos aportados | Objetivo SMART, fecha, criterios de éxito, objetivos secundarios |
| 2. Plan de entrenamiento | `04_plan_entrenamiento.md` | Objetivo + disponibilidad + material + tests | Macrociclo, mesociclos, microciclo tipo, sesiones, progresión, tests de control |
| 3. Plan nutricional | `05_plan_nutricional.md` | Objetivo + gasto energético + preferencias + analítica | Calorías y macros por tipo de día, timing, hidratación, suplementación justificada, menús ejemplo |

### Fase 2 — Seguimiento con app

Una vez cerrada la Fase 1 se construye la app Android (ver `app/README.md`) para registrar sesiones, peso, ingesta, sueño, sensaciones y métricas de rendimiento, con almacenamiento online automático. Hasta entonces se usa `06_seguimiento/`.

## Ciclo de revisión

- **Semanal**: revisión del registro (adherencia, carga, peso, sueño, fatiga). Ajustes menores.
- **Cada mesociclo (3-6 semanas)**: repetición de tests de control. Ajustes de bloque.
- **Hito/competición**: evaluación completa y redefinición del objetivo si procede.

## Cómo gestionamos las dudas

Cada documento de plantilla tiene al final una sección `## Dudas abiertas`. Formato:

```
- [ ] (fecha) Pregunta concreta → a quién se pregunta → respuesta (fecha)
```

Un documento no se considera cerrado mientras tenga dudas abiertas sin marcar.
