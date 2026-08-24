import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminThemeService } from '@app/core/theme/admin-theme.service';
import { AdminSectionTab, AdminSectionTabsComponent } from '@app/features/admin/shared/admin-section-tabs/admin-section-tabs.component';
import { AdminThemeId } from '@app/models/admin-theme.model';
import { SharedMaterialModule } from '@app/shared/material/shared-material.module';

@Component({
  selector: 'app-admin-personalization',
  imports: [SharedMaterialModule, AdminSectionTabsComponent],
  templateUrl: './admin-personalization.component.html',
  styleUrl: './admin-personalization.component.scss',
})
export class AdminPersonalizationComponent implements OnInit, OnDestroy {
  readonly profileTabs: AdminSectionTab[] = [
    { label: 'Perfil', icon: 'account_circle', route: '/admin-profile' },
    { label: 'Personalização', icon: 'palette', route: '/customization' },
  ];

  readonly themeService = inject(AdminThemeService);
  private readonly snackBar = inject(MatSnackBar);

  readonly themes = this.themeService.themes;

  selectedThemeId: AdminThemeId = this.themeService.currentThemeId();
  logoUrl = this.themeService.storeLogoUrl() || '';
  isSaving = false;
  isUploading = false;

  ngOnInit(): void {
    this.selectedThemeId = this.themeService.currentThemeId();
    this.logoUrl = this.themeService.storeLogoUrl() || '';
  }

  ngOnDestroy(): void {
    this.themeService.restoreCurrentTheme();
  }

  selectTheme(themeId: AdminThemeId): void {
    this.selectedThemeId = themeId;
    this.themeService.previewTheme(themeId);
  }

  updateLogoUrl(event: Event): void {
    this.logoUrl = (event.target as HTMLInputElement).value;
  }

  clearLogo(): void {
    this.logoUrl = '';
  }

  async onLogoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      return;
    }

    if (!this.isAcceptedLogo(file)) {
      this.showFeedback('Use uma imagem PNG, JPG, WEBP ou SVG de até 2 MB.');
      return;
    }

    this.isUploading = true;

    try {
      this.logoUrl = await this.themeService.uploadStoreLogo(file);
      this.showFeedback('Logo enviada. Salve para aplicar no perfil.');
    } catch {
      this.showFeedback('Não foi possível enviar a logo agora. Verifique a imagem e tente novamente.');
    } finally {
      this.isUploading = false;
    }
  }

  async save(): Promise<void> {
    this.isSaving = true;

    try {
      await this.themeService.savePersonalization(this.selectedThemeId, this.logoUrl);
      this.showFeedback('Personalização salva no seu perfil.');
    } catch {
      this.showFeedback('Não foi possível salvar a personalização agora. Tente novamente em alguns instantes.');
    } finally {
      this.isSaving = false;
    }
  }

  logoPreviewUrl(): string {
    return this.logoUrl.trim() || this.themeService.adminLogoUrl();
  }

  private isAcceptedLogo(file: File): boolean {
    const acceptedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    return acceptedTypes.includes(file.type) && file.size <= 2 * 1024 * 1024;
  }

  private showFeedback(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3500,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }
}
