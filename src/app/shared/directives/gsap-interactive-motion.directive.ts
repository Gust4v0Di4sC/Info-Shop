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
  private prefersReducedMotion = false;

  private readonly interactiveSelector = [
    'button:not([disabled])',
    'a[href]',
    '.nav-link',
    '.product-card',
    '.client-card',
    '.order-card',
    '.featured-card',
    '.inventory-row',
    '.delivery-card',
    '.category-card',
    '.cart-item',
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

    if (this.prefersReducedMotion) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => this.bindInteractiveElements());

      this.observer = new MutationObserver(() => {
        this.pruneDetachedElements();
        requestAnimationFrame(() => this.bindInteractiveElements());
      });

      this.observer.observe(this.elementRef.nativeElement, {
        childList: true,
        subtree: true,
      });
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.boundElements.forEach(bound => this.releaseBoundElement(bound));
    this.boundElements = [];
    this.boundSet.clear();
  }

  private bindInteractiveElements(): void {
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
    const isCard = this.isCardElement(element);
    const isCartAction = this.isCartAction(element);

    const onEnter = () => {
      gsap.to(element, {
        y: isCard ? -5 : -2,
        scale: isCard ? 1.01 : 1.015,
        duration: 0.18,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };

    const onLeave = () => {
      gsap.to(element, {
        y: 0,
        scale: 1,
        duration: 0.22,
        ease: 'power2.out',
        overwrite: 'auto',
        clearProps: 'transform',
      });
    };

    const onDown = () => {
      gsap.to(element, {
        scale: isCard ? 0.995 : 0.965,
        duration: 0.08,
        ease: 'power1.out',
        overwrite: 'auto',
      });
    };

    const onUp = () => {
      gsap.to(element, {
        scale: isCard ? 1.01 : 1.015,
        duration: 0.14,
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
          duration: 0.34,
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
    gsap.killTweensOf(bound.element);
    bound.cleanup.forEach(cleanup => cleanup());
    this.boundSet.delete(bound.element);
  }

  private shouldSkip(element: HTMLElement): boolean {
    return Boolean(
      element.closest('.mat-mdc-dialog-container') ||
      element.hasAttribute('disabled') ||
      element.getAttribute('aria-disabled') === 'true',
    );
  }

  private isCardElement(element: HTMLElement): boolean {
    return [
      'product-card',
      'client-card',
      'order-card',
      'featured-card',
      'inventory-row',
      'delivery-card',
      'category-card',
      'cart-item',
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
