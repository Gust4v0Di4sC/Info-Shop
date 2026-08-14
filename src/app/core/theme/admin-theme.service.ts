import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID, computed, signal } from '@angular/core';
import { supabase } from '@app/core/supabase/supabase.client';
import { AuthService } from '@app/core/auth/auth.service';
import {
  ADMIN_THEME_OPTIONS,
  AdminPersonalization,
  AdminThemeId,
  DEFAULT_ADMIN_THEME_ID,
  normalizeAdminThemeId,
} from '@app/models/admin-theme.model';

const DEFAULT_PERSONALIZATION: AdminPersonalization = {
  themeId: DEFAULT_ADMIN_THEME_ID,
  storeLogoUrl: null,
};

const THEME_CLASS_NAMES = ADMIN_THEME_OPTIONS.map(theme => theme.className);
const STORAGE_KEY = 'infoshop-admin-personalization';

@Injectable({
  providedIn: 'root',
})
export class AdminThemeService {
  readonly themes = ADMIN_THEME_OPTIONS;

  private readonly personalization = signal<AdminPersonalization>(DEFAULT_PERSONALIZATION);
  private readonly previewThemeId = signal<AdminThemeId | null>(null);
  private readonly isBrowser: boolean;

  readonly currentThemeId = computed(() => this.previewThemeId() || this.personalization().themeId);
  readonly currentTheme = computed(() => {
    const themeId = this.currentThemeId();
    return this.themes.find(theme => theme.id === themeId) || this.themes[0];
  });
  readonly storeLogoUrl = computed(() => this.personalization().storeLogoUrl);
  readonly publicLogoUrl = computed(() => this.storeLogoUrl() || '/Logo3.svg');
  readonly footerLogoUrl = computed(() => this.storeLogoUrl() || '/Logo2.svg');
  readonly adminLogoUrl = computed(() => this.storeLogoUrl() || '/Logo1.svg');
  readonly adminIconUrl = computed(() => this.storeLogoUrl() || '/icon.svg');

  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) platformId: object,
    private authService: AuthService,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.restoreCachedPersonalization();
    this.applyTheme(this.currentThemeId());
  }

  async initialize(): Promise<void> {
    if (!this.isBrowser) {
      return;
    }

    this.authService.currentUser$.subscribe(user => {
      if (!user) {
        this.setPersonalization(DEFAULT_PERSONALIZATION);
        return;
      }

      void this.loadForUser(user.id);
    });

    const user = await this.authService.getCurrentUserAsync();

    if (user) {
      await this.loadForUser(user.id);
      return;
    }

    this.setPersonalization(DEFAULT_PERSONALIZATION);
  }

  previewTheme(themeId: AdminThemeId): void {
    this.previewThemeId.set(normalizeAdminThemeId(themeId));
    this.applyTheme(themeId);
  }

  restoreCurrentTheme(): void {
    this.previewThemeId.set(null);
    this.applyTheme(this.currentThemeId());
  }

  async savePersonalization(themeId: AdminThemeId, storeLogoUrl: string | null): Promise<void> {
    const nextPersonalization: AdminPersonalization = {
      themeId: normalizeAdminThemeId(themeId),
      storeLogoUrl: this.normalizeLogoUrl(storeLogoUrl),
    };

    const { data, error } = await supabase.rpc('update_admin_personalization', {
      theme_id_value: nextPersonalization.themeId,
      store_logo_url_value: nextPersonalization.storeLogoUrl ?? '',
    });

    if (error) {
      throw error;
    }

    this.setPersonalization({
      themeId: normalizeAdminThemeId(data.theme_id),
      storeLogoUrl: data.store_logo_url,
    });
  }

  async uploadStoreLogo(file: File): Promise<string> {
    const user = await this.authService.requireCurrentUser('Sessao administrativa nao encontrada.');
    const filePath = `${user.id}/${Date.now()}-${this.sanitizeFileName(file.name)}`;
    const uploadResult = await supabase.storage
      .from('admin-branding')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadResult.error) {
      throw uploadResult.error;
    }

    return supabase.storage.from('admin-branding').getPublicUrl(filePath).data.publicUrl;
  }

  private async loadForUser(userId: string): Promise<void> {
    const { data, error } = await supabase
      .from('admins')
      .select('theme_id, store_logo_url')
      .eq('user_id', userId)
      .eq('active', true)
      .maybeSingle();

    if (error || !data) {
      this.setPersonalization(DEFAULT_PERSONALIZATION);
      return;
    }

    this.setPersonalization({
      themeId: normalizeAdminThemeId(data.theme_id),
      storeLogoUrl: data.store_logo_url,
    });
  }

  private setPersonalization(personalization: AdminPersonalization): void {
    this.personalization.set({
      themeId: normalizeAdminThemeId(personalization.themeId),
      storeLogoUrl: this.normalizeLogoUrl(personalization.storeLogoUrl),
    });
    this.previewThemeId.set(null);
    this.applyTheme(this.currentThemeId());
    this.cachePersonalization();
  }

  private applyTheme(themeId: AdminThemeId): void {
    if (!this.isBrowser) {
      return;
    }

    const body = this.document.body;
    body.classList.add('admin-theme');
    body.classList.remove(...THEME_CLASS_NAMES);
    body.classList.add(`admin-theme-${normalizeAdminThemeId(themeId)}`);
  }

  private restoreCachedPersonalization(): void {
    if (!this.isBrowser) {
      return;
    }

    const rawValue = window.localStorage.getItem(STORAGE_KEY);

    if (!rawValue) {
      return;
    }

    try {
      const cached = JSON.parse(rawValue) as Partial<AdminPersonalization>;
      this.personalization.set({
        themeId: normalizeAdminThemeId(cached.themeId),
        storeLogoUrl: this.normalizeLogoUrl(cached.storeLogoUrl || null),
      });
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  private cachePersonalization(): void {
    if (!this.isBrowser) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.personalization()));
  }

  private normalizeLogoUrl(url: string | null | undefined): string | null {
    const value = url?.trim();
    return value || null;
  }

  private sanitizeFileName(fileName: string): string {
    return fileName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase();
  }
}
