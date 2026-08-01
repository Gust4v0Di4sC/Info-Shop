import { Component } from '@angular/core';

import { CategoriesComponent } from '@app/features/public/components/categories/categories.component';
import { ContactComponent } from '@app/features/public/components/contact/contact.component';
import { FeaturedProductsComponent } from '@app/features/public/components/featured-products/featured-products.component';
import { FooterComponent } from '@app/features/public/components/footer/footer.component';
import { HeaderComponent } from '@app/features/public/components/header/header.component';
import { HeroComponent } from '@app/features/public/components/hero/hero.component';
import { SpecialOfferComponent } from '@app/features/public/components/special-offer/special-offer.component';

@Component({
  selector: 'app-landing-page',
  imports: [
    HeaderComponent,
    HeroComponent,
    FeaturedProductsComponent,
    CategoriesComponent,
    ContactComponent,
    FooterComponent,
    SpecialOfferComponent,
  ],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
})
export default class LandingPageComponent {}
