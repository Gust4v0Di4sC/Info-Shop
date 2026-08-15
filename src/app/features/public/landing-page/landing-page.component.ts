import { ChangeDetectionStrategy, Component } from '@angular/core';

import { CategoriesComponent } from '@app/features/public/components/categories/categories.component';
import { ContactComponent } from '@app/features/public/components/contact/contact.component';
import { FeaturedProductsComponent } from '@app/features/public/components/featured-products/featured-products.component';
import { HeroComponent } from '@app/features/public/components/hero/hero.component';
import { SpecialOfferComponent } from '@app/features/public/components/special-offer/special-offer.component';

@Component({
  selector: 'app-landing-page',
  imports: [
    HeroComponent,
    FeaturedProductsComponent,
    CategoriesComponent,
    ContactComponent,
    SpecialOfferComponent,
  ],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class LandingPageComponent {}
