# 🚗 RentCarRD — Sistema de Gestión de Rentas de Vehículos

<p align="center">
  <img src="https://skillicons.dev/icons?i=angular,ts,html,css,bootstrap,dotnet,cs,visualstudio,vscode,git,github&perline=11" alt="Tecnologías de RentCarRD" />
</p>

<p align="center">
  <strong>Aplicación web para administrar clientes, empleados, vehículos, inspecciones, rentas, devoluciones y reportes.</strong><br>
  Desarrollada con Angular, ASP.NET Core Web API, Entity Framework Core y Microsoft SQL Server.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Estado-Finalizado-success" alt="Estado del proyecto" />
  <img src="https://img.shields.io/badge/Versión-1.1-blue" alt="Versión" />
  <img src="https://img.shields.io/badge/Proyecto-Académico%20y%20Portafolio-purple" alt="Tipo de proyecto" />
</p>

---

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

## 🛠️ Tecnologías utilizadas

| Tecnología | Uso principal |
|---|---|
| Angular 21 | Aplicación web frontend |
| TypeScript | Lógica, tipado y componentes del cliente |
| HTML5 | Estructura de las vistas |
| CSS3 | Estilos personalizados |
| Bootstrap 5 | Diseño responsivo y componentes visuales |
| ASP.NET Core Web API | API REST del backend |
| C# | Reglas de negocio y controladores |
| Entity Framework Core | Acceso y mapeo de datos |
| Microsoft SQL Server | Base de datos relacional |
| Chart.js y ng2-charts | Gráficos del dashboard |
| jsPDF | Generación de documentos PDF |
| jsPDF AutoTable | Tablas profesionales en PDF |
| SheetJS `xlsx` | Exportación de reportes a Excel |
| Git y GitHub | Control de versiones |

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
- Registro opcional de método de pago ficticio.
- Detección de Visa, Mastercard, American Express y Discover.
- Validación de tarjetas mediante algoritmo de Luhn.
- Validación de fecha de expiración.
- Visualización de franquicia y últimos cuatro dígitos.
- El CVV se utiliza únicamente de forma temporal y no se almacena.

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
| Clientes | Cédula, RNC, documento duplicado, límite de crédito, tarjeta y expiración |
| Empleados | Nombre, usuario único, cédula, tanda, comisión y estado |
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

> Las credenciales del entorno académico deben sustituirse antes de utilizar el sistema en producción.

---

## 📂 Estructura del proyecto

```text
RentCarRD
│
├── RentCar.API
│   └── RentCar.API
│       ├── Controllers
│       ├── Helpers
│       ├── Migrations
│       ├── Models
│       ├── Properties
│       ├── wwwroot
│       │   └── vehiculos
│       ├── Program.cs
│       └── appsettings.json
│
├── RentCarClient
│   ├── public
│   │   └── images
│   │       ├── cards
│   │       └── logo.png
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

- .NET SDK compatible con el backend.
- Node.js y npm.
- Angular CLI.
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

3. Verificar la cadena de conexión del backend en:

```text
RentCar.API/RentCar.API/appsettings.json
```

No publiques credenciales reales en el repositorio.

### 3. Ejecutar el backend

```bash
cd RentCar.API/RentCar.API
dotnet restore
dotnet build
dotnet run
```

Swagger estará disponible normalmente en:

```text
http://localhost:5266/swagger
```

### 4. Ejecutar el frontend

En otra terminal, desde la raíz del repositorio:

```bash
cd RentCarClient
npm install --legacy-peer-deps
npm start
```

La aplicación estará disponible normalmente en:

```text
http://localhost:4200
```

> El modificador `--legacy-peer-deps` evita conflictos de resolución de dependencias en la configuración actual del proyecto.

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
| Login y roles | ✅ Finalizado |
| API REST | ✅ Finalizado |
| SQL Server | ✅ Finalizado |

---

## 🗺️ Mejoras futuras

- Migración gradual de CSS a SCSS.
- SweetAlert2 para alertas, confirmaciones y notificaciones.
- Loader global y manejo centralizado de errores HTTP.
- Reservas y calendario de disponibilidad.
- Historial de mantenimiento de vehículos.
- Notificaciones por correo electrónico.
- Firma digital de contratos.
- Integración con pasarelas de pago.
- Recuperación de contraseña.
- Autenticación con JWT y contraseñas almacenadas mediante hash seguro.
- Bloqueo temporal por intentos fallidos de inicio de sesión.
- Pruebas unitarias y de integración.
- Dockerización del frontend, backend y base de datos.
- Despliegue en Azure, AWS o infraestructura propia.
- Evolución hacia una plataforma multiempresa tipo SaaS.

---

## ⚠️ Consideraciones de seguridad

Este proyecto fue desarrollado con fines académicos y de portafolio. Antes de utilizarlo en un entorno comercial se recomienda:

- Sustituir las credenciales académicas.
- Implementar autenticación JWT.
- Almacenar contraseñas mediante hash y salt.
- Proteger secretos con variables de entorno o un gestor de secretos.
- Restringir CORS según el entorno.
- Utilizar HTTPS.
- Aplicar autorización por roles en todos los endpoints sensibles.
- Implementar auditoría y registro de operaciones críticas.

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
