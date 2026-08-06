import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, distinctUntilChanged, from, map, of, switchMap, throwError } from 'rxjs';
import { supabase } from '@app/core/supabase/supabase.client';

export interface AdminStoreContext {
  id: string;
  name: string;
  region: string;
}

const STORAGE_KEY = 'infoshop-admin-current-store';

@Injectable({
  providedIn: 'root',
})
export class TenantContextService {
  private storesSubject = new BehaviorSubject<AdminStoreContext[]>([]);
  private selectedStoreIdSubject = new BehaviorSubject<string | null>(null);
  private loadPromise: Promise<void> | null = null;

  readonly stores$ = this.storesSubject.asObservable();
  readonly selectedStoreId$ = this.selectedStoreIdSubject.asObservable();
  readonly selectedStore$ = this.selectedStoreId$.pipe(
    map(storeId => this.storesSubject.value.find(store => store.id === storeId) || null),
  );
  readonly canSwitchStores$ = this.stores$.pipe(
    map(stores => stores.length > 1),
    distinctUntilChanged(),
  );

  async initialize(): Promise<void> {
    await this.ensureLoaded();
  }

  async ensureLoaded(): Promise<void> {
    if (!this.loadPromise) {
      this.loadPromise = this.loadStores();
    }

    await this.loadPromise;
  }

  selectedStoreIdRequired$(): Observable<string> {
    return from(this.ensureLoaded()).pipe(
      switchMap(() => this.selectedStoreId$),
      distinctUntilChanged(),
      switchMap(storeId => storeId
        ? of(storeId)
        : throwError(() => new Error('Nenhuma loja disponivel para este usuario administrativo.'))),
    );
  }

  async getSelectedStoreId(): Promise<string> {
    await this.ensureLoaded();

    const storeId = this.selectedStoreIdSubject.value;
    if (!storeId) {
      throw new Error('Nenhuma loja disponivel para este usuario administrativo.');
    }

    return storeId;
  }

  selectStore(storeId: string): void {
    const store = this.storesSubject.value.find(item => item.id === storeId);
    if (!store) {
      return;
    }

    this.selectedStoreIdSubject.next(store.id);
    localStorage.setItem(STORAGE_KEY, store.id);
  }

  reset(): void {
    this.loadPromise = null;
    this.storesSubject.next([]);
    this.selectedStoreIdSubject.next(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  private async loadStores(): Promise<void> {
    const { data: userResult } = await supabase.auth.getUser();

    if (!userResult.user) {
      this.resetLoadedState();
      return;
    }

    const { data, error } = await supabase.rpc('get_current_admin_stores');

    if (error) {
      throw error;
    }

    const stores = (data || []) as AdminStoreContext[];
    const persistedStoreId = localStorage.getItem(STORAGE_KEY);
    const selectedStore = stores.find(store => store.id === persistedStoreId) || stores[0] || null;

    this.storesSubject.next(stores);
    this.selectedStoreIdSubject.next(selectedStore?.id || null);

    if (selectedStore) {
      localStorage.setItem(STORAGE_KEY, selectedStore.id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private resetLoadedState(): void {
    this.storesSubject.next([]);
    this.selectedStoreIdSubject.next(null);
    localStorage.removeItem(STORAGE_KEY);
  }
}
