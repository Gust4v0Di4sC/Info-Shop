import { Component, Input, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '@app/core/auth/auth.service';
import { ADMIN_ROLE_ACCESS, AdminRole } from '@app/models/admin.model';
import { SharedMaterialModule } from '@app/shared/material/shared-material.module';

export interface AdminSectionTab {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-admin-section-tabs',
  imports: [RouterModule, SharedMaterialModule],
  templateUrl: './admin-section-tabs.component.html',
  styleUrl: './admin-section-tabs.component.scss',
})
export class AdminSectionTabsComponent implements OnInit {
  private authService = inject(AuthService);

  @Input({ required: true }) tabs: AdminSectionTab[] = [];

  adminRole: AdminRole | null = null;

  async ngOnInit(): Promise<void> {
    this.adminRole = await this.authService.getAdminRole();
  }

  visibleTabs(): AdminSectionTab[] {
    if (!this.adminRole) {
      return [];
    }

    const allowedRoutes = ADMIN_ROLE_ACCESS[this.adminRole];
    return this.tabs.filter(tab => allowedRoutes.includes(tab.route));
  }
}
