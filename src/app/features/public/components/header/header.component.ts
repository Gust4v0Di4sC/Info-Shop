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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { gsap } from 'gsap';

import { supabase } from '@app/core/supabase/supabase.client';
import { AdminThemeService } from '@app/core/theme/admin-theme.service';
import { CartServiceService } from '@app/services/cart-service.service';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly ngZone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);
  readonly themeService = inject(AdminThemeService);

  cartCount = 0;
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
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      this.router.navigate(['/home']);
      return;
    }

    this.router.navigate(['/perfil']);
  }

  goToCart(): void {
    this.router.navigate(['/carrinho']);
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
