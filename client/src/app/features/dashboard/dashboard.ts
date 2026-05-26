import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Notice, Category, Board } from '../../core/models/interfaces';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  stats = signal({
    totalNotices: 0,
    activeNotices: 0,
    scheduledNotices: 0,
    totalBoards: 0,
  });
  recentNotices = signal<Notice[]>([]);
  categories = signal<Category[]>([]);
  boards = signal<Board[]>([]);
  loading = signal(true);

  constructor(public auth: AuthService, private api: ApiService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);

    this.api.getNotices({ limit: '5', sortBy: 'createdAt', sortOrder: 'desc' }).subscribe({
      next: (res) => {
        this.recentNotices.set(res.notices);
        this.stats.update(s => ({ ...s, totalNotices: res.pagination.total }));
      },
    });

    this.api.getNotices({ status: 'active', limit: '1' }).subscribe({
      next: (res) => this.stats.update(s => ({ ...s, activeNotices: res.pagination.total })),
    });

    this.api.getNotices({ status: 'scheduled', limit: '1' }).subscribe({
      next: (res) => this.stats.update(s => ({ ...s, scheduledNotices: res.pagination.total })),
    });

    this.api.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
    });

    this.api.getBoards().subscribe({
      next: (boards) => {
        this.boards.set(boards);
        this.stats.update(s => ({ ...s, totalBoards: boards.length }));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getPriorityLabel(p: number): string {
    return ['', 'Critical', 'High', 'Medium', 'Low', 'Info'][p] || 'Medium';
  }

  getTimeAgo(date: string): string {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }
}
