import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { supabase } from '@app/core/supabase/supabase.client';
import { AuthService } from '@app/core/auth/auth.service';
import { getSupabaseData } from '@app/core/supabase/supabase-response';
import { AppUser, AppUserUpdate } from '@app/models/app-user.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerProfileService {
  constructor(private authService: AuthService) {}

  getCurrentProfile(): Observable<AppUser> {
    return from(this.ensureCurrentProfile());
  }

  updateCurrentProfile(profile: AppUserUpdate): Observable<AppUser> {
    return from(this.updateProfile(profile));
  }

  uploadAvatar(file: File): Observable<string> {
    return from(this.uploadProfileAvatar(file));
  }

  isCurrentUserAdmin(): Observable<boolean> {
    return from(this.loadAdminStatus());
  }

  private async getAuthUser() {
    return this.authService.requireCurrentUser('Entre na sua conta para acessar o perfil.');
  }

  private async ensureCurrentProfile(): Promise<AppUser> {
    const user = await this.getAuthUser();
    const existingResult = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (existingResult.error) {
      throw existingResult.error;
    }

    if (existingResult.data) {
      return existingResult.data;
    }

    const createResult = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email || '',
        full_name: this.getMetadataValue(user.user_metadata, 'full_name') ||
          this.getMetadataValue(user.user_metadata, 'name'),
      }, { onConflict: 'id' })
      .select()
      .single();

    return getSupabaseData(createResult);
  }

  private async updateProfile(profile: AppUserUpdate): Promise<AppUser> {
    const user = await this.getAuthUser();
    const result = await supabase
      .from('users')
      .update(profile)
      .eq('id', user.id)
      .select()
      .single();

    return getSupabaseData(result);
  }

  private async uploadProfileAvatar(file: File): Promise<string> {
    const user = await this.getAuthUser();
    const filePath = `${user.id}/${Date.now()}-${this.sanitizeFileName(file.name)}`;
    const uploadResult = await supabase.storage
      .from('customer-avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadResult.error) {
      throw uploadResult.error;
    }

    return supabase.storage.from('customer-avatars').getPublicUrl(filePath).data.publicUrl;
  }

  private async loadAdminStatus(): Promise<boolean> {
    const user = await this.getAuthUser();
    const result = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .eq('active', true)
      .maybeSingle();

    if (result.error) {
      throw result.error;
    }

    return Boolean(result.data);
  }

  private getMetadataValue(metadata: Record<string, unknown>, key: string): string | null {
    const value = metadata[key];
    return typeof value === 'string' && value.trim() ? value : null;
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
