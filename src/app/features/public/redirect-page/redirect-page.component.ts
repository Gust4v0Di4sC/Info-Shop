import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { SharedMaterialModule } from '@app/shared/material/shared-material.module';

const REDIRECT_MESSAGES: Record<string, string> = {
  login_required: 'Sua sessao precisa ser confirmada antes de continuar.',
  already_authenticated: 'Sua conta ja esta ativa, entao vamos levar voce para a area correta.',
  admin_area: 'Identificamos seu perfil administrativo e vamos abrir seu painel.',
  customer_area: 'Essa area e administrativa. Vamos voltar para sua experiencia de cliente.',
  role_fallback: 'Seu perfil tem uma rota inicial propria. Vamos abrir essa area.',
  default: 'Estamos preparando a proxima pagina.',
};

@Component({
  selector: 'app-redirect-page',
  imports: [RouterLink, SharedMaterialModule],
  templateUrl: './redirect-page.component.html',
  styleUrl: './redirect-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RedirectPageComponent implements OnInit, OnDestroy {
  readonly progress = signal(0);

  readonly targetPath: string;
  readonly message: string;
  readonly delayMs: number;

  private timeoutId?: ReturnType<typeof setTimeout>;
  private intervalId?: ReturnType<typeof setInterval>;
  private redirected = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    @Inject(PLATFORM_ID) private readonly platformId: object,
  ) {
    const params = this.route.snapshot.queryParamMap;
    const reason = params.get('reason') || 'default';

    this.targetPath = this.normalizeTarget(params.get('to'));
    this.message = REDIRECT_MESSAGES[reason] || REDIRECT_MESSAGES['default'];
    this.delayMs = this.normalizeDelay(params.get('delay'));
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const startedAt = Date.now();

    this.intervalId = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      this.progress.set(Math.min(100, Math.round((elapsed / this.delayMs) * 100)));
    }, 80);

    this.timeoutId = setTimeout(() => this.navigateNow(), this.delayMs);
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  navigateNow(): void {
    if (this.redirected) {
      return;
    }

    this.redirected = true;
    this.clearTimers();
    this.progress.set(100);
    void this.router.navigateByUrl(this.targetPath, { replaceUrl: true });
  }

  clearTimers(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  private normalizeTarget(target: string | null): string {
    if (!target || !target.startsWith('/') || target.startsWith('//')) {
      return '/';
    }

    return target;
  }

  private normalizeDelay(delay: string | null): number {
    const parsedDelay = Number(delay);

    if (!Number.isFinite(parsedDelay)) {
      return 2200;
    }

    return Math.min(8000, Math.max(900, parsedDelay));
  }
}
