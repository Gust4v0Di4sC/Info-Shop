import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { AuthService } from '@app/core/auth/auth.service';
import { ResponsiveLayoutService } from '@app/core/layout/responsive-layout.service';
import { AdminThemeService } from '@app/core/theme/admin-theme.service';
import { SharedMaterialModule } from '@app/shared/material/shared-material.module';
import { CartServiceService } from '@app/services/cart-service.service';

@Component({
  selector: 'app-header',
  imports: [FormsModule, NgOptimizedImage, RouterLink, SharedMaterialModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit {
  private readonly failedLogoUrl = signal<string | null>(null);

  readonly themeService = inject(AdminThemeService);
  readonly layout = inject(ResponsiveLayoutService);
  readonly menuRequested = output<void>();
  readonly headerLogoUrl = computed(() => {
    const logoUrl = this.themeService.publicLogoUrl();
    return logoUrl === this.failedLogoUrl() ? '/Logo3.svg' : logoUrl;
  });
  private readonly authService = inject(AuthService);
  private readonly cartService = inject(CartServiceService);
  readonly cartCount = toSignal(this.cartService.cartCount$, { initialValue: 0 });

  searchTerm = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.cartService.refreshCartCount().subscribe({ error: () => undefined });
  }

  goToHome(): void {
    this.router.navigate(['/home']);
  }

  async goToProfile(): Promise<void> {
    const user = await this.authService.getCurrentUserAsync();

    if (!user) {
      this.router.navigate(['/home']);
      return;
    }

    this.router.navigate(['/perfil']);
  }

  goToCart(): void {
    this.router.navigate(['/carrinho']);
  }

  requestMenu(): void {
    this.menuRequested.emit();
  }

  useDefaultLogo(): void {
    this.failedLogoUrl.set(this.themeService.publicLogoUrl());
  }

  submitSearch(): void {
    const query = this.searchTerm.trim();

    this.router.navigate(['/catalogo'], {
      queryParams: query ? { q: query } : {},
    });
  }
}
