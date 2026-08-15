import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '@app/core/auth/auth.service';
import { AdminThemeService } from '@app/core/theme/admin-theme.service';

@Component({
  selector: 'app-header',
  imports: [FormsModule, NgOptimizedImage, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit {
  readonly themeService = inject(AdminThemeService);
  private readonly authService = inject(AuthService);

  cartCount = 0;
  searchTerm = '';

  constructor(private router: Router) {}

  ngOnInit(): void {}

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

  submitSearch(): void {
    const query = this.searchTerm.trim();

    this.router.navigate(['/catalogo'], {
      queryParams: query ? { q: query } : {},
    });
  }
}
