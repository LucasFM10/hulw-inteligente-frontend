import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { adminAuthInterceptor } from './admin-auth.interceptor';

import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(
      withInterceptors([adminAuthInterceptor])
    ),
  ],
};
