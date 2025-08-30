import { Component } from '@angular/core';


import { SpecialOfferComponent } from '@app/components/template/special-offer/special-offer.component';
import { HeaderComponent } from '@app/components/template/header/header.component';
import { HeroComponent } from '@app/components/template/hero/hero.component';
import { FeaturedProductsComponent } from '@app/components/template/featured-products/featured-products.component';
import { CategoriesComponent } from '@app/components/template/categories/categories.component';
import { ContactComponent } from '@app/components/template/contact/contact.component';
import { FooterComponent } from '@app/components/template/footer/footer.component';

@Component({
  selector: 'app-landing-page',
  imports: [HeaderComponent,HeroComponent, FeaturedProductsComponent,CategoriesComponent,ContactComponent, FooterComponent,SpecialOfferComponent],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export default class LandingPageComponent {

}
