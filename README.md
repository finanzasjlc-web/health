# Health — Plan Personal de Entrenamiento y Nutrición

Sistema de trabajo para preparar deportistas (amateur, olímpicos o profesionales) combinando entrenamiento y nutrición, escalable a varios deportistas y con una app de seguimiento (Fase 2).

## Estructura de carpetas

```
Health/
├── README.md                  ← este archivo
├── METODOLOGIA.md             ← cómo trabajamos (principios, fases, reglas)
├── PASOS_A_SEGUIR.md          ← hoja de ruta y estado actual del proyecto
├── scripts/
│   └── nuevo_deportista.ps1   ← crea la carpeta de un deportista a partir de la plantilla
├── biblioteca/                ← conocimiento compartido entre todos los deportistas
│   ├── formulas_y_calculos.md ← TMB, gasto energético, zonas, 1RM, etc.
│   ├── protocolos_tests.md    ← cómo medir el estado inicial de forma reproducible
│   └── glosario.md
├── deportistas/
│   ├── _plantilla/            ← NO editar: se copia para cada deportista nuevo
│   │   ├── README.md
│   │   ├── 00_documentos_aportados/   ← lo que trae el deportista (analíticas, informes, fotos, planes previos)
│   │   ├── 01_cuestionario_inicial.md ← anamnesis completa
│   │   ├── 02_estado_inicial.md       ← mediciones y tests objetivos
│   │   ├── 03_objetivo_principal.md   ← Fase 1 · paso 1
│   │   ├── 04_plan_entrenamiento.md   ← Fase 1 · paso 2
│   │   ├── 05_plan_nutricional.md     ← Fase 1 · paso 3
│   │   └── 06_seguimiento/
│   │       ├── registro_semanal.md
│   │       └── revisiones.md
│   └── <nombre-deportista>/   ← una carpeta por deportista (copia de _plantilla)
└── app/                       ← Fase 2: app Android + almacenamiento online
    ├── README.md              ← arquitectura, opciones y decisión
    └── modelo_datos.md        ← entidades y campos que la app debe registrar
```

## Flujo de trabajo por deportista

1. Dar de alta al deportista: `scripts\nuevo_deportista.ps1 -Nombre "nombre-apellido"`.
2. El deportista entrega su documentación en `00_documentos_aportados/` y rellena `01_cuestionario_inicial.md`.
3. Se realizan los tests de `02_estado_inicial.md` siguiendo `biblioteca/protocolos_tests.md`.
4. **Fase 1**: se fija el objetivo (03), se diseña el entrenamiento (04) y la nutrición (05). Nada se da por supuesto: toda duda se pregunta antes de cerrar un documento.
5. **Fase 2**: seguimiento en la app (ver `app/`). Mientras no exista, se usa `06_seguimiento/`.

## Reglas de oro

- Ningún dato se asume. Si falta, se pregunta y se registra quién lo aportó y cuándo.
- Todo valor medido lleva fecha, método y condiciones (ver protocolos).
- Un cambio de plan se documenta en `06_seguimiento/revisiones.md` con el motivo.
- Los documentos médicos y datos personales son confidenciales: no se suben a servicios externos sin consentimiento explícito.
