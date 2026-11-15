# Pasos a seguir

Última actualización: 2026-11-15

## Estado

| Paso | Estado |
|---|---|
| Estructura del proyecto y plantillas | ✅ Hecho |
| Alta del primer deportista (`deportistas/deportista-01`, el propio usuario) | ✅ 2026-11-15 |
| Documentación inicial recibida | 🔄 Falta copiar la analítica en `00_documentos_aportados/` |
| Cuestionario inicial completo | 🔄 Parcial; ver bloques A/B/C de dudas en `01` |
| Tests de estado inicial | ⬜ Se hace en el gimnasio con el protocolo de la biblioteca |
| Fase 1 · Objetivo principal | 🔄 Borrador en `03`, pendiente de métricas y validación |
| Fase 1 · Plan de entrenamiento | ⬜ |
| Fase 1 · Plan nutricional | ⬜ |
| Fase 2 · Decisión de arquitectura de la app | ✅ PWA + Supabase (ver `app/README.md`) |
| Fase 2 · MVP de la app (código) | ✅ 2026-11-15 · `app/web/` + `app/supabase/schema.sql` |
| Fase 2 · Esquema ejecutado en Supabase | ⬜ Usuario, ver `app/SETUP.md` paso 1 |
| Fase 2 · Repositorio GitHub + Pages | ⬜ Usuario, ver `app/SETUP.md` paso 2 |
| Fase 2 · Prueba en Android con datos reales | ⬜ |
| Fase 2 · Pantalla para cargar plan (sesiones y nutrición) | ⬜ Sprint siguiente |
| Fase 2 · Panel preparador con alertas | ⬜ Sprint siguiente (vista `v_alertas` ya existe) |

## Siguientes acciones (en orden)

### 1. Dar de alta al primer deportista
```powershell
.\scripts\nuevo_deportista.ps1 -Nombre "nombre-apellido"
```

### 2. Recopilar la documentación inicial
El deportista deja en `deportistas/<nombre>/00_documentos_aportados/` todo lo de la checklist de su README. Mínimo imprescindible para empezar:
- Analítica reciente o fecha de la próxima.
- Medicación y lesiones actuales.
- Registro de comidas de 3 días.
- Disponibilidad semanal y material.

### 3. Rellenar el cuestionario inicial (`01`)
Primero el deportista por escrito; después entrevista de 45-60 min para contrastar y completar. Anotar dudas abiertas.

### 4. Sesión de tests (`02`)
Según `biblioteca/protocolos_tests.md`. Si hay cualquier señal de riesgo cardiovascular o patología, antes se pide aval médico (y prueba de esfuerzo si es posible).

### 5. Fase 1
1. `03_objetivo_principal.md`: se redacta y se valida con el deportista. No se avanza sin su "sí".
2. `04_plan_entrenamiento.md`: primer mesociclo detallado, resto del macrociclo a nivel de bloque.
3. `05_plan_nutricional.md`: cálculo energético, macros por tipo de día, menús ejemplo.
4. Cerrar todas las dudas abiertas de 01-05.

### 6. Arrancar el seguimiento en markdown
Copiar `06_seguimiento/registro_semanal.md` a `semana_01.md` y empezar a registrar. Esto genera los datos reales con los que probar la app.

### 7. Fase 2 · App
1. Confirmar arquitectura (propuesta: PWA + Supabase; ver `app/README.md`).
2. Crear cuenta Supabase y repositorio.
3. Sprints 1-5 del plan de desarrollo.
4. Migrar los registros de markdown a la app.

## Decisiones tomadas

- [x] Primer deportista: el propio usuario. Gimnasio 4 días + 1 Hyrox/endurance. Nivel avanzado. (2026-11-15)
- [x] Sin evento: objetivo a largo plazo, ganar masa muscular tras pérdida de peso. (2026-11-15)
- [x] Tiene analítica (pendiente de entregar). Aval médico: pendiente.
- [x] Dispositivos: báscula. Sin reloj. (2026-11-15)
- [x] App: PWA + Supabase. (2026-11-15)
- [x] Documentos médicos: solo en local. (2026-11-15)

## Decisiones pendientes del usuario

- [ ] Responder el bloque A de dudas de `deportistas/deportista-01/01_cuestionario_inicial.md` (datos básicos, analítica, lesiones, marcas de fuerza, comidas, sueño).
- [ ] Responder el bloque B (días/horas, rutina actual, contenido del día Hyrox, material).
- [ ] Validar el borrador de objetivo en `03_objetivo_principal.md`.
- [ ] ¿Se usará control de versiones (git) para esta carpeta?
