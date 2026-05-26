import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Notice, Category } from '../../core/models/interfaces';

@Component({
  selector: 'app-notice-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './notice-form.html',
  styleUrl: './notice-form.scss',
})
export class NoticeFormComponent implements OnInit {
  isEdit = false;
  noticeId = '';
  loading = signal(false);
  saving = signal(false);
  categories = signal<Category[]>([]);

  form: Partial<Notice> = {
    title: '',
    content: '',
    type: 'text',
    priority: 3,
    status: 'draft',
    tags: [],
    displayConfig: {
      size: 'medium',
      gridSpan: { cols: 1, rows: 1 },
      bgColor: '',
      textColor: '',
      animation: 'none',
    },
    schedule: {
      startDate: null,
      endDate: null,
      recurrence: 'none',
      timeSlots: [],
    },
  };

  tagInput = '';

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
      this.api.getCategories().subscribe((cats: Category[]) => this.categories.set(cats));

    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEdit = true;
      this.noticeId = id;
      this.loading.set(true);
      this.api.getNotice(id).subscribe({
        next: (notice: Notice) => {
          const category = notice.category as unknown;
          const categoryId =
            category && typeof category === 'object' && '_id' in (category as any)
              ? (category as any)._id
              : (category as string | undefined) ?? null;
          this.form = { ...notice, category: categoryId };
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.router.navigate(['/notices']);
        },
      });
    }
  }

  addTag(): void {
    const tag = this.tagInput.trim();
    if (tag && !this.form.tags?.includes(tag)) {
      this.form.tags = [...(this.form.tags || []), tag];
      this.tagInput = '';
    }
  }

  removeTag(tag: string): void {
    this.form.tags = this.form.tags?.filter((t: string) => t !== tag) || [];
  }

  save(): void {
    if (!this.form.title) return;
    this.saving.set(true);

    const obs = this.isEdit
      ? this.api.updateNotice(this.noticeId, this.form)
      : this.api.createNotice(this.form);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/notices']);
      },
      error: () => this.saving.set(false),
    });
  }

  publish(): void {
    this.form.status = 'active';
    this.save();
  }
}
