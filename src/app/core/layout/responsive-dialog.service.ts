import { Injectable, inject } from '@angular/core';
import { MatDialogConfig } from '@angular/material/dialog';

import { ResponsiveLayoutService } from './responsive-layout.service';

export interface ResponsiveDialogOptions<D = unknown> extends MatDialogConfig<D> {
  desktopWidth: string;
  mobilePanelClass?: string;
}

@Injectable({ providedIn: 'root' })
export class ResponsiveDialogService {
  private readonly layout = inject(ResponsiveLayoutService);

  buildConfig<D>(options: ResponsiveDialogOptions<D>): MatDialogConfig<D> {
    const { desktopWidth, mobilePanelClass = 'full-screen-dialog', panelClass, ...config } = options;
    const panelClasses = this.normalizePanelClass(panelClass);

    if (!this.layout.isMobile()) {
      return {
        maxWidth: '96vw',
        maxHeight: '92vh',
        ...config,
        width: desktopWidth,
        panelClass: panelClasses,
      };
    }

    return {
      ...config,
      width: '100vw',
      height: '100dvh',
      maxWidth: '100vw',
      maxHeight: '100dvh',
      panelClass: [...panelClasses, mobilePanelClass],
    };
  }

  private normalizePanelClass(panelClass: MatDialogConfig['panelClass']): string[] {
    if (!panelClass) {
      return [];
    }

    return Array.isArray(panelClass) ? panelClass : [panelClass];
  }
}
