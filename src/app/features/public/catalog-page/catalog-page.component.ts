import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { FooterComponent } from '@app/features/public/components/footer/footer.component';
import { HeaderComponent } from '@app/features/public/components/header/header.component';
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
  { label: 'Perifericos', slug: 'perifericos' },
];

@Component({
  selector: 'app-catalog-page',
  imports: [HeaderComponent, FooterComponent, RouterLink, BrlCurrencyPipe],
  templateUrl: './catalog-page.component.html',
  styleUrl: './catalog-page.component.scss',
})
export class CatalogPageComponent implements OnInit {
  readonly categories = CATEGORIES;
  products: Product[] = [];
  selectedCategory: CatalogCategory | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly productService: ProductService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const categorySlug = params.get('category');
      this.selectedCategory = this.categories.find(category => category.slug === categorySlug) || null;
      this.loadProducts(this.selectedCategory?.slug || null);
    });
  }

  private loadProducts(categorySlug: string | null): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.productService.getPublicCatalog(categorySlug).subscribe({
      next: products => {
        this.products = products;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Nao foi possivel carregar o catalogo.';
        this.isLoading = false;
      },
    });
  }
}
