import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { supabase } from '@app/core/supabase/supabase.client';
import { getSupabaseData } from '@app/core/supabase/supabase-response';
import { Admin } from '@app/models/admin.model';
import { AppUser, AppUserUpdate } from '@app/models/app-user.model';

export interface AdminProfile {
  user: AppUser;
  admin: Admin;
}

export interface AdminProfileUpdate {
  user: Pick<AppUserUpdate, 'full_name' | 'phone' | 'document' | 'address'>;
  admin: {
    region: string;
    store_name: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AdminProfileService {
  getCurrentAdminProfile(): Observable<AdminProfile> {
    return from(this.loadCurrentAdminProfile());
  }

  updateCurrentAdminProfile(profile: AdminProfileUpdate): Observable<AdminProfile> {
    return from(this.updateAdminProfile(profile));
  }

  private async loadCurrentAdminProfile(): Promise<AdminProfile> {
    const authUser = await this.getAuthUser();

    const userResult = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    const adminResult = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', authUser.id)
      .eq('active', true)
      .single();

    return {
      user: getSupabaseData(userResult),
      admin: getSupabaseData(adminResult),
    };
  }

  private async updateAdminProfile(profile: AdminProfileUpdate): Promise<AdminProfile> {
    const authUser = await this.getAuthUser();

    const userResult = await supabase
      .from('users')
      .update(profile.user)
      .eq('id', authUser.id)
      .select()
      .single();

    const adminResult = await supabase.rpc('update_admin_profile', {
      region_value: profile.admin.region,
      store_name_value: profile.admin.store_name,
    });

    return {
      user: getSupabaseData(userResult),
      admin: getSupabaseData(adminResult),
    };
  }

  private async getAuthUser() {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error('Entre na sua conta administrativa para acessar o perfil.');
    }

    return data.user;
  }
}
