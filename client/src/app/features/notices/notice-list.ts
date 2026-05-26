import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Notice, Category, PaginatedResponse } from '../../core/models/interfaces';

@Component({
  selector: 'app-notice-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './notice-list.html',
  styleUrl: './notice-list.scss',
})
export class NoticeListComponent implements OnInit {
  notices = signal<Notice[]>([]);
  categories = signal<Category[]>([]);
  pagination = signal({ page: 1, limit: 20, total: 0, pages: 0 });
  loading = signal(true);

  // Filters
  filters = {
    search: '',
    status: '',
    category: '',
    priority: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadNotices();
    this.api.getCategories().subscribe((cats: Category[]) => this.categories.set(cats));
  }

  loadNotices(page = 1): void {
    this.loading.set(true);
    const params: Record<string, string> = {
      page: page.toString(),
      limit: '20',
      sortBy: this.filters.sortBy,
      sortOrder: this.filters.sortOrder,
    };
    if (this.filters.search) params['search'] = this.filters.search;
    if (this.filters.status) params['status'] = this.filters.status;
    if (this.filters.category) params['category'] = this.filters.category;
    if (this.filters.priority) params['priority'] = this.filters.priority;

    this.api.getNotices(params).subscribe({
      next: (res: PaginatedResponse<Notice>) => {
        this.notices.set(res.notices);
        this.pagination.set(res.pagination);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(): void {
    this.loadNotices(1);
  }

  deleteNotice(id: string): void {
    if (confirm('Are you sure you want to delete this notice?')) {
      this.api.deleteNotice(id).subscribe(() => this.loadNotices(this.pagination().page));
    }
  }

  toggleStatus(notice: Notice): void {
    const newStatus = notice.status === 'active' ? 'draft' : 'active';
    this.api.updateNoticeStatus(notice._id, newStatus).subscribe(() => {
      this.loadNotices(this.pagination().page);
    });
  }

  getPriorityLabel(p: number): string {
    return ['', 'Critical', 'High', 'Medium', 'Low', 'Info'][p] || 'Medium';
  }

  prevPage(): void {
    if (this.pagination().page > 1) this.loadNotices(this.pagination().page - 1);
  }

  nextPage(): void {
    if (this.pagination().page < this.pagination().pages) this.loadNotices(this.pagination().page + 1);
  }
}
