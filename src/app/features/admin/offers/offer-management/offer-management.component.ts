import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Product } from '@app/models/product.model';
import { OfferService } from '@app/services/offer.service';
import { AdminSectionTab, AdminSectionTabsComponent } from '@app/features/admin/shared/admin-section-tabs/admin-section-tabs.component';
import { SharedMaterialModule } from '@app/shared/material/shared-material.module';
import { BrlCurrencyPipe } from '@app/shared/pipes/brl-currency.pipe';
import { combineLatest, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-offer-management',
  imports: [SharedMaterialModule, ReactiveFormsModule, AdminSectionTabsComponent, NgOptimizedImage, BrlCurrencyPipe],
  templateUrl: './offer-management.component.html',
  styleUrl: './offer-management.component.scss'
})
export class OfferManagementComponent implements OnInit, OnDestroy {
  readonly productTabs: AdminSectionTab[] = [
    { label: 'Produtos', icon: 'storefront', route: '/products' },
    { label: 'Estoque', icon: 'inventory_2', route: '/stock' },
    { label: 'Ofertas', icon: 'sell', route: '/offers' },
  ];

  products: Product[] = [];
  pagedProducts: Product[] = [];
  activeOffer: Product | null = null;
  selectedProduct: Product | null = null;
  offerForm: FormGroup;
  isLoading = true;
  isSaving = false;
  errorMessage = '';
  pageIndex = 0;
  pageSize = 3;
  readonly pageSizeOptions = [3, 6, 9];
  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private offerService: OfferService,
    private snackBar: MatSnackBar,
  ) {
    this.offerForm = this.fb.group({
      productId: ['', [Validators.required]],
      offerPrice: [null, [Validators.min(0)]],
      offerBadge: ['Oferta por tempo limitado', [Validators.required]],
      offerEndsAt: [''],
      offerSoldPercent: [72, [Validators.min(0), Validators.max(100)]],
    });
  }

  ngOnInit(): void {
    this.loadData();

    this.offerForm.get('productId')?.valueChanges.pipe(
      takeUntil(this.destroy$),
    ).subscribe(() => {
      this.updateSelectedProduct();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    combineLatest({
      products: this.offerService.getProducts(),
      offer: this.offerService.getActiveOffer(),
    }).subscribe({
      next: ({ products, offer }) => {
        this.products = products;
        this.activeOffer = offer;
        this.patchOffer(offer);
        this.resetPagination();
        this.updateSelectedProduct();
        this.updatePagedProducts();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Não foi possível carregar as ofertas agora. Tente novamente em alguns instantes.';
        this.isLoading = false;
      },
    });
  }

  saveOffer(): void {
    if (this.offerForm.invalid) {
      this.offerForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const value = this.offerForm.value;

    this.offerService.setActiveOffer(value.productId, {
      offer_price: value.offerPrice === null || value.offerPrice === '' ? null : Number(value.offerPrice),
      offer_badge: value.offerBadge,
      offer_ends_at: value.offerEndsAt ? new Date(value.offerEndsAt).toISOString() : null,
      offer_sold_percent: Number(value.offerSoldPercent) || 0,
    }).subscribe({
      next: product => {
        this.activeOffer = product;
        this.products = this.products.map(item => ({
          ...item,
          is_offer: item.id === product.id,
          is_featured: item.id === product.id ? true : item.is_featured,
        }));
        this.updateSelectedProduct();
        this.updatePagedProducts();
        this.showSnackbar('Oferta atualizada na landing page.');
        this.isSaving = false;
      },
      error: () => {
        this.showSnackbar('Não foi possível salvar a oferta agora. Confira os dados e tente novamente.');
        this.isSaving = false;
      },
    });
  }

  clearOffer(): void {
    this.offerService.clearOffer().subscribe({
      next: () => {
        this.activeOffer = null;
        this.products = this.products.map(product => ({ ...product, is_offer: false }));
        this.offerForm.patchValue({ productId: '' });
        this.updateSelectedProduct();
        this.updatePagedProducts();
        this.showSnackbar('Oferta removida da landing page.');
      },
      error: () => {
        this.showSnackbar('Não foi possível remover a oferta agora. Tente novamente.');
      },
    });
  }

  toggleFeatured(product: Product, checked: boolean): void {
    this.offerService.updateFeatured(product.id, checked).subscribe({
      next: updated => {
        this.products = this.products.map(item => item.id === updated.id ? updated : item);
        this.updateSelectedProduct();
        this.updatePagedProducts();
        this.showSnackbar('Destaque atualizado.');
      },
      error: () => {
        this.showSnackbar('Não foi possível atualizar o destaque agora. Tente novamente.');
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagedProducts();
  }

  handleImageError(event: Event, fallback = '/product1.png'): void {
    const image = event.target as HTMLImageElement;

    if (!image.src.endsWith(fallback)) {
      image.src = fallback;
    }
  }

  private patchOffer(offer: Product | null): void {
    if (!offer) {
      this.offerForm.patchValue({
        productId: '',
        offerPrice: null,
        offerBadge: 'Oferta por tempo limitado',
        offerEndsAt: '',
        offerSoldPercent: 72,
      });
      return;
    }

    this.offerForm.patchValue({
      productId: offer.id,
      offerPrice: offer.offer_price,
      offerBadge: offer.offer_badge,
      offerEndsAt: offer.offer_ends_at ? offer.offer_ends_at.slice(0, 16) : '',
      offerSoldPercent: offer.offer_sold_percent,
    });
  }

  private showSnackbar(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  private resetPagination(): void {
    this.pageIndex = 0;
  }

  private updateSelectedProduct(): void {
    const productId = this.offerForm.value.productId;
    this.selectedProduct = this.products.find(product => String(product.id) === String(productId)) || null;
  }

  private updatePagedProducts(): void {
    const start = this.pageIndex * this.pageSize;
    this.pagedProducts = this.products.slice(start, start + this.pageSize);
  }

}
