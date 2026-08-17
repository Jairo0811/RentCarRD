from pathlib import Path
import re

path = Path('README.md')
text = path.read_text(encoding='utf-8')
section = '''## 🧭 Continuidad académica

**RentCarRD** forma parte de la colección de proyectos académicos documentados de Francis Jairo Matías Rosario en la Universidad APEC (UNAPEC). Siguiendo el mismo criterio aplicado en EcoSoft, la continuidad se registra únicamente cuando existe una coincidencia verificable por **estudiante** o **profesor**; compartir período académico o una referencia histórica no se considera suficiente por sí solo.

### 👥 Continuidad por estudiante

RentCarRD fue desarrollado como proyecto académico individual por **Francis Jairo Matías Rosario (A00115261)**. Por esa razón, no existe un equipo de compañeros dentro de este proyecto que permita establecer una continuidad estudiantil con otro repositorio.

### 👨‍🏫 Continuidad por profesor

El profesor de **Desarrollo de Software con Tecnología Open Source 2 (ISO-715)** fue **Juan Pablo Valdez Reyes**. En la colección actual no se ha verificado una segunda asignatura cursada por Francis Jairo Matías Rosario con el mismo profesor.

[CineGest](https://github.com/Jairo0811/CineGest) y [MediCore](https://github.com/Jairo0811/MediCore) documentan proyectos o enunciados históricos asociados a Juan Pablo Valdez Reyes, pero sus profesores efectivos en 2026 fueron otros docentes. Por ello, esa relación se conserva únicamente como **referencia académica histórica**, no como continuidad docente.

| Tipo | Estado | Evidencia |
|---|---|---|
| 👥 Estudiante recurrente | No aplica | Proyecto académico individual |
| 👨‍🏫 Profesor recurrente | No verificado | Solo se ha documentado ISO-715 con Juan Pablo Valdez Reyes |

Esta distinción evita convertir coincidencias de período o referencias de enunciados en relaciones académicas que no están demostradas.
'''
pattern = r'## 🔗 Continuidad académica.*?(?=\n## 🛠️ Stack tecnológico)'
new = re.sub(pattern, section.rstrip(), text, flags=re.S)
if new == text:
    raise SystemExit('Continuity section not found')
path.write_text(new, encoding='utf-8')
