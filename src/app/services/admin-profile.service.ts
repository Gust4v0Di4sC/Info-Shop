import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { supabase } from '@app/core/supabase/supabase.client';
import { getSupabaseData } from '@app/core/supabase/supabase-response';
import { Admin, Store } from '@app/models/admin.model';
import { AppUser, AppUserUpdate } from '@app/models/app-user.model';
import { TenantContextService } from '@app/core/tenant/tenant-context.service';
import { AuthService } from '@app/core/auth/auth.service';

export interface AdminProfile {
  user: AppUser;
  admin: Admin;
  store: Store | null;
}

export interface AdminProfileUpdate {
  user: Pick<AppUserUpdate, 'full_name' | 'phone' | 'document' | 'address'>;
  admin: {
    region: string;
    store_name: string;
  };
  store: {
    sender_document: string | null;
    sender_email: string | null;
    sender_phone: string | null;
    sender_postal_code: string | null;
    sender_address: string | null;
    sender_number: string | null;
    sender_complement: string | null;
    sender_district: string | null;
    sender_city: string | null;
    sender_state: string | null;
    default_package_weight: number;
    default_package_width: number;
    default_package_height: number;
    default_package_length: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AdminProfileService {
  constructor(
    private tenantContext: TenantContextService,
    private authService: AuthService,
  ) {}

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

    const store = await this.loadSelectedStore();

    return {
      user: getSupabaseData(userResult),
      admin: getSupabaseData(adminResult),
      store,
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

    const storeId = await this.tenantContext.getSelectedStoreId();
    const storeResult = await supabase.rpc('update_store_shipping', {
      store_id_value: storeId,
      sender_document_value: profile.store.sender_document ?? '',
      sender_email_value: profile.store.sender_email ?? '',
      sender_phone_value: profile.store.sender_phone ?? '',
      sender_postal_code_value: profile.store.sender_postal_code ?? '',
      sender_address_value: profile.store.sender_address ?? '',
      sender_number_value: profile.store.sender_number ?? '',
      sender_complement_value: profile.store.sender_complement ?? '',
      sender_district_value: profile.store.sender_district ?? '',
      sender_city_value: profile.store.sender_city ?? '',
      sender_state_value: profile.store.sender_state ?? '',
      default_package_weight_value: profile.store.default_package_weight,
      default_package_width_value: profile.store.default_package_width,
      default_package_height_value: profile.store.default_package_height,
      default_package_length_value: profile.store.default_package_length,
    });

    return {
      user: getSupabaseData(userResult),
      admin: getSupabaseData(adminResult),
      store: getSupabaseData(storeResult),
    };
  }

  private async loadSelectedStore(): Promise<Store | null> {
    try {
      const storeId = await this.tenantContext.getSelectedStoreId();
      const storeResult = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();

      return getSupabaseData(storeResult);
    } catch {
      return null;
    }
  }

  private async getAuthUser() {
    return this.authService.requireCurrentUser('Entre na sua conta administrativa para acessar o perfil.');
  }
}
