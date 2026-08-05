import { EnvironmentProviders, inject, provideAppInitializer } from '@angular/core';
import { AdminThemeService } from '@app/core/theme/admin-theme.service';

export function provideAdminTheme(): EnvironmentProviders {
  return provideAppInitializer(() => inject(AdminThemeService).initialize());
}
