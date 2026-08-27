import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-categories',
  imports: [MatIconModule, RouterLink],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesComponent {
  readonly categories = [
    { name: 'Notebooks', count: 5, icon: 'laptop_mac', slug: 'notebooks' },
    { name: 'Smartphones', count: 5, icon: 'smartphone', slug: 'smartphones' },
    { name: 'Tablets', count: 5, icon: 'tablet_mac', slug: 'tablets' },
    { name: 'Games', count: 5, icon: 'sports_esports', slug: 'games' },
    { name: 'Hardware', count: 5, icon: 'memory', slug: 'hardware' },
    { name: 'Periféricos', count: 5, icon: 'keyboard', slug: 'perifericos' },
  ];
}
