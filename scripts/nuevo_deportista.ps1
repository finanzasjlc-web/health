<#
.SYNOPSIS
  Crea la carpeta de un nuevo deportista a partir de deportistas/_plantilla.
.EXAMPLE
  .\scripts\nuevo_deportista.ps1 -Nombre "juan-perez"
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$Nombre
)

$ErrorActionPreference = 'Stop'

$raiz = Split-Path -Parent $PSScriptRoot
$plantilla = Join-Path $raiz 'deportistas\_plantilla'
$destino = Join-Path $raiz "deportistas\$Nombre"

if (-not (Test-Path $plantilla)) { throw "No existe la plantilla en $plantilla" }
if (Test-Path $destino) { throw "Ya existe la carpeta $destino" }

Copy-Item -Path $plantilla -Destination $destino -Recurse

$fecha = Get-Date -Format 'yyyy-MM-dd'
Get-ChildItem -Path $destino -Recurse -Filter '*.md' | ForEach-Object {
    $contenido = Get-Content $_.FullName -Raw -Encoding UTF8
    $contenido = $contenido -replace '\{\{NOMBRE\}\}', $Nombre -replace '\{\{FECHA_ALTA\}\}', $fecha
    Set-Content -Path $_.FullName -Value $contenido -Encoding UTF8 -NoNewline
}

Write-Host "Deportista creado en $destino"
Write-Host "Siguiente paso: entregar documentos en 00_documentos_aportados y rellenar 01_cuestionario_inicial.md"
