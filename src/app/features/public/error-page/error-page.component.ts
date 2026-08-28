import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { SharedMaterialModule } from '@app/shared/material/shared-material.module';

interface ErrorCopy {
  icon: string;
  title: string;
  message: string;
}

const ERROR_COPY: Record<string, ErrorCopy> = {
  '401': {
    icon: 'lock',
    title: 'Sessao necessaria',
    message: 'Entre na sua conta para continuar esse fluxo com seguranca.',
  },
  '403': {
    icon: 'admin_panel_settings',
    title: 'Acesso restrito',
    message: 'Seu perfil nao tem permissao para abrir esta area.',
  },
  '500': {
    icon: 'report',
    title: 'Algo nao respondeu como esperado',
    message: 'A pagina encontrou um problema temporario. Voce pode tentar novamente ou voltar para uma area segura.',
  },
  '503': {
    icon: 'cloud_off',
    title: 'Servico indisponivel',
    message: 'Estamos com instabilidade para carregar esta parte da loja.',
  },
};

@Component({
  selector: 'app-error-page',
  imports: [RouterLink, SharedMaterialModule],
  templateUrl: './error-page.component.html',
  styleUrl: './error-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);

  readonly code = this.route.snapshot.paramMap.get('code')
    || this.route.snapshot.queryParamMap.get('code')
    || '500';

  readonly incident = this.route.snapshot.queryParamMap.get('incident') || '';
  readonly copy = ERROR_COPY[this.code] || ERROR_COPY['500'];

  goBack(): void {
    this.location.back();
  }
}
