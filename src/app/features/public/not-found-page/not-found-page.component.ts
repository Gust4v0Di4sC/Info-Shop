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
  ViewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';

import { SharedMaterialModule } from '@app/shared/material/shared-material.module';

interface RecoveryLink {
  icon: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink, SharedMaterialModule],
  templateUrl: './not-found-page.component.html',
  styleUrl: './not-found-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('scene') private sceneRef?: ElementRef<HTMLElement>;

  readonly recoveryLinks: RecoveryLink[] = [
    { icon: 'home', label: 'Inicio', route: '/' },
    { icon: 'storefront', label: 'Catalogo', route: '/catalogo' },
    { icon: 'support_agent', label: 'Suporte', route: '/suporte/perguntas-frequentes' },
  ];

  private gsapContext?: ReturnType<typeof gsap.context>;
  private timeline?: gsap.core.Timeline;
  private removePointerListeners?: () => void;
  private prefersReducedMotion = false;

  constructor(
    private readonly ngZone: NgZone,
    @Inject(PLATFORM_ID) private readonly platformId: object,
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId) || !this.sceneRef) {
      return;
    }

    const scene = this.sceneRef.nativeElement;
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.ngZone.runOutsideAngular(() => {
      this.gsapContext = gsap.context(() => {
        this.timeline = gsap.timeline({
          defaults: {
            duration: this.prefersReducedMotion ? 0.18 : 0.52,
            ease: 'power3.out',
          },
        });

        this.timeline
          .from('.digit', { autoAlpha: 0, y: 34, rotateX: -42, stagger: 0.08 }, '-=0.12')
          .from('.zero-core', { autoAlpha: 0, scale: 0.72 }, '-=0.28')
          .from('.orbit-chip', { autoAlpha: 0, scale: 0.45, stagger: 0.06 }, '-=0.2')
          .from('.error-copy > *', { autoAlpha: 0, y: 18, stagger: 0.045 }, '-=0.22')
          .from('.quick-link', { autoAlpha: 0, y: 12, stagger: 0.04 }, '-=0.16');

        if (!this.prefersReducedMotion) {
          gsap.to('.zero-ring', {
            rotate: 360,
            duration: 12,
            ease: 'none',
            repeat: -1,
          });

          gsap.to('.orbit-chip', {
            y: -12,
            duration: 1.8,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
            stagger: {
              each: 0.22,
              repeat: -1,
              yoyo: true,
            },
          });

        }
      }, scene);

      const onPointerMove = (event: PointerEvent) => this.tiltScene(scene, event);
      const onPointerLeave = () => this.resetTilt(scene);

      scene.addEventListener('pointermove', onPointerMove, { passive: true });
      scene.addEventListener('pointerleave', onPointerLeave, { passive: true });

      this.removePointerListeners = () => {
        scene.removeEventListener('pointermove', onPointerMove);
        scene.removeEventListener('pointerleave', onPointerLeave);
      };
    });
  }

  ngOnDestroy(): void {
    this.removePointerListeners?.();
    this.timeline?.kill();
    this.gsapContext?.revert();
  }

  private tiltScene(scene: HTMLElement, event: PointerEvent): void {
    if (this.prefersReducedMotion) {
      return;
    }

    const bounds = scene.getBoundingClientRect();
    const relativeX = (event.clientX - bounds.left) / bounds.width - 0.5;
    const relativeY = (event.clientY - bounds.top) / bounds.height - 0.5;
    const parallaxItems = scene.querySelectorAll<HTMLElement>('[data-depth]');

    gsap.to(parallaxItems, {
      x: (_index, target) => Number(target.getAttribute('data-depth') || 0) * relativeX * 40,
      y: (_index, target) => Number(target.getAttribute('data-depth') || 0) * relativeY * 32,
      rotateY: relativeX * 4,
      rotateX: relativeY * -4,
      duration: 0.45,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  }

  private resetTilt(scene: HTMLElement): void {
    const parallaxItems = scene.querySelectorAll<HTMLElement>('[data-depth]');

    gsap.to(parallaxItems, {
      x: 0,
      y: 0,
      rotateX: 0,
      rotateY: 0,
      duration: 0.5,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  }
}
