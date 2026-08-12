import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  NgZone,
  OnDestroy,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';

import { CategoriesComponent } from '@app/features/public/components/categories/categories.component';
import { ContactComponent } from '@app/features/public/components/contact/contact.component';
import { FeaturedProductsComponent } from '@app/features/public/components/featured-products/featured-products.component';
import { FooterComponent } from '@app/features/public/components/footer/footer.component';
import { HeaderComponent } from '@app/features/public/components/header/header.component';
import { HeroComponent } from '@app/features/public/components/hero/hero.component';
import { SpecialOfferComponent } from '@app/features/public/components/special-offer/special-offer.component';

@Component({
  selector: 'app-landing-page',
  imports: [
    HeaderComponent,
    HeroComponent,
    FeaturedProductsComponent,
    CategoriesComponent,
    ContactComponent,
    FooterComponent,
    SpecialOfferComponent,
  ],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
})
export default class LandingPageComponent implements AfterViewInit, OnDestroy {
  private mutationObserver?: MutationObserver;
  private revealObserver?: IntersectionObserver;
  private readonly revealElements = new Set<HTMLElement>();

  private readonly revealSelector = [
    '.section-head',
    '.category-card',
    '.products-head',
    '.product-card',
    '.offer-copy',
    '.offer-media',
    '.ai-benchmark-copy',
    '.ai-benchmark-panel',
    '.ai-benchmark-action',
    '.contact-section .contact-info',
    '.contact-section .contact-form',
    '.footer-content',
  ].join(',');

  constructor(
    private readonly elementRef: ElementRef<HTMLElement>,
    private readonly ngZone: NgZone,
    @Inject(PLATFORM_ID) private readonly platformId: object,
  ) {}

  ngAfterViewInit(): void {
    if (
      !isPlatformBrowser(this.platformId) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        this.animateHero();
        this.setupScrollReveals();
      });

      this.mutationObserver = new MutationObserver(() => {
        requestAnimationFrame(() => this.observeRevealElements());
      });

      this.mutationObserver.observe(this.elementRef.nativeElement, {
        childList: true,
        subtree: true,
      });
    });
  }

  ngOnDestroy(): void {
    this.mutationObserver?.disconnect();
    this.revealObserver?.disconnect();
  }

  private animateHero(): void {
    const root = this.elementRef.nativeElement;
    const heroElements = root.querySelectorAll<HTMLElement>(
      '.hero-badge, .hero-copy h1, .hero-copy p, .hero-actions, .hero-media',
    );
    const benefitItems = root.querySelectorAll<HTMLElement>('.benefit-item');

    gsap
      .timeline({ defaults: { ease: 'power3.out' } })
      .fromTo(
        heroElements,
        { autoAlpha: 0, y: 28 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.08,
          clearProps: 'opacity,visibility,transform',
        },
      )
      .fromTo(
        benefitItems,
        { autoAlpha: 0, y: 18 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.48,
          stagger: 0.055,
          clearProps: 'opacity,visibility,transform',
        },
        '-=0.18',
      );
  }

  private setupScrollReveals(): void {
    this.revealObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) {
            return;
          }

          const element = entry.target as HTMLElement;
          gsap.to(element, {
            autoAlpha: 1,
            y: 0,
            duration: 0.58,
            ease: 'power3.out',
            clearProps: 'opacity,visibility,transform',
          });
          this.revealObserver?.unobserve(element);
        });
      },
      {
        rootMargin: '0px 0px -12% 0px',
        threshold: 0.16,
      },
    );

    this.observeRevealElements();
  }

  private observeRevealElements(): void {
    if (!this.revealObserver) {
      return;
    }

    const elements = this.elementRef.nativeElement.querySelectorAll<HTMLElement>(this.revealSelector);

    elements.forEach(element => {
      if (this.revealElements.has(element)) {
        return;
      }

      this.revealElements.add(element);
      gsap.set(element, {
        autoAlpha: 0,
        y: 24,
      });
      this.revealObserver?.observe(element);
    });
  }
}
