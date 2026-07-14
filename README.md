# 🚗 RentCarRD - Sistema de Gestión de Rentas

<p align="center">
  <img src="https://skillicons.dev/icons?i=html,css,angular,ts,bootstrap&perline=5" />
</p>

<p align="center">
  <img src="https://skillicons.dev/icons?i=cs,dotnet,visualstudio,vscode,git,github&perline=6" />
</p>

<p align="center">
  <strong>Sistema web para la administración de empresas de renta de vehículos.</strong><br>
  Desarrollado con Angular, ASP.NET Core Web API y Microsoft SQL Server.
</p>

---

# 📖 Descripción

**RentCarRD** es un sistema web desarrollado para la administración integral de empresas dedicadas al alquiler de vehículos.

La aplicación permite administrar clientes, empleados, vehículos, inspecciones, contratos de renta, devoluciones y reportes, proporcionando una solución centralizada para la operación diaria de un Rent Car.

El proyecto fue desarrollado siguiendo una arquitectura Cliente-Servidor, implementando una API REST en ASP.NET Core y un frontend moderno con Angular.

**RentCarRD** forma parte de una colección de proyectos académicos desarrollados en la **Universidad APEC (UNAPEC)**, tomando como referencia el listado de proyectos propuestos por el profesor **Juan Pablo Valdez Reyes**.

---

# 🛠️ Tecnologías Utilizadas

<p align="center">
<img src="https://skillicons.dev/icons?i=angular,ts,html,css,bootstrap,dotnet,cs,visualstudio,vscode,git,github" />
</p>

| Tecnología | Descripción |
|------------|------------|
| 🅰️ Angular | Frontend |
| 📘 TypeScript | Lógica del cliente |
| 🌐 HTML5 | Estructura de la interfaz |
| 🎨 CSS3 | Diseño y estilos |
| 🅱️ Bootstrap 5 | Componentes responsivos |
| ⚙️ ASP.NET Core Web API | Backend |
| 💜 C# | Lógica de negocio |
| 🗄️ Entity Framework Core | ORM |
| 🛢️ SQL Server | Base de datos |
| 📄 jsPDF | Generación de PDF |
| 📑 jsPDF AutoTable | Tablas profesionales |
| 🔀 REST API | Comunicación Cliente-Servidor |

---

# 🏗️ Arquitectura

```text
Angular
      │
      ▼
ASP.NET Core Web API
      │
Entity Framework Core
      │
Microsoft SQL Server
```

La comunicación entre el cliente y el servidor se realiza mediante una API REST utilizando JSON.

---

# ✨ Funcionalidades

---

## 📊 Dashboard Ejecutivo

- ✅ Panel principal moderno
- ✅ Indicadores (KPIs)
- ✅ Total de vehículos
- ✅ Vehículos disponibles
- ✅ Vehículos rentados
- ✅ Total de clientes
- ✅ Estado operativo
- ✅ Ingresos acumulados
- ✅ Últimas rentas
- ✅ Vehículos registrados recientemente
- ✅ Accesos rápidos

---

## 👤 Gestión de Clientes

- ✅ Registrar clientes
- ✅ Editar clientes
- ✅ Eliminar clientes
- ✅ Activar/Inactivar clientes
- ✅ Administración del límite de crédito
- ✅ Validación de cédula dominicana
- ✅ Consulta automática de datos mediante API
- ✅ Búsqueda de clientes

---

## 👨‍💼 Gestión de Empleados

- ✅ Registrar empleados
- ✅ Editar empleados
- ✅ Eliminar empleados
- ✅ Activar/Inactivar empleados
- ✅ Inicio de sesión de empleados
- ✅ Asociación automática del empleado a las rentas realizadas

---

## 🚗 Gestión de Vehículos

- ✅ Registrar vehículos
- ✅ Editar vehículos
- ✅ Eliminar vehículos
- ✅ Subida de imágenes
- ✅ Vista previa de imágenes
- ✅ Administración de marcas
- ✅ Administración de modelos
- ✅ Administración de tipos de vehículos
- ✅ Administración de tipos de combustible

---

## 📚 Catálogos

- ✅ Marcas
- ✅ Modelos
- ✅ Tipos de Vehículos
- ✅ Tipos de Combustible

Todos los catálogos se encuentran relacionados automáticamente con el resto del sistema.

---

## 🔍 Inspección de Flota

- ✅ Registro de inspecciones
- ✅ Selección automática de clientes
- ✅ Selección automática de vehículos
- ✅ Estado de las gomas
- ✅ Cristales
- ✅ Goma de respuesta
- ✅ Gato hidráulico
- ✅ Nivel de combustible
- ✅ Ralladuras
- ✅ Observaciones

---

## 🔑 Gestión de Rentas

- ✅ Registrar contratos de renta
- ✅ Seleccionar cliente
- ✅ Seleccionar vehículo
- ✅ Registrar empleado responsable
- ✅ Cálculo automático del total
- ✅ Cambio automático del estado del vehículo
- ✅ Generación del contrato en PDF

---

## 🔄 Gestión de Devoluciones

- ✅ Devolución de vehículos
- ✅ Actualización automática del estado del vehículo
- ✅ Historial de rentas

---

## 📄 Reportes

- ✅ Contrato profesional en PDF
- ✅ Información de la empresa
- ✅ Información del cliente
- ✅ Información del vehículo
- ✅ Información del empleado
- ✅ Marca y modelo
- ✅ Firma del cliente
- ✅ Firma del representante
- ✅ Reporte general de rentas
- ✅ Resumen financiero
- ✅ Formato profesional listo para impresión

---

# 🔐 Seguridad

El sistema implementa autenticación mediante dos tipos de usuarios.

## 👑 Administrador

Tiene acceso completo al sistema.

Puede administrar:

- Clientes
- Empleados
- Vehículos
- Catálogos
- Inspecciones
- Rentas
- Reportes

---

## 👨‍💼 Empleado

Puede:

- Registrar rentas
- Consultar vehículos
- Consultar clientes
- Generar contratos

Cada contrato queda asociado automáticamente al empleado que realizó la renta.

---

# 📂 Estructura del Proyecto

```text
RentCarRD
│
├── RentCar.API
│   ├── Controllers
│   ├── Models
│   ├── Properties
│   ├── wwwroot
│   │   └── vehiculos
│   ├── Program.cs
│   └── appsettings.json
│
├── RentCarClient
│   ├── public
│   │   └── images
│   ├── src
│   │   ├── components
│   │   ├── services
│   │   └── models
│   ├── angular.json
│   └── package.json
│
├── RentCarDB.sql
│
└── README.md
```

---

# 🚀 Instalación

## 1️⃣ Base de Datos

Ejecutar:

```sql
RentCarDB.sql
```

en Microsoft SQL Server.

---

## 2️⃣ Backend

Entrar a la carpeta

```bash
cd RentCar.API
```

Restaurar paquetes

```bash
dotnet restore
```

Compilar

```bash
dotnet build
```

Ejecutar

```bash
dotnet run
```

Swagger

```text
http://localhost:5266/swagger
```

---

## 3️⃣ Frontend

Entrar a la carpeta

```bash
cd RentCarClient
```

Instalar dependencias

```bash
npm install
```

Ejecutar

```bash
ng serve -o
```

La aplicación estará disponible en

```text
http://localhost:4200
```

---


# 📊 Estado del Proyecto

| Módulo | Estado |
|---------|:------:|
| 📊 Dashboard | ✅ |
| 👤 Clientes | ✅ |
| 👨‍💼 Empleados | ✅ |
| 🚗 Vehículos | ✅ |
| 📚 Catálogos | ✅ |
| 🔍 Inspecciones | ✅ |
| 🔑 Rentas | ✅ |
| 🔄 Devoluciones | ✅ |
| 📄 Reportes PDF | ✅ |
| 🔐 Login | ✅ |
| 🗄️ SQL Server | ✅ |
| 🌐 API REST | ✅ |

---

# 👨‍💻 Autor

**Francis Jairo Matías Rosario**

🎓 Universidad APEC (UNAPEC)

📚 Ingeniería de Software

🆔 Matrícula: **A00115261**

💼 Proyecto desarrollado con **Angular + ASP.NET Core Web API + SQL Server** como parte del portafolio académico y profesional.

---

<p align="center">
Desarrollado con ❤️ por <strong>Francis Jairo Matías Rosario</strong>
</p>
