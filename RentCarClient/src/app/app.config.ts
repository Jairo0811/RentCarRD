import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withFetch } from '@angular/common/http'; // <-- 1. Agrega esta importación

export const appConfig: ApplicationConfig = {
  // 2. Agrega provideHttpClient() dentro de la lista de providers
  providers: [provideRouter(routes), provideHttpClient(withFetch())] 
};