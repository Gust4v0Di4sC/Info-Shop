import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminThemeService } from '@app/core/theme/admin-theme.service';

@Component({
  selector: 'app-footer',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  readonly categories = [
    { label: 'Notebooks', slug: 'notebooks' },
    { label: 'Smartphones', slug: 'smartphones' },
    { label: 'Tablets', slug: 'tablets' },
    { label: 'Games', slug: 'games' },
    { label: 'Hardware', slug: 'hardware' },
    { label: 'Periféricos', slug: 'perifericos' },
  ];

  readonly supportLinks = [
    { label: 'Fale conosco', slug: 'fale-conosco' },
    { label: 'Perguntas frequentes', slug: 'perguntas-frequentes' },
    { label: 'Política de compra', slug: 'politica-de-compra' },
    { label: 'Trocas e devoluções', slug: 'trocas-e-devolucoes' },
    { label: 'Privacidade', slug: 'privacidade' },
  ];

  constructor(readonly themeService: AdminThemeService) {}
}
