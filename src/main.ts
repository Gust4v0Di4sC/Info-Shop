import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideClientHydration } from '@angular/platform-browser';

// Configuração atualizada para resolver problemas de hydration
const updatedAppConfig = {
  ...appConfig,
  providers: [
    ...appConfig.providers,
    provideClientHydration() // Previne erros de hydration
  ]
};

bootstrapApplication(AppComponent, updatedAppConfig)
  .catch((err) => console.error(err));