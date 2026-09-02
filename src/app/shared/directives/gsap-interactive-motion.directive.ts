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

interface BoundElement {
  element: HTMLElement;
  cleanup: Array<() => void>;
}

@Directive({
  selector: '[appGsapInteractiveMotion]',
  standalone: true,
})
export class GsapInteractiveMotionDirective implements AfterViewInit, OnDestroy {
  private observer?: MutationObserver;
  private boundElements: BoundElement[] = [];
  private boundSet = new Set<HTMLElement>();
  private gsap?: GsapApi;
  private pendingBindFrame = 0;
  private prefersReducedMotion = false;

  private readonly interactiveSelector = [
    'button:not([disabled])',
    'a[href]',
    '.nav-link',
    '.product-card',
    '.client-card',
    '.order-card',
    '.featured-card',
    '.category-card',
    '.cart-item',
    '.quick-link',
    '.primary-action',
    '.secondary-action',
  ].join(',');

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
        void this.startBinding();
      });
    });
  }

  private async startBinding(): Promise<void> {
    const { gsap } = await import('gsap');
    this.gsap = gsap;
    this.bindInteractiveElements();

    this.ngZone.runOutsideAngular(() => {
      this.observer = new MutationObserver(() => {
        this.pruneDetachedElements();
        this.scheduleBindInteractiveElements();
      });

      this.observer.observe(this.elementRef.nativeElement, {
        childList: true,
        subtree: true,
      });
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (this.pendingBindFrame) {
      cancelAnimationFrame(this.pendingBindFrame);
    }
    this.boundElements.forEach(bound => this.releaseBoundElement(bound));
    this.boundElements = [];
    this.boundSet.clear();
  }

  private scheduleBindInteractiveElements(): void {
    if (this.pendingBindFrame) {
      return;
    }

    this.pendingBindFrame = requestAnimationFrame(() => {
      this.pendingBindFrame = 0;
      this.bindInteractiveElements();
    });
  }

  private bindInteractiveElements(): void {
    if (!this.gsap) {
      return;
    }

    const elements = Array.from(
      this.elementRef.nativeElement.querySelectorAll<HTMLElement>(this.interactiveSelector),
    );

    elements.forEach(element => {
      if (this.boundSet.has(element) || this.shouldSkip(element)) {
        return;
      }

      this.boundSet.add(element);
      this.boundElements.push({
        element,
        cleanup: this.bindElement(element),
      });
    });
  }

  private bindElement(element: HTMLElement): Array<() => void> {
    const gsap = this.gsap;
    if (!gsap) {
      return [];
    }

    const isCard = this.isCardElement(element);
    const isCartAction = this.isCartAction(element);
    const hoverY = this.prefersReducedMotion ? -1 : isCard ? -5 : -2;
    const hoverScale = this.prefersReducedMotion ? 1.002 : isCard ? 1.01 : 1.015;
    const pressScale = this.prefersReducedMotion ? 0.99 : isCard ? 0.995 : 0.965;
    const hoverDuration = this.prefersReducedMotion ? 0.12 : 0.18;
    const leaveDuration = this.prefersReducedMotion ? 0.14 : 0.22;

    const onEnter = () => {
      gsap.to(element, {
        y: hoverY,
        scale: hoverScale,
        duration: hoverDuration,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };

    const onLeave = () => {
      gsap.to(element, {
        y: 0,
        scale: 1,
        duration: leaveDuration,
        ease: 'power2.out',
        overwrite: 'auto',
        clearProps: 'transform',
      });
    };

    const onDown = () => {
      gsap.to(element, {
        scale: pressScale,
        duration: 0.08,
        ease: 'power1.out',
        overwrite: 'auto',
      });
    };

    const onUp = () => {
      gsap.to(element, {
        scale: hoverScale,
        duration: this.prefersReducedMotion ? 0.1 : 0.14,
        ease: 'back.out(2)',
        overwrite: 'auto',
      });
    };

    const onClick = () => {
      if (!isCartAction) {
        return;
      }

      gsap.fromTo(
        element,
        { scale: 0.96 },
        {
          scale: 1,
          duration: this.prefersReducedMotion ? 0.16 : 0.34,
          ease: 'elastic.out(1, 0.45)',
          clearProps: 'transform',
        },
      );
    };

    const listeners: Array<[string, EventListener]> = [
      ['mouseenter', onEnter],
      ['mouseleave', onLeave],
      ['focus', onEnter],
      ['blur', onLeave],
      ['pointerdown', onDown],
      ['pointerup', onUp],
      ['pointercancel', onLeave],
      ['click', onClick],
    ];

    listeners.forEach(([eventName, listener]) => {
      element.addEventListener(eventName, listener, { passive: true });
    });

    return listeners.map(([eventName, listener]) => () => {
      element.removeEventListener(eventName, listener);
    });
  }

  private pruneDetachedElements(): void {
    const root = this.elementRef.nativeElement;

    this.boundElements = this.boundElements.filter(bound => {
      if (root.contains(bound.element)) {
        return true;
      }

      this.releaseBoundElement(bound);
      return false;
    });
  }

  private releaseBoundElement(bound: BoundElement): void {
    this.gsap?.killTweensOf(bound.element);
    bound.cleanup.forEach(cleanup => cleanup());
    this.boundSet.delete(bound.element);
  }

  private shouldSkip(element: HTMLElement): boolean {
    if (
      element.hasAttribute('disabled') ||
      element.getAttribute('aria-disabled') === 'true' ||
      element.getAttribute('aria-busy') === 'true' ||
      element.classList.contains('is-loading')
    ) {
      this.gsap?.killTweensOf(element);
      this.gsap?.set(element, { clearProps: 'transform' });
      return true;
    }

    return Boolean(
      element.closest('.mat-mdc-dialog-container'),
    );
  }

  private isCardElement(element: HTMLElement): boolean {
    return [
      'product-card',
      'client-card',
      'order-card',
      'featured-card',
      'category-card',
      'cart-item',
      'quick-link',
    ].some(className => element.classList.contains(className));
  }

  private isCartAction(element: HTMLElement): boolean {
    return [
      'cart-btn',
      'product-cart',
      'add-to-cart',
      'checkout-btn',
      'clear-btn',
      'remove-btn',
    ].some(className => element.classList.contains(className));
  }
}
