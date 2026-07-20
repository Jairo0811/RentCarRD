import { bootstrapApplication } from '@angular/platform-browser';
import Swal, { SweetAlertIcon } from 'sweetalert2';
import { appConfig } from './app/app.config';
import { App } from './app/app';

function obtenerIcono(mensaje: string): SweetAlertIcon {
  const texto = mensaje.toLowerCase();

  if (
    texto.includes('correctamente') ||
    texto.includes('éxito') ||
    texto.includes('exitosa') ||
    texto.includes('generado') ||
    texto.includes('exportado')
  ) {
    return 'success';
  }

  if (
    texto.includes('error') ||
    texto.includes('inválid') ||
    texto.includes('no se pudo') ||
    texto.includes('no puede') ||
    texto.includes('obligatorio') ||
    texto.includes('debes')
  ) {
    return 'error';
  }

  if (
    texto.includes('advertencia') ||
    texto.includes('seleccione') ||
    texto.includes('completa') ||
    texto.includes('verifique')
  ) {
    return 'warning';
  }

  return 'info';
}

window.alert = (mensaje?: unknown): void => {
  const texto = String(mensaje ?? '');
  const icono = obtenerIcono(texto);

  void Swal.fire({
    icon: icono,
    title:
      icono === 'success'
        ? 'Operación completada'
        : icono === 'error'
          ? 'No se pudo completar'
          : icono === 'warning'
            ? 'Atención'
            : 'Información',
    text: texto,
    confirmButtonText: 'Aceptar',
    confirmButtonColor: '#0d6efd',
    allowOutsideClick: false,
  });
};

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
