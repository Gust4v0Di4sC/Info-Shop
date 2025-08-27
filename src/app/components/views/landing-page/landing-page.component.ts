import { Component } from '@angular/core';


import { SpecialOfferComponent } from '../../template/special-offer/special-offer.component';
import { HeaderComponent } from '../../template/header/header.component';
import { HeroComponent } from '../../template/hero/hero.component';
import { FeaturedProductsComponent } from '../../template/featured-products/featured-products.component';
import { CategoriesComponent } from '../../template/categories/categories.component';


import { ContactComponent } from '../../template/contact/contact.component';
import { FooterComponent } from '../../template/footer/footer.component';

@Component({
  selector: 'app-landing-page',
  imports: [HeaderComponent,HeroComponent, FeaturedProductsComponent,CategoriesComponent,ContactComponent, FooterComponent,SpecialOfferComponent],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent {

}
