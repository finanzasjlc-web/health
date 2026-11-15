# Fase 2 · App de seguimiento (Android + almacenamiento online)

Estado (2026-11-15): 🔄 **MVP construido** (sprints 1-3 + exportación). Pendiente: ejecutar el esquema SQL en Supabase, crear el repositorio en GitHub y activar Pages. Ver `SETUP.md` en esta carpeta.

Archivos:
- `supabase/schema.sql` — tablas, RLS, vistas. Se ejecuta en el SQL Editor de Supabase.
- `web/` — la PWA (HTML/CSS/JS sin build). `config.js` tiene la URL y la clave publishable.
- `../.github/workflows/pages.yml` — despliegue automático de `web/` a GitHub Pages en cada push a `main`.

## Requisitos

| Nº | Requisito | Prioridad |
|---|---|---|
| R1 | Funciona en Android (móvil del deportista) | Imprescindible |
| R2 | Los datos se guardan online de forma automática, sin acción manual | Imprescindible |
| R3 | Multi-deportista: cada uno ve solo sus datos; el preparador ve a todos | Imprescindible |
| R4 | Registro diario rápido (< 1 min): peso, sueño, energía, estrés, molestias | Imprescindible |
| R5 | Registro de sesión: planificada vs. realizada, RPE, duración, cargas/ritmos | Imprescindible |
| R6 | Registro nutricional: kcal y macros del día (manual o importado) | Alta |
| R7 | Ver el plan del día (entrenamiento + nutrición) | Alta |
| R8 | Gráficas de evolución (peso, carga, adherencia) | Alta |
| R9 | Funciona sin conexión y sincroniza después | Media |
| R10 | Importar datos de reloj (Google Fit / Health Connect, Garmin, Strava) | Media |
| R11 | Recordatorios (registro diario, sesión) | Media |
| R12 | Exportación a CSV / Excel | Media |

## Opciones de arquitectura

### Opción A — PWA + Supabase (recomendada)

- **Frontend**: Progressive Web App (React/Vite o SvelteKit). Se instala en Android desde Chrome como una app normal, con icono y pantalla completa. Funciona offline con service worker.
- **Backend / datos**: Supabase (PostgreSQL + autenticación + API REST + tiempo real). Capa gratuita suficiente para decenas de deportistas.
- **Seguridad**: Row Level Security para que cada deportista solo vea sus filas; rol "preparador" ve todo.
- **Ventajas**: un solo código, sin Play Store, base de datos SQL real, backups, gráficas fáciles, exportación directa.
- **Inconvenientes**: integración con sensores del móvil limitada (Health Connect requiere app nativa).
- **Coste**: 0 € inicialmente.

### Opción B — App nativa Android (Kotlin) + Firebase

- Kotlin + Jetpack Compose, Firebase Firestore + Auth.
- **Ventajas**: acceso completo a Health Connect, notificaciones nativas, mejor offline.
- **Inconvenientes**: más tiempo de desarrollo, distribución (APK manual o Play Store), Firestore es NoSQL (consultas y exportación más incómodas).

### Opción C — Google Sheets como base de datos + app (AppSheet o PWA)

- La hoja de cálculo es la base de datos; AppSheet genera una app Android sin código.
- **Ventajas**: rapidísimo de montar, el preparador ya ve los datos en Sheets.
- **Inconvenientes**: escala mal, poca seguridad entre deportistas, sin offline real.
- Útil como **prototipo de 1 semana** mientras se construye A.

### Decisión (2026-11-15)

> El usuario pide la opción más eficiente. **Decisión: Opción A (PWA + Supabase).** Motivos: un solo código para móvil y panel, sin Play Store ni APK, base de datos SQL con exportación directa, coste 0, y suficiente para los datos que se van a registrar (peso, sesiones, nutrición manual) dado que no hay reloj que integrar. Se descarta el prototipo en Sheets: el seguimiento en markdown cubre las primeras semanas.

Restricción confirmada: los documentos médicos (analíticas, informes) se quedan **solo en local**, en `00_documentos_aportados/`. La app no almacena archivos médicos; solo valores numéricos de seguimiento.

## Arquitectura propuesta (Opción A)

```
[Android · Chrome] ── PWA (React) ──► Supabase Auth
        │                                  │
   IndexedDB (offline)  ◄── sync ──►  PostgreSQL (RLS)
                                           │
                                  Panel preparador (misma PWA, rol admin)
                                           │
                                   Exportación CSV / gráficas
```

## Pantallas mínimas (MVP)

1. Login (email + contraseña o enlace mágico).
2. Hoy: plan del día + botón "registrar diario" + botón "registrar sesión".
3. Registro diario: formulario de 8 campos con valores por defecto del día anterior.
4. Registro de sesión: elegir sesión planificada, marcar realizada, RPE, duración, notas, cargas.
5. Nutrición: kcal/macros del día (manual) + agua.
6. Evolución: gráficas de peso (media 7 días), carga semanal, adherencia.
7. Panel preparador: lista de deportistas, alertas (sin registro 3 días, peso fuera de rango, carga ACWR > 1,3).

## Plan de desarrollo

| Sprint | Entregable |
|---|---|
| 0 | Decisión de arquitectura, cuenta Supabase, repositorio |
| 1 | Modelo de datos (ver `modelo_datos.md`), auth, RLS, registro diario |
| 2 | Registro de sesiones + plan del día (carga del plan desde 04) |
| 3 | Nutrición + gráficas |
| 4 | Offline + panel preparador + exportación |
| 5 | Pruebas con el primer deportista 2 semanas, ajustes |
| 6 | Importación de dispositivos (Strava/Garmin API) |
