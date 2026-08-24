import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, distinctUntilChanged, from, map, of, switchMap, throwError } from 'rxjs';
import { supabase } from '@app/core/supabase/supabase.client';
import { AuthService } from '@app/core/auth/auth.service';

export interface AdminStoreContext {
  id: string;
  name: string;
  region: string;
}

const STORAGE_KEY = 'infoshop-admin-current-store';
const STORE_LOAD_RETRY_DELAYS_MS = [500, 1500, 3000];

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

  constructor(private authService: AuthService) {}

  async initialize(): Promise<void> {
    await this.ensureLoaded();
  }

  async ensureLoaded(): Promise<void> {
    if (!this.loadPromise) {
      this.loadPromise = this.loadStoresWithRetry().catch(error => {
        this.loadPromise = null;
        throw error;
      });
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
    const user = await this.authService.getCurrentUserAsync();

    if (!user) {
      this.resetLoadedState();
      return;
    }

    const { data, error } = await supabase
      .from('admin_store_accesses')
      .select('stores(id, name, region)');

    if (error) {
      throw error;
    }

    const stores = normalizeStoresFromAccessRows(data || []);
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

  private async loadStoresWithRetry(): Promise<void> {
    for (let attempt = 0; attempt <= STORE_LOAD_RETRY_DELAYS_MS.length; attempt++) {
      try {
        await this.loadStores();
        return;
      } catch (error) {
        const retryDelay = STORE_LOAD_RETRY_DELAYS_MS[attempt];

        if (retryDelay === undefined) {
          throw error;
        }

        await delay(retryDelay);
      }
    }
  }

  private resetLoadedState(): void {
    this.storesSubject.next([]);
    this.selectedStoreIdSubject.next(null);
    localStorage.removeItem(STORAGE_KEY);
  }
}

function delay(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function normalizeStoresFromAccessRows(rows: unknown[]): AdminStoreContext[] {
  const stores = new Map<string, AdminStoreContext>();

  rows.forEach(row => {
    const store = (row as { stores?: AdminStoreContext | AdminStoreContext[] | null }).stores;
    const normalizedStore = Array.isArray(store) ? store[0] : store;

    if (normalizedStore?.id && normalizedStore.name && normalizedStore.region) {
      stores.set(normalizedStore.id, normalizedStore);
    }
  });

  return Array.from(stores.values()).sort((a, b) =>
    a.region.localeCompare(b.region) || a.name.localeCompare(b.name),
  );
}
