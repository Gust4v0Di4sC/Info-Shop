import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { combineLatest } from 'rxjs';

import { Product } from '@app/models/product.model';
import { ProductService } from '@app/services/product.service';
import { BrlCurrencyPipe } from '@app/shared/pipes/brl-currency.pipe';

interface CatalogCategory {
  label: string;
  slug: string;
}

const CATEGORIES: CatalogCategory[] = [
  { label: 'Notebooks', slug: 'notebooks' },
  { label: 'Smartphones', slug: 'smartphones' },
  { label: 'Tablets', slug: 'tablets' },
  { label: 'Games', slug: 'games' },
  { label: 'Hardware', slug: 'hardware' },
  { label: 'Periféricos', slug: 'perifericos' },
];

@Component({
  selector: 'app-catalog-page',
  imports: [RouterLink, BrlCurrencyPipe],
  templateUrl: './catalog-page.component.html',
  styleUrl: './catalog-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogPageComponent implements OnInit {
  readonly categories = CATEGORIES;
  products: Product[] = [];
  selectedCategory: CatalogCategory | null = null;
  searchTerm = '';
  isLoading = true;
  errorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly productService: ProductService,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    combineLatest([this.route.paramMap, this.route.queryParamMap]).subscribe(([params, queryParams]) => {
      const categorySlug = params.get('category');
      this.selectedCategory = this.categories.find(category => category.slug === categorySlug) || null;
      this.searchTerm = (queryParams.get('q') || '').trim();
      this.loadProducts(this.selectedCategory?.slug || null, this.searchTerm);
      this.changeDetectorRef.markForCheck();
    });
  }

  pageTitle(): string {
    if (this.searchTerm && this.selectedCategory) {
      return `${this.selectedCategory.label}: "${this.searchTerm}"`;
    }

    if (this.searchTerm) {
      return `Busca por "${this.searchTerm}"`;
    }

    return this.selectedCategory?.label || 'Todos os produtos';
  }

  emptyMessage(): string {
    if (this.searchTerm) {
      return 'Nenhum produto encontrado para esta busca.';
    }

    return 'Nenhum produto encontrado nesta categoria.';
  }

  private loadProducts(categorySlug: string | null, searchTerm: string): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.changeDetectorRef.markForCheck();

    this.productService.getPublicCatalog(categorySlug, searchTerm).subscribe({
      next: products => {
        this.products = products;
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Não foi possível carregar o catálogo.';
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      },
    });
  }
}
