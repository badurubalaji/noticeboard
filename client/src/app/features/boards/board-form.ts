import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Board, Category } from '../../core/models/interfaces';

@Component({
  selector: 'app-board-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './board-form.html',
  styleUrl: './board-form.scss',
})
export class BoardFormComponent implements OnInit {
  isEdit = false;
  boardId = '';
  loading = signal(false);
  saving = signal(false);
  categories = signal<Category[]>([]);

  form: Partial<Board> = {
    name: '',
    description: '',
    displayMode: 'carousel',
    layout: { columns: 3, rows: 2, gap: 16 },
    carousel: { autoPlay: true, interval: 8, transition: 'slide', pauseOnHover: true, showIndicators: true, showNavigation: false },
    autoScroll: { enabled: false, speed: 30, direction: 'up', pauseOnHover: true },
    filters: { categories: [], priorities: [], tags: [], statuses: [] },
    theme: {
      bgColor: '#0F172A', bgImage: '', bgGradient: '', headerVisible: true, headerText: '',
      clockVisible: true, dateVisible: true, logoVisible: true, fontFamily: '', fontSize: 'medium',
    },
  };

  constructor(private api: ApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.api.getCategories().subscribe(cats => this.categories.set(cats));
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEdit = true;
      this.boardId = id;
      this.loading.set(true);
      this.api.getBoard(id).subscribe({
        next: (board) => { this.form = { ...board }; this.loading.set(false); },
        error: () => { this.loading.set(false); this.router.navigate(['/boards']); },
      });
    }
  }

  save(): void {
    if (!this.form.name) return;
    this.saving.set(true);
    const obs = this.isEdit
      ? this.api.updateBoard(this.boardId, this.form)
      : this.api.createBoard(this.form);

    obs.subscribe({
      next: () => { this.saving.set(false); this.router.navigate(['/boards']); },
      error: () => this.saving.set(false),
    });
  }
}
