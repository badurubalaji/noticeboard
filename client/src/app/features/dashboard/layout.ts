import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class LayoutComponent {
  sidebarCollapsed = false;

  navItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/notices', icon: '📝', label: 'Notices' },
    { path: '/templates', icon: '📄', label: 'Templates' },
    { path: '/boards', icon: '📺', label: 'Boards' },
    { path: '/media', icon: '🖼️', label: 'Media Library' },
    { path: '/settings', icon: '⚙️', label: 'Settings' },
    { path: '/help', icon: '💡', label: 'Help' },
  ];

  brandStyle = computed(() => this.auth.tenant()?.branding?.brandStyle || 'logo+text');

  constructor(public auth: AuthService, private router: Router) {}

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  logout(): void {
    this.auth.logout();
  }
}
