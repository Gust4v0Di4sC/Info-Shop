import { Component } from '@angular/core';
import { AdminThemeService } from '@app/core/theme/admin-theme.service';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  constructor(readonly themeService: AdminThemeService) {}
}
