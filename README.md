<p align="center">
  <img
    src="docs/images/portada-rentcarrd.png"
    alt="Portada oficial de RentCarRD"
    width="720"
  />
</p>

<p align="center">
    <img src="https://img.shields.io/badge/UNAPEC-ISO--715-003B70?style=for-the-badge" alt="UNAPEC ISO-715">
</p>

<p align="center">
  <strong>Aplicación web para administrar clientes, empleados, vehículos, inspecciones, rentas, devoluciones y reportes.</strong><br>
  Desarrollada con Angular, ASP.NET Core Web API, Entity Framework Core y Microsoft SQL Server.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Estado-Finalizado-success" alt="Estado del proyecto" />
  <img src="https://img.shields.io/badge/Versión-1.2-blue" alt="Versión" />
  <img src="https://img.shields.io/badge/Entrega-Académica%20Completada-success" alt="Entrega académica" />
  <img src="https://img.shields.io/badge/Proyecto-Académico%20y%20Portafolio-purple" alt="Tipo de proyecto" />
</p>


## 📖 Descripción

**RentCarRD** es una aplicación web orientada a la gestión operativa de empresas de alquiler de vehículos.

El sistema centraliza el registro de clientes, empleados, vehículos, catálogos, inspecciones, rentas y devoluciones. También aplica reglas de negocio para controlar la disponibilidad de la flota, valida los datos relevantes del dominio y genera contratos y reportes financieros en PDF y Excel.

El proyecto utiliza una arquitectura cliente-servidor:

- **Frontend:** Angular y TypeScript.
- **Backend:** ASP.NET Core Web API y C#.
- **Persistencia:** Entity Framework Core y Microsoft SQL Server.
- **Comunicación:** API REST mediante HTTP y JSON.

RentCarRD forma parte de una colección de proyectos académicos desarrollados en la **Universidad APEC (UNAPEC)**, tomando como referencia proyectos propuestos por el profesor **Juan Pablo Valdez Reyes**.

---

| Información | Detalle |
|---|---|
| 👨‍🎓 Estudiante | **Francis Jairo Matías Rosario** |
| 🆔 Matrícula | **A00115261** |
| 📖 Asignatura | **Desarrollo de Software con Tecnología Open Source 2 (ISO-715)** |
| 👨‍🏫 Profesor | **Juan Pablo Valdez Reyes** |
| 🏫 Institución | **Universidad APEC (UNAPEC)** |
| 📅 Período académico | **Mayo - Agosto 2026** |



## 🧭 Continuidad académica

**RentCarRD** forma parte de la colección de proyectos académicos documentados de Francis Jairo Matías Rosario en la Universidad APEC (UNAPEC). Siguiendo el mismo criterio aplicado en EcoSoft, la continuidad se registra únicamente cuando existe una coincidencia verificable por **estudiante** o **profesor**; compartir período académico o una referencia histórica no se considera suficiente por sí solo.

### 👥 Continuidad por estudiante

RentCarRD fue desarrollado como proyecto académico individual por **Francis Jairo Matías Rosario (A00115261)**. Por esa razón, no existe un equipo de compañeros dentro de este proyecto que permita establecer una continuidad estudiantil con otro repositorio.

### 👨‍🏫 Continuidad por profesor

El profesor de **Desarrollo de Software con Tecnología Open Source 2 (ISO-715)** fue **Juan Pablo Valdez Reyes**. En la colección actual no se ha verificado una segunda asignatura cursada por Francis Jairo Matías Rosario con el mismo profesor.

Aunque no existe una segunda asignatura verificada cursada con Juan Pablo Valdez Reyes, RentCarRD sí comparte con [**MediCore**](https://github.com/Jairo0811/MediCore) y [**CineGest**](https://github.com/Jairo0811/CineGest) un **origen documental común**: los tres problemas de negocio provienen de presentaciones de **Proyecto Final de Universidad APEC elaboradas por Juan P. Valdez en 2020**.

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
| 👥 Estudiante | No aplica | Proyecto académico individual |
| 👨‍🏫 Profesor | No verificado | Solo se ha documentado ISO-715 con Juan Pablo Valdez Reyes |
| 📚 Origen de enunciado recurrente | Verificado | MediCore, CineGest y RentCarRD parten de presentaciones de Proyecto Final de **Juan P. Valdez (2020)** |

La separación entre estos ejes evita confundir al **autor/origen del enunciado** con el **profesor efectivo de cada asignatura cursada**.

## 🛠️ Stack tecnológico

### 🎨 Frontend y diseño de interfaces

<p>
  <img src="https://skillicons.dev/icons?i=angular,ts,html,css,bootstrap" alt="Angular, TypeScript, HTML, CSS y Bootstrap" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/chartjs/chartjs-original.svg" alt="Chart.js" title="Chart.js" width="48" height="48" />
</p>

<p>
  <img src="https://img.shields.io/badge/SweetAlert2-Alertas-7066E0?style=flat-square&logo=javascript&logoColor=white" alt="SweetAlert2" />
  <img src="https://img.shields.io/badge/jsPDF-Reportes%20PDF-F43F5E?style=flat-square&logo=javascript&logoColor=white" alt="jsPDF" />
  <img src="https://img.shields.io/badge/ExcelJS-Excel-217346?style=flat-square&logo=microsoftexcel&logoColor=white" alt="ExcelJS" />
</p>

- **Angular 21:** construcción de la aplicación web SPA.
- **TypeScript:** lógica, tipado y componentes del cliente.
- **HTML5:** estructura semántica de las vistas.
- **CSS3:** estilos personalizados.
- **Bootstrap 5:** diseño responsivo y componentes visuales.
- **SweetAlert2:** alertas visuales para mensajes de éxito, error, advertencia e información.
- **Chart.js y ng2-charts:** gráficos del dashboard.
- **jsPDF y jsPDF AutoTable:** generación de contratos y reportes PDF.
- **ExcelJS:** exportación de reportes a Excel, cargada bajo demanda.

### ⚙️ Backend, frameworks y APIs

<p>
  <img src="https://skillicons.dev/icons?i=dotnet,cs" alt=".NET y C#" />
</p>

<p>
  <img src="https://img.shields.io/badge/ASP.NET%20Core-Web%20API-512BD4?style=flat-square&logo=dotnet&logoColor=white" alt="ASP.NET Core Web API" />
  <img src="https://img.shields.io/badge/Entity%20Framework%20Core-512BD4?style=flat-square&logo=dotnet&logoColor=white" alt="Entity Framework Core" />
  <img src="https://img.shields.io/badge/Swagger-OpenAPI-85EA2D?style=flat-square&logo=swagger&logoColor=black" alt="Swagger y OpenAPI" />
</p>

- **ASP.NET Core Web API:** exposición de los endpoints REST.
- **C#:** reglas de negocio, controladores y servicios del backend.
- **Entity Framework Core:** acceso, mapeo y persistencia de datos.
- **HTTP y JSON:** comunicación entre Angular y la API.
- **Swagger/OpenAPI:** exploración y prueba de endpoints.

### 🗄️ Base de datos y persistencia

<p>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/microsoftsqlserver/microsoftsqlserver-plain.svg" alt="Microsoft SQL Server" width="48" height="48" />
</p>

- **Microsoft SQL Server:** base de datos relacional principal.
- **Migraciones de Entity Framework Core:** evolución controlada del esquema.
- **Script `RentCarDB.sql`:** creación y preparación inicial de la base de datos.
- **Almacenamiento local de imágenes:** recursos de vehículos publicados desde el backend.

### 🧰 Herramientas de desarrollo

<p>
  <img src="https://skillicons.dev/icons?i=npm,visualstudio,vscode,git,github" alt="npm, Visual Studio, Visual Studio Code, Git y GitHub" />
</p>

- **Visual Studio:** desarrollo y depuración del backend.
- **Visual Studio Code:** desarrollo del frontend y edición general.
- **SQL Server Management Studio:** administración y validación de la base de datos.
- **npm y Angular CLI:** dependencias, compilación y ejecución del frontend.
- **Git y GitHub:** control de versiones y publicación del proyecto.

---

## 🏗️ Arquitectura

```text
┌──────────────────────────┐
│ Angular + TypeScript     │
│ Frontend SPA             │
└────────────┬─────────────┘
             │ HTTP / JSON
             ▼
┌──────────────────────────┐
│ ASP.NET Core Web API     │
│ Controladores y reglas   │
└────────────┬─────────────┘
             │ Entity Framework Core
             ▼
┌──────────────────────────┐
│ Microsoft SQL Server     │
│ Persistencia de datos    │
└──────────────────────────┘
```

El frontend funciona como una **Single Page Application (SPA)**. La API expone endpoints REST para las operaciones de clientes, empleados, vehículos, catálogos, inspecciones, rentas y devoluciones.

---

## ✨ Funcionalidades principales

### 📊 Dashboard ejecutivo

- Indicadores operativos de la empresa.
- Total de vehículos registrados.
- Vehículos disponibles, rentados y no disponibles.
- Total de clientes.
- Rentas activas y concluidas.
- Ingresos acumulados.
- Últimas rentas registradas.
- Vehículos agregados recientemente.
- Gráficos y accesos rápidos a los módulos principales.

### 👤 Gestión de clientes

- Registro, edición, consulta y eliminación de clientes.
- Activación e inactivación de registros.
- Clasificación por tipo de persona:
  - Persona física.
  - Persona jurídica.
- Validación de **cédula dominicana** para personas físicas.
- Validación de **RNC dominicano** para personas jurídicas.
- Formato automático del documento según el tipo de persona.
- Prevención de cédulas y RNC duplicados.
- Registro y validación del límite de crédito.
- Restricción de valores negativos.
- El sistema no recibe ni almacena números de tarjeta, CVV ni fechas de expiración.
- Una futura integración de pagos debe usar tokens de un proveedor certificado PCI DSS.

### 👨‍💼 Gestión de empleados

- Registro, edición y eliminación de empleados.
- Activación e inactivación de cuentas.
- Validación del nombre completo.
- Validación y formato de cédula dominicana.
- Prevención de cédulas duplicadas.
- Prevención de usuarios de acceso duplicados.
- Selección de tanda desde una lista.
- Validación del porcentaje de comisión.
- Selección del estado desde una lista.
- Inicio de sesión para administrador y empleados.
- Asociación automática del empleado responsable a cada renta.

### 🚗 Gestión de vehículos

- Registro, edición, consulta y eliminación de vehículos.
- Carga y vista previa de imágenes.
- Buscador en tiempo real.
- Búsqueda por descripción, marca, modelo, placa, chasis, motor, tipo, combustible y estado.
- Filtros por estado operativo.
- Contadores de vehículos disponibles, rentados y no disponibles.
- Validación de placa alfanumérica.
- Validación de chasis.
- Conversión automática de placa, chasis y motor a mayúsculas.
- Prevención de placas y chasis duplicados.
- Selección de marca, modelo, tipo de vehículo y combustible desde catálogos.
- Estados operativos:
  - `Disponible`.
  - `Rentado`.
  - `NoDisponible`.

### 📚 Catálogos

- Marcas.
- Modelos relacionados con marcas.
- Tipos de vehículos.
- Tipos de combustible.

Los valores controlados se seleccionan desde listas para evitar inconsistencias y texto libre innecesario.

### 🔍 Inspección de flota

- Registro de inspecciones.
- Asociación con cliente y vehículo.
- Estado de las gomas.
- Estado de los cristales.
- Goma de repuesto.
- Gato hidráulico.
- Nivel de combustible.
- Ralladuras.
- Observaciones generales.

### 🔑 Gestión de rentas

- Registro de contratos de renta.
- Selección de cliente, empleado y vehículo.
- Asociación del empleado autenticado.
- Validación de cantidad de días y tarifa diaria.
- Cálculo automático de:
  - Subtotal.
  - ITBIS del 18 %.
  - Total a pagar.
- Cálculo de la fecha estimada de devolución.
- Cambio automático del vehículo de `Disponible` a `Rentado`.
- Restricción para impedir rentar vehículos no disponibles.
- Generación de contrato profesional en PDF.

### 🔄 Gestión de devoluciones

- Procesamiento de la devolución del vehículo.
- Cambio automático de la renta a `Concluida`.
- Registro de la fecha de devolución.
- Cambio del vehículo devuelto a `NoDisponible`.
- Bloqueo para impedir que un vehículo devuelto vuelva a rentarse.
- Conservación del historial completo de la operación.

### 🔔 Alertas y retroalimentación visual

- Mensajes de éxito, error, advertencia e información mediante SweetAlert2.
- Sustitución de las ventanas genéricas del navegador para las operaciones principales.
- Estilo visual consistente con la interfaz del sistema.
- Mensajes más claros para validaciones y resultados de operaciones.

### 📄 Contratos y reportes PDF

- Contrato profesional de renta.
- Reporte general de rentas.
- Información de la empresa.
- Información del cliente.
- Información del vehículo.
- Marca, modelo y placa.
- Información del empleado responsable.
- Fecha de renta y devolución.
- Estado de la operación.
- Tarifa diaria y cantidad de días.
- Subtotal, ITBIS y total.
- Resumen financiero.
- Espacios para firmas del cliente y representante.
- Formato listo para impresión.

### 📊 Exportación a Excel

El reporte de rentas puede exportarse a un archivo `.xlsx` con:

- Hoja **Rentas**, con el detalle de las operaciones.
- Hoja **Resumen**, con indicadores y totales financieros.
- Subtotal acumulado.
- ITBIS acumulado.
- Total general facturado.

---

## ✅ Validaciones implementadas

RentCarRD aplica validaciones tanto en el frontend como en el backend para proteger la integridad de los datos.

| Módulo | Validaciones principales |
|---|---|
| Clientes | Cédula, RNC, documento duplicado, nombre y límite de crédito |
| Empleados | Nombre, usuario único, contraseña robusta, rol, cédula, tanda, comisión y estado |
| Vehículos | Placa, chasis, año, catálogos y estado operativo |
| Rentas | Cliente, empleado, vehículo, disponibilidad, tarifa y cantidad de días |
| Finanzas | Subtotal, ITBIS y total calculados automáticamente |

---

## 🔐 Roles y acceso

### 👑 Administrador

Tiene acceso a:

- Dashboard.
- Clientes.
- Empleados.
- Vehículos.
- Catálogos.
- Inspecciones.
- Rentas y devoluciones.
- Reportes PDF y Excel.

### 👨‍💼 Empleado

Puede:

- Registrar clientes.
- Consultar vehículos.
- Registrar rentas.
- Procesar operaciones permitidas.
- Generar contratos.

Cada renta queda asociada automáticamente al empleado que realizó la operación.

La API exige un JWT válido por defecto. El identificador del empleado en rentas e
inspecciones se toma del token y no del cuerpo enviado por el navegador.

---

## 📂 Estructura del proyecto

```text
RentCarRD
│
├── RentCar.API
│   └── RentCar.API
│       ├── Controllers
│       ├── Contracts
│       ├── Migrations
│       ├── Models
│       ├── Security
│       ├── Services
│       ├── Properties
│       ├── wwwroot
│       │   └── vehiculos
│       ├── Program.cs
│       └── appsettings.json
│
├── RentCarClient
│   ├── public
│   │   └── images
│   ├── src
│   │   └── app
│   │       ├── components
│   │       ├── services
│   │       ├── app.routes.ts
│   │       └── app.config.ts
│   ├── angular.json
│   ├── package.json
│   └── tsconfig.app.json
│
├── RentCarDB.sql
└── README.md
```

---

## 📋 Requisitos previos

Antes de ejecutar el proyecto, instala:

- .NET SDK 10.
- Una versión de Node.js compatible con Angular 21 y npm.
- Microsoft SQL Server.
- SQL Server Management Studio.
- Visual Studio 2022 o Visual Studio Code.

---

## 🚀 Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/Jairo0811/RentCarRD.git
cd RentCarRD
```

### 2. Configurar la base de datos

1. Abrir Microsoft SQL Server Management Studio.
2. Ejecutar el archivo:

```text
RentCarDB.sql
```

El script es idempotente: no borra registros, no crea cuentas conocidas y elimina
las columnas heredadas que contenían información de tarjetas. Realiza antes una
copia de seguridad si estás actualizando una base antigua; esa eliminación es
intencional e irreversible.

### 3. Configurar secretos y crear el administrador inicial

```bash
cd RentCar.API/RentCar.API
dotnet restore
dotnet dev-certs https --trust
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=(localdb)\\MSSQLLocalDB;Database=RentCarDB;Trusted_Connection=True;TrustServerCertificate=True;"
dotnet user-secrets set "Jwt:Key" "REEMPLAZAR_POR_UN_SECRETO_ALEATORIO_DE_32_O_MAS_CARACTERES"
dotnet user-secrets set "SeedAdmin:Enabled" "true"
dotnet user-secrets set "SeedAdmin:Usuario" "tu-administrador"
dotnet user-secrets set "SeedAdmin:Nombre" "Nombre del administrador"
dotnet user-secrets set "SeedAdmin:Cedula" "CEDULA_VALIDA_DE_11_DIGITOS"
dotnet user-secrets set "SeedAdmin:Password" "UNA_CONTRASENA_UNICA_DE_12_O_MAS_CARACTERES"
dotnet user-secrets set "Database:MigrateOnStartup" "true"
```

Los valores anteriores son marcadores, no credenciales funcionales. Usa valores
propios y no los publiques. En producción configura equivalentes mediante un
gestor de secretos o variables de entorno (`Jwt__Key`,
`ConnectionStrings__DefaultConnection`, etc.).

Configura también el host y origen reales. La API rechaza comodines de host y
orígenes HTTP cuando no está en Development:

```text
AllowedHosts=api.rentcar.example
Cors__AllowedOrigins__0=https://rentcar.example
```

### 4. Ejecutar el backend

```bash
dotnet build
dotnet run
```

El primer inicio aplica la migración y crea el administrador únicamente en
Development. Después de confirmar que puedes iniciar sesión, detén la API y
desactiva el sembrado:

```bash
dotnet user-secrets set "SeedAdmin:Enabled" "false"
```

Las cuentas heredadas reciben el rol `Empleado`, pero quedan sin contraseña por
seguridad: el administrador debe asignarles una nueva desde el módulo Empleados.
La cédula anterior nunca se reutiliza como contraseña.

Swagger estará disponible normalmente en:

```text
https://localhost:7162/swagger
```

### 5. Ejecutar el frontend

En otra terminal, desde la raíz del repositorio:

```bash
cd RentCarClient
npm ci
npm start
```

La aplicación estará disponible normalmente en:

```text
http://localhost:4200
```

El token se mantiene durante la pestaña actual y se adjunta automáticamente como
`Authorization: Bearer ...`. Al expirar o recibir un `401`, la sesión se cierra.

---

## 🧪 Flujo de prueba recomendado

1. Iniciar sesión como administrador.
2. Registrar o verificar los catálogos.
3. Registrar un empleado y comprobar las validaciones de usuario, cédula, tanda y comisión.
4. Registrar un cliente físico con cédula.
5. Registrar un cliente jurídico con RNC.
6. Registrar un vehículo con imagen.
7. Crear una inspección.
8. Registrar una renta.
9. Verificar el cálculo de subtotal, ITBIS y total.
10. Confirmar que el vehículo cambie a `Rentado`.
11. Generar el contrato PDF.
12. Exportar el reporte a Excel.
13. Procesar la devolución.
14. Verificar que:
    - la renta aparezca como `Concluida`;
    - se muestre la fecha de devolución;
    - el vehículo aparezca como `NoDisponible`;
    - el vehículo no pueda volver a rentarse;
    - los reportes reflejen correctamente la operación.

---

## 📊 Estado del proyecto

| Módulo | Estado |
|---|:---:|
| Dashboard | ✅ Finalizado |
| Clientes | ✅ Finalizado |
| Empleados | ✅ Finalizado |
| Vehículos | ✅ Finalizado |
| Catálogos | ✅ Finalizado |
| Inspecciones | ✅ Finalizado |
| Rentas | ✅ Finalizado |
| Devoluciones | ✅ Finalizado |
| Contratos PDF | ✅ Finalizado |
| Reportes PDF | ✅ Finalizado |
| Exportación Excel | ✅ Finalizado |
| Validación de cédula y RNC | ✅ Finalizado |
| Alertas SweetAlert2 | ✅ Integrado |
| Login y roles | ✅ Finalizado |
| API REST | ✅ Finalizado |
| SQL Server | ✅ Finalizado |

---

## 🗺️ Mejoras futuras

- Migración gradual de CSS a SCSS.
- Migración de confirmaciones nativas restantes a SweetAlert2.
- Loader global y manejo centralizado de errores HTTP.
- Reservas y calendario de disponibilidad.
- Historial de mantenimiento de vehículos.
- Notificaciones por correo electrónico.
- Firma digital de contratos.
- Integración con pasarelas de pago.
- Recuperación de contraseña.
- Bloqueo temporal por intentos fallidos de inicio de sesión.
- Pruebas unitarias y de integración.
- Dockerización del frontend, backend y base de datos.
- Despliegue en Azure, AWS o infraestructura propia.
- Evolución hacia una plataforma multiempresa tipo SaaS.

---

## ⚠️ Consideraciones de seguridad

Esta versión incorpora las medidas prioritarias de endurecimiento:

- JWT con validación de firma, emisor, audiencia y expiración.
- Contraseñas con el `PasswordHasher` de ASP.NET Core; nunca se guardan en texto claro.
- Autorización por roles en todas las rutas; solo login y `/health` son públicos.
- Límite de intentos en login y mensajes que no revelan si una cuenta existe.
- CORS limitado a orígenes configurados.
- Validación de modelos en el servidor y consultas parametrizadas mediante EF Core.
- Imágenes limitadas a 5 MB y 20 megapíxeles, decodificadas, limpiadas y recodificadas a WebP.
- Eliminación del almacenamiento de datos de tarjetas.

Para un despliegue comercial todavía se debe usar HTTPS de extremo a extremo, un
gestor de secretos, copias de seguridad protegidas, monitoreo/auditoría y un
proveedor PCI DSS si se incorporan pagos. También conviene añadir bloqueo de cuenta
por usuario y rotación o revocación centralizada de sesiones.

---

## 👨‍💻 Autor

**Francis Jairo Matías Rosario**

- 🎓 Universidad APEC (UNAPEC)
- 📚 Ingeniería de Software
- 🆔 Matrícula: **A00115261**
- 💼 Proyecto académico y de portafolio profesional

---

<p align="center">
  Desarrollado con ❤️ por <strong>Francis Jairo Matías Rosario</strong>
</p>
