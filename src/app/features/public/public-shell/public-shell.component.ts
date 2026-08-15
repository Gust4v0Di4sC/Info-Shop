import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { RouterLink, RouterOutlet } from '@angular/router';

import { ResponsiveLayoutService } from '@app/core/layout/responsive-layout.service';
import { FooterComponent } from '@app/features/public/components/footer/footer.component';
import { HeaderComponent } from '@app/features/public/components/header/header.component';
import { SharedMaterialModule } from '@app/shared/material/shared-material.module';

interface PublicNavItem {
  label: string;
  link: string;
  fragment?: string;
}

@Component({
  selector: 'app-public-shell',
  imports: [FooterComponent, HeaderComponent, RouterLink, RouterOutlet, SharedMaterialModule],
  templateUrl: './public-shell.component.html',
  styleUrl: './public-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicShellComponent {
  readonly layout = inject(ResponsiveLayoutService);

  readonly navItems: PublicNavItem[] = [
    { label: 'Inicio', link: '/', fragment: 'inicio' },
    { label: 'Categorias', link: '/', fragment: 'categorias' },
    { label: 'Produtos', link: '/', fragment: 'produtos' },
    { label: 'Ofertas', link: '/', fragment: 'ofertas' },
    { label: 'Contato', link: '/', fragment: 'contato' },
    { label: 'Catalogo', link: '/catalogo' },
  ];

  closeDrawerOnCompact(drawer: MatSidenav): void {
    if (this.layout.isCompact()) {
      void drawer.close();
    }
  }
}
