## 🚗 RentCarRD - Sistema de Gestión de Rentas

<p align="center"> <img src="https://skillicons.dev/icons?i=html,css,angular,ts,bootstrap&perline=5" /> </p>
<p align="center"> <img src="https://skillicons.dev/icons?i=cs,dotnet,visualstudio,vscode,git,github&perline=6" /> </p>



<p align="center"> <strong>Sistema web para la administración de empresas de renta de vehículos.</strong><br> Desarrollado con Angular, .NET y Microsoft SQL Server. </p>

## 📖 Descripción

**RentCarRD** es un sistema web desarrollado para la administración y gestión de empresas de renta de vehículos. 

La aplicación permite administrar clientes, vehículos, inspecciones, contratos de renta, devoluciones y reportes, proporcionando una solución centralizada para las operaciones de un Rent Car.

RentCarRD forma parte de una colección de proyectos académicos desarrollados en la Universidad APEC (UNAPEC), tomando como referencia el listado de proyectos propuesto por el profesor **Juan Pablo Valdez Reyes**. 

Cada proyecto de esta colección puede ser desarrollado utilizando la tecnología, lenguaje de programación y arquitectura que el estudiante considere más adecuados. 

En este caso, RentCarRD fue implementado con Angular, .NET y Microsoft SQL Server, aplicando una arquitectura cliente-servidor para la gestión de empresas de renta de vehículos.

# 🛠️ Tecnologías Utilizadas

<p align="center"> <img src="https://skillicons.dev/icons?i=angular,ts,html,css,bootstrap,dotnet,cs,visualstudio,vscode,git,github" /> </p>

| Tecnología         | Descripción                 |
| ------------------ | --------------------------- |
| 🅰️ Angular        | Desarrollo del Frontend     |
| 📘 TypeScript      | Lógica del cliente          |
| 🌐 HTML5           | Estructura de la interfaz   |
| 🎨 CSS3            | Diseño y estilos            |
| 🅱️ Bootstrap 5    | Componentes responsivos     |
| ⚙️ .NET Core       | API REST                    |
| 💜 C#              | Backend                     |
| 🗄️ SQL Server     | Base de datos               |
| 📄 jsPDF           | Generación de contratos PDF |
| 📑 jsPDF AutoTable | Tablas profesionales en PDF |

# ✨ Funcionalidades

## 👤 Gestión de Clientes

* ✅ Registro de clientes
* ✅ Edición de clientes
* ✅ Eliminación de clientes
* ✅ Administración del límite de crédito
* ✅ Manejo del estado del cliente
## 🚗 Gestión de Vehículos
* ✅ Registro de vehículos
* ✅ Administración de marcas
* ✅ Administración de modelos
* ✅ Tipos de vehículos
* ✅ Tipos de combustible
* ✅ Edición de vehículos
* ✅ Eliminación de vehículos
## 🔍 Inspecciones
* ✅ Registro de inspecciones
* ✅ Estado de gomas
* ✅ Cristales
* ✅ Nivel de combustible
* ✅ Ralladuras
* ✅ Goma de respuesta
* ✅ Gato hidráulico
## 🔑 Rentas y Devoluciones
* ✅ Registro de contratos de renta
* ✅ Asociación entre cliente y vehículo
* ✅ Cálculo automático del total
* ✅ Cambio automático del estado del vehículo
* ✅ Registro de devoluciones
## 📄 Reportes
* ✅ Contrato de renta en PDF
* ✅ Información del cliente
* ✅ Información del vehículo
* ✅ Total calculado automáticamente
* ✅ Documento listo para impresión
# 📂 Estructura del Proyecto

```text
RentCarRD
│
├── RentCar.API
│   ├── Controllers
│   ├── Models
│   ├── Properties
│   ├── Program.cs
│   └── appsettings.json
│
├── RentCarClient
│   ├── src
│   ├── public
│   ├── angular.json
│   └── package.json
│
├── RentCarDB.sql
│
└── README.md
```
---

# 🚀 Instalación
## 🗄️ 1. Base de Datos

Ejecutar el archivo:
```sql
RentCarDB.sql
```

en **Microsoft SQL Server**.

## ⚙️ 2. Backend (.NET)

Entrar a la carpeta del proyecto:

```bash
cd RentCar.API
```

Restaurar paquetes:


```bash
dotnet restore
```

Compilar:

```bash
dotnet build
```

Ejecutar:

```bash
dotnet run
```

Swagger:

```text
http://localhost:5266/swagger
```
---

## 🌐 3. Frontend (Angular)

Entrar a la carpeta:
```bash
cd RentCarClient
```

Instalar dependencias:

```bash
npm install
```

Ejecutar la aplicación:
```bash

ng serve -o
```

La aplicación estará disponible en:
```text
http://localhost:4200
```
## 📊 Estado del Proyecto
| Módulo          | Estado |
| --------------- | :----: |
| 👤 Clientes     |    ✅   |
| 🚗 Vehículos    |    ✅   |
| 🔍 Inspecciones |    ✅   |
| 🔑 Rentas       |    ✅   |
| 🔄 Devoluciones |    ✅   |
| 📄 Reportes PDF |    ✅   |
| 🗄️ SQL Server  |    ✅   |
| 🌐 API REST     |    ✅   |




# 👨‍💻 Autor

**Francis Jairo Matías Rosario**

Universidad APEC (UNAPEC)

Matricula: A00115261
