🚗 RentCarRD - Sistema de Gestión de Rentas

<p align="center"> <img src="https://skillicons.dev/icons?i=html,css,angular,ts,bootstrap&perline=5" /> </p>
<p align="center"> <img src="https://skillicons.dev/icons?i=cs,dotnet,visualstudio,vscode,git,github&perline=6" /> </p>



<p align="center"> <strong>Sistema web para la administración de empresas de renta de vehículos.</strong><br> Desarrollado con Angular, .NET y Microsoft SQL Server. </p>

📖 Descripción

RentCarRD es un sistema web desarrollado para la administración y gestión de empresas de renta de vehículos. La aplicación permite administrar clientes, vehículos, inspecciones, contratos de renta, devoluciones y reportes, proporcionando una solución centralizada para las operaciones de un Rent Car.

Este proyecto forma parte de la colección de proyectos académicos desarrollados en la Universidad APEC (UNAPEC) para el profesor Juan Pablo Valdez Reyes, como práctica de desarrollo de aplicaciones empresariales utilizando una arquitectura cliente-servidor.

🛠️ Tecnologías Utilizadas

<p align="center"> <img src="https://skillicons.dev/icons?i=angular,ts,html,css,bootstrap,dotnet,cs,visualstudio,vscode,git,github" /> </p>

Tecnología	Descripción
🅰️ Angular	Desarrollo del Frontend
📘 TypeScript	Lógica del Cliente
🌐 HTML5	Estructura de la interfaz
🎨 CSS3	Diseño de la aplicación
🅱️ Bootstrap 5	Framework CSS
⚙️ .NET	Desarrollo de la API REST
💜 C#	Backend
🗄️ Microsoft SQL Server	Base de Datos
📄 jsPDF	Generación de documentos PDF
📑 jsPDF-AutoTable	Tablas para reportes PDF
✨ Funcionalidades
👤 Gestión de Clientes
✅ Registro de clientes
✅ Edición de clientes
✅ Eliminación de clientes
✅ Administración del límite de crédito
✅ Manejo del estado del cliente
🚗 Gestión de Vehículos
✅ Registro de vehículos
✅ Administración de marcas
✅ Administración de modelos
✅ Tipos de vehículos
✅ Tipos de combustible
✅ Edición de vehículos
✅ Eliminación de vehículos
🔍 Inspecciones
✅ Registro de inspecciones
✅ Estado de gomas
✅ Cristales
✅ Nivel de combustible
✅ Ralladuras
✅ Goma de respuesta
✅ Gato hidráulico
🔑 Rentas y Devoluciones
✅ Registro de contratos de renta
✅ Asociación entre cliente y vehículo
✅ Cálculo automático del total
✅ Cambio automático del estado del vehículo
✅ Registro de devoluciones
📄 Reportes
✅ Contrato de renta en PDF
✅ Información del cliente
✅ Información del vehículo
✅ Total calculado automáticamente
✅ Documento listo para impresión
📂 Estructura del Proyecto
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
🚀 Instalación
🗄️ 1. Base de Datos

Ejecutar el archivo:

RentCarDB.sql

en Microsoft SQL Server.

⚙️ 2. Backend (.NET)

Entrar a la carpeta del proyecto:

cd RentCar.API

Restaurar paquetes:

dotnet restore

Compilar:

dotnet build

Ejecutar:

dotnet run

Swagger:

http://localhost:5266/swagger
🌐 3. Frontend (Angular)

Entrar a la carpeta:

cd RentCarClient

Instalar dependencias:

npm install

Ejecutar la aplicación:

ng serve -o

La aplicación estará disponible en:

http://localhost:4200
📊 Estado del Proyecto
Módulo	Estado
👤 Gestión de Clientes	✅
🚗 Gestión de Vehículos	✅
🔍 Inspecciones	✅
🔑 Rentas	✅
🔄 Devoluciones	✅
📄 Reportes PDF	✅
🌐 API REST	✅
🗄️ Base de Datos	✅
🎓 Información Académica

Universidad: Universidad APEC (UNAPEC)

Profesor: Juan Pablo Valdez Reyes

Estudiante: Francis Jairo Matías Rosario

Matrícula: A00115261

👨‍💻 Autor

Francis Jairo Matías Rosario

Tecnólogo en Desarrollo de Software 

Estudiante de Ingenieria de Software

GitHub: Jairo0811
