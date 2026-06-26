# 🚗 RentCarRD - Sistema de Gestión de Rentas

<p align="center">
  <img src="https://skillicons.dev/icons?i=angular,ts,html,css,bootstrap,dotnet,cs,visualstudio,vscode,git,github" />
</p>

<p align="center">
  <strong>Sistema web para la administración de empresas de renta de vehículos.</strong><br>
  Desarrollado con Angular, .NET y SQL Server siguiendo una arquitectura cliente-servidor.
</p>

---

## 📖 Descripción

**RentCarRD** es un sistema integral de gestión para empresas de renta de vehículos, diseñado para administrar clientes, vehículos, inspecciones, contratos de renta y devoluciones desde una plataforma web moderna.

El proyecto fue desarrollado como parte del **Proyecto Final** de la asignatura de programación en **Universidad APEC (UNAPEC)**.

---

# 🛠️ Tecnologías Utilizadas

<p align="center">
<img src="https://skillicons.dev/icons?i=angular,ts,html,css,bootstrap,dotnet,cs,visualstudio,vscode,git,github" />
</p>

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

---

# ✨ Funcionalidades

## 👤 Gestión de Clientes

* ✅ Registro de clientes
* ✅ Edición de clientes
* ✅ Eliminación de clientes
* ✅ Límite de crédito
* ✅ Tipo de persona
* ✅ Estado del cliente

---

## 🚗 Gestión de Vehículos

* ✅ Registro de vehículos
* ✅ Marcas
* ✅ Modelos
* ✅ Tipos de vehículos
* ✅ Tipos de combustible
* ✅ Edición
* ✅ Eliminación

---

## 🔍 Inspección de Vehículos

* ✅ Inspección previa a la renta
* ✅ Estado de gomas
* ✅ Nivel de combustible
* ✅ Cristales
* ✅ Ralladuras
* ✅ Goma de respuesta
* ✅ Gato hidráulico

---

## 🔑 Rentas y Devoluciones

* ✅ Registro de contratos
* ✅ Selección de cliente
* ✅ Selección de vehículo
* ✅ Cálculo automático del total
* ✅ Cambio automático del estado del vehículo
* ✅ Devolución de vehículos

---

## 📄 Reportes

* ✅ Contrato de renta en PDF
* ✅ Total calculado automáticamente
* ✅ Información del cliente
* ✅ Información del vehículo
* ✅ Formato profesional

---

# 📂 Estructura del Proyecto

```text
RentCarRD
│
├── RentCar.API
│   ├── Controllers
│   ├── Models
│   ├── Properties
│   └── Program.cs
│
├── RentCarClient
│   ├── src
│   ├── public
│   └── angular.json
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

Este script crea:

* Base de datos
* Tablas
* Relaciones
* Datos iniciales

---

## ⚙️ 2. Backend (.NET)

Entrar al proyecto:

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

Entrar al proyecto:

```bash
cd RentCarClient
```

Instalar dependencias:

```bash
npm install
```

Ejecutar el servidor:

```bash
ng serve -o
```

La aplicación abrirá automáticamente en:

```text
http://localhost:4200
```

---

# 📊 Estado del Proyecto

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

---

# 👨‍💻 Autor

**Francis Jairo Matías Rosario**

A00115261

🎓 Universidad APEC (UNAPEC)

💻 Ingeniero de Software


---

## ⭐ Si este proyecto te resulta útil, no olvides darle una estrella al repositorio.

