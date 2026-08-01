import { Component } from '@angular/core';


@Component({
  selector: 'app-categories',
  imports: [],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent {
  categories = [
    { name: 'Notebooks', count: 42, icon: 'fas fa-laptop' },
    { name: 'Smartphones', count: 35, icon: 'fas fa-mobile-alt' },
    { name: 'Periféricos', count: 28, icon: 'fas fa-keyboard' },
    { name: 'Acessórios', count: 15, icon: 'fas fa-headphones' }
  ];
}