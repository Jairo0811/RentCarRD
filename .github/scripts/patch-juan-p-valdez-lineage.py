from pathlib import Path

p = Path('README.md')
s = p.read_text(encoding='utf-8')

old = '''[CineGest](https://github.com/Jairo0811/CineGest) y [MediCore](https://github.com/Jairo0811/MediCore) documentan proyectos o enunciados históricos asociados a Juan Pablo Valdez Reyes, pero sus profesores efectivos en 2026 fueron otros docentes. Por ello, esa relación se conserva únicamente como **referencia académica histórica**, no como continuidad docente.

| Tipo | Estado | Evidencia |
|---|---|---|
| 👥 Estudiante recurrente | No aplica | Proyecto académico individual |
| 👨‍🏫 Profesor recurrente | No verificado | Solo se ha documentado ISO-715 con Juan Pablo Valdez Reyes |

Esta distinción evita convertir coincidencias de período o referencias de enunciados en relaciones académicas que no están demostradas.'''

new = '''Aunque no existe una segunda asignatura verificada cursada con Juan Pablo Valdez Reyes, RentCarRD sí comparte con [**MediCore**](https://github.com/Jairo0811/MediCore) y [**CineGest**](https://github.com/Jairo0811/CineGest) un **origen documental común**: los tres problemas de negocio provienen de presentaciones de **Proyecto Final de Universidad APEC elaboradas por Juan P. Valdez en 2020**.

### 📚 Línea académica de Juan P. Valdez

Los documentos de **Dispensario Médico**, **Video Club** y **Rentcar** identifican explícitamente a **Juan P. Valdez** y establecen los requerimientos base que posteriormente dieron origen o sirvieron como referencia para MediCore, CineGest y RentCarRD.

| Orden | Enunciado académico de 2020 | Evolución en el portafolio | Relación con Juan P. Valdez |
|---:|---|---|---|
| 1 | Dispensario Médico de UNAPEC | [**MediCore**](https://github.com/Jairo0811/MediCore) | Enunciado de Proyecto Final elaborado por **Juan P. Valdez** |
| 2 | Sistema de Video Club | [**CineGest**](https://github.com/Jairo0811/CineGest) | Enunciado de Proyecto Final elaborado por **Juan P. Valdez** |
| 3 | Sistema de Rentcar | **RentCarRD** | Enunciado de Proyecto Final elaborado por **Juan P. Valdez** |

Esta relación se denomina **continuidad por origen del enunciado académico**. Es distinta de la continuidad por profesor de asignatura: Juan P. Valdez sí fue el profesor efectivo de RentCarRD en **ISO-715**, mientras que MediCore y CineGest fueron impartidos en 2026 por **Ing. Omar Antonio De Jesus De La Cruz Gonzalez**.

| Tipo | Estado | Evidencia |
|---|---|---|
| 👥 Estudiante recurrente | No aplica | Proyecto académico individual |
| 👨‍🏫 Profesor recurrente | No verificado | Solo se ha documentado ISO-715 con Juan Pablo Valdez Reyes |
| 📚 Origen de enunciado recurrente | Verificado | MediCore, CineGest y RentCarRD parten de presentaciones de Proyecto Final de **Juan P. Valdez (2020)** |

La separación entre estos ejes evita confundir al **autor/origen del enunciado** con el **profesor efectivo de cada asignatura cursada**.'''

if old not in s:
    raise SystemExit('Continuity reference block not found')
s = s.replace(old, new, 1)

p.write_text(s, encoding='utf-8')
