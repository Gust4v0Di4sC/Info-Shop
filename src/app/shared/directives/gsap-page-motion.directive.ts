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
import { gsap } from 'gsap';

@Directive({
  selector: '[appGsapPageMotion]',
  standalone: true,
})
export class GsapPageMotionDirective implements AfterViewInit, OnDestroy {
  private observer?: MutationObserver;
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

    if (this.prefersReducedMotion) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => this.animateLatestView());

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
    const page = this.getLatestPageElement();

    if (!page) {
      return;
    }

    gsap.set(page, {
      autoAlpha: 0,
      y: 12,
      filter: 'blur(5px)',
    });
  }

  private animateLatestView(): void {
    const page = this.getLatestPageElement();

    if (!page) {
      return;
    }

    gsap.killTweensOf(page);
    gsap.fromTo(
      page,
      {
        autoAlpha: 0,
        y: 12,
        filter: 'blur(5px)',
      },
      {
        autoAlpha: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.34,
        ease: 'power2.out',
        clearProps: 'opacity,visibility,transform,filter',
      },
    );

    const details = this.getDetailElements(page);

    if (details.length) {
      gsap.killTweensOf(details);
      gsap.fromTo(
        details,
        {
          autoAlpha: 0,
          y: 10,
        },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.32,
          ease: 'power2.out',
          stagger: 0.035,
          delay: 0.05,
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
    ];

    return Array.from(page.querySelectorAll<HTMLElement>(selectors.join(','))).slice(0, 18);
  }

  private isRoutableElement(node: Node): boolean {
    return node instanceof HTMLElement && node.tagName !== 'ROUTER-OUTLET';
  }
}
