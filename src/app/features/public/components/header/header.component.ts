import {
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  OnInit,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { gsap } from 'gsap';

import { AuthService } from '@app/core/auth/auth.service';
import { AdminThemeService } from '@app/core/theme/admin-theme.service';
import { CartServiceService } from '@app/services/cart-service.service';

@Component({
  selector: 'app-header',
  imports: [FormsModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly ngZone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);
  readonly themeService = inject(AdminThemeService);
  private readonly authService = inject(AuthService);

  cartCount = 0;
  searchTerm = '';
  private hasCartCountSnapshot = false;

  constructor(private cartService: CartServiceService, private router: Router) {}

  ngOnInit(): void {
    this.cartService.cartCount$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(count => {
      const previousCount = this.cartCount;
      this.cartCount = count;

      if (this.hasCartCountSnapshot && count > previousCount) {
        this.animateCartFeedback();
      }

      this.hasCartCountSnapshot = true;
    });
    this.cartService.refreshCartCount().subscribe();
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

  submitSearch(): void {
    const query = this.searchTerm.trim();

    this.router.navigate(['/catalogo'], {
      queryParams: query ? { q: query } : {},
    });
  }

  private animateCartFeedback(): void {
    if (
      !isPlatformBrowser(this.platformId) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        const cartButton = this.elementRef.nativeElement.querySelector<HTMLElement>('.cart-btn');
        const cartBadge = this.elementRef.nativeElement.querySelector<HTMLElement>('.cart-badge');

        if (!cartButton) {
          return;
        }

        gsap
          .timeline()
          .to(cartButton, {
            scale: 1.08,
            y: -2,
            duration: 0.12,
            ease: 'power2.out',
          })
          .to(cartButton, {
            scale: 1,
            y: 0,
            duration: 0.28,
            ease: 'elastic.out(1, 0.45)',
            clearProps: 'transform',
          });

        if (cartBadge) {
          gsap.fromTo(
            cartBadge,
            { scale: 0.72 },
            {
              scale: 1,
              duration: 0.3,
              ease: 'back.out(2.4)',
              clearProps: 'transform',
            },
          );
        }
      });
    });
  }
}
