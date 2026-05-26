import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Board } from '../../core/models/interfaces';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-board-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './board-list.html',
  styleUrl: './board-list.scss',
})
export class BoardListComponent implements OnInit {
  boards = signal<Board[]>([]);
  loading = signal(true);

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadBoards();
  }

  loadBoards(): void {
    this.loading.set(true);
    this.api.getBoards().subscribe({
      next: (boards) => { this.boards.set(boards); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  getDisplayUrl(boardId: string): string {
    return `${window.location.origin}/display/${boardId}`;
  }

  copyUrl(boardId: string): void {
    navigator.clipboard.writeText(this.getDisplayUrl(boardId));
  }

  deleteBoard(id: string): void {
    if (confirm('Delete this board?')) {
      this.api.deleteBoard(id).subscribe(() => this.loadBoards());
    }
  }
}
