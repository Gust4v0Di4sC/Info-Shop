import {
  AfterViewInit,
  Directive,
  ElementRef,
  Inject,
  NgZone,
  OnDestroy,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type GsapApi = typeof import('gsap').gsap;

@Directive({
  selector: '[appGsapPageMotion]',
  standalone: true,
})
export class GsapPageMotionDirective implements AfterViewInit, OnDestroy {
  private observer?: MutationObserver;
  private gsap?: GsapApi;
  private prefersReducedMotion = false;

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        void this.startMotion();
      });
    });
  }

  private async startMotion(): Promise<void> {
    const { gsap } = await import('gsap');
    this.gsap = gsap;
    this.animateLatestView();

    this.ngZone.runOutsideAngular(() => {
      this.observer = new MutationObserver(mutations => {
        const hasNewView = mutations.some(mutation =>
          Array.from(mutation.addedNodes).some(node => this.isRoutableElement(node)),
        );

        if (hasNewView) {
          this.hideLatestView();
          requestAnimationFrame(() => this.animateLatestView());
        }
      });

      this.observer.observe(this.elementRef.nativeElement, {
        childList: true,
      });
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private hideLatestView(): void {
    if (!this.gsap) {
      return;
    }

    const page = this.getLatestPageElement();

    if (!page) {
      return;
    }

    this.gsap.set(page, {
      autoAlpha: 0,
      y: this.prefersReducedMotion ? 2 : 8,
    });
  }

  private animateLatestView(): void {
    if (!this.gsap) {
      return;
    }

    const page = this.getLatestPageElement();

    if (!page) {
      return;
    }

    this.gsap.killTweensOf(page);
    this.gsap.fromTo(
      page,
      {
        autoAlpha: 0,
        y: this.prefersReducedMotion ? 2 : 8,
      },
      {
        autoAlpha: 1,
        y: 0,
        duration: this.prefersReducedMotion ? 0.12 : 0.22,
        ease: 'power2.out',
        clearProps: 'opacity,visibility,transform',
      },
    );

    const details = this.getDetailElements(page);

    if (details.length) {
      this.gsap.killTweensOf(details);
      this.gsap.fromTo(
        details,
        {
          autoAlpha: 0,
          y: 10,
        },
        {
          autoAlpha: 1,
          y: 0,
          duration: this.prefersReducedMotion ? 0.12 : 0.2,
          ease: 'power2.out',
          stagger: this.prefersReducedMotion ? 0.005 : 0.015,
          delay: this.prefersReducedMotion ? 0 : 0.02,
          clearProps: 'opacity,visibility,transform',
        },
      );
    }
  }

  private getLatestPageElement(): HTMLElement | null {
    const children = Array.from(this.elementRef.nativeElement.children)
      .filter(child => child.tagName !== 'ROUTER-OUTLET') as HTMLElement[];

    return children.at(-1) || null;
  }

  private getDetailElements(page: HTMLElement): HTMLElement[] {
    const selectors = [
      '.page-header',
      '.hero-content',
      '.products-head',
      '.offer-copy',
      '.offer-media',
      '.panel',
      '.theme-option',
      '.logo-panel',
      '.profile-card',
      '.form-panel',
      '.cart-head',
      '.cart-item',
      '.summary',
      '.product-card',
      '.client-card',
      '.order-card',
      '.featured-card',
      '.inventory-row',
      '.delivery-card',
      '.state-card',
      '.error-shell',
      '.redirect-panel',
      '.status-console',
      '.quick-link',
    ];

    return Array.from(page.querySelectorAll<HTMLElement>(selectors.join(','))).slice(0, 12);
  }

  private isRoutableElement(node: Node): boolean {
    return node instanceof HTMLElement && node.tagName !== 'ROUTER-OUTLET';
  }
}
