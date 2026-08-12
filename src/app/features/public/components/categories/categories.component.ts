import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-categories',
  imports: [RouterLink],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss'],
})
export class CategoriesComponent {
  readonly categories = [
    { name: 'Notebooks', count: 5, icon: 'fas fa-laptop', slug: 'notebooks' },
    { name: 'Smartphones', count: 5, icon: 'fas fa-mobile-alt', slug: 'smartphones' },
    { name: 'Tablets', count: 5, icon: 'fas fa-tablet-alt', slug: 'tablets' },
    { name: 'Games', count: 5, icon: 'fas fa-gamepad', slug: 'games' },
    { name: 'Hardware', count: 5, icon: 'fas fa-microchip', slug: 'hardware' },
    { name: 'Perifericos', count: 5, icon: 'fas fa-keyboard', slug: 'perifericos' },
  ];
}
