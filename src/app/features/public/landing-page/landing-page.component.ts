import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Inject,
  NgZone,
  OnDestroy,
  PLATFORM_ID,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { CategoriesComponent } from '@app/features/public/components/categories/categories.component';
import { ContactComponent } from '@app/features/public/components/contact/contact.component';
import { FeaturedProductsComponent } from '@app/features/public/components/featured-products/featured-products.component';
import { HeroComponent } from '@app/features/public/components/hero/hero.component';
import { SpecialOfferComponent } from '@app/features/public/components/special-offer/special-offer.component';

@Component({
  selector: 'app-landing-page',
  imports: [
    HeroComponent,
    FeaturedProductsComponent,
    CategoriesComponent,
    ContactComponent,
    SpecialOfferComponent,
    MatIconModule,
    RouterLink,
  ],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class LandingPageComponent implements AfterViewInit, OnDestroy {
  private intersectionObserver?: IntersectionObserver;
  private mutationObserver?: MutationObserver;
  private readonly isBrowser: boolean;
  private prefersReducedMotion = false;

  private readonly motionSelector = [
    '.hero-badge',
    '.hero-copy h1',
    '.hero-copy p',
    '.hero-actions',
    '.hero-media',
    '.benefit-item',
    '.section-head',
    '.category-card',
    '.products-head',
    '.product-card',
    '.offer-copy',
    '.offer-media',
    '.ai-benchmark-copy',
    '.ai-benchmark-panel',
    '.ai-benchmark-action',
    '.contact-container',
  ].join(',');

  constructor(
    private readonly elementRef: ElementRef<HTMLElement>,
    private readonly ngZone: NgZone,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) {
      return;
    }

    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        void this.startGsapMotion();
      });
    });
  }

  ngOnDestroy(): void {
    this.intersectionObserver?.disconnect();
    this.mutationObserver?.disconnect();
  }

  private async startGsapMotion(): Promise<void> {
    const { gsap } = await import('gsap');
    const root = this.elementRef.nativeElement;

    this.intersectionObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) {
            return;
          }

          const element = entry.target as HTMLElement;
          this.intersectionObserver?.unobserve(element);
          gsap.to(element, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: this.prefersReducedMotion ? 0.24 : 0.72,
            ease: 'power3.out',
            clearProps: 'opacity,transform',
          });
        });
      },
      {
        rootMargin: '0px 0px -12% 0px',
        threshold: 0.12,
      },
    );

    this.prepareMotionElements(gsap);

    this.mutationObserver = new MutationObserver(() => {
      this.prepareMotionElements(gsap);
    });

    this.mutationObserver.observe(root, {
      childList: true,
      subtree: true,
    });
  }

  private prepareMotionElements(gsap: typeof import('gsap').gsap): void {
    const elements = Array.from(
      this.elementRef.nativeElement.querySelectorAll<HTMLElement>(this.motionSelector),
    );

    elements.forEach((element, index) => {
      if (element.dataset['gsapMotionBound'] === 'true') {
        return;
      }

      element.dataset['gsapMotionBound'] = 'true';
      gsap.set(element, {
        opacity: 0,
        y: this.motionOffset(element),
        scale: element.classList.contains('hero-media') && !this.prefersReducedMotion ? 0.98 : 1,
      });

      if (this.isHeroElement(element) || this.isInViewport(element)) {
        gsap.to(element, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: this.prefersReducedMotion ? 0.24 : 0.78,
          ease: 'power3.out',
          delay: this.prefersReducedMotion ? 0 : this.isHeroElement(element) ? index * 0.055 : 0.08,
          clearProps: 'opacity,transform',
        });
        return;
      }

      this.intersectionObserver?.observe(element);
    });
  }

  private isHeroElement(element: HTMLElement): boolean {
    return Boolean(element.closest('.hero'));
  }

  private motionOffset(element: HTMLElement): number {
    if (this.prefersReducedMotion) {
      return this.isHeroElement(element) ? 4 : 6;
    }

    return this.isHeroElement(element) ? 18 : 28;
  }

  private isInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    return rect.top < viewportHeight * 0.88 && rect.bottom > 0;
  }
}
