import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Media } from '../../core/models/interfaces';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-media',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './media.html',
  styleUrl: './media.scss',
})
export class MediaComponent implements OnInit {
  mediaList = signal<Media[]>([]);
  loading = signal(true);
  uploading = signal(false);
  filterType = '';
  apiBase = environment.apiUrl.replace('/api', '');

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadMedia();
  }

  loadMedia(): void {
    this.loading.set(true);
    this.api.getMediaList(this.filterType || undefined).subscribe({
      next: (list) => { this.mediaList.set(list); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    this.uploading.set(true);
    this.api.uploadMedia(file).subscribe({
      next: () => { this.uploading.set(false); this.loadMedia(); },
      error: () => this.uploading.set(false),
    });
    input.value = '';
  }

  deleteMedia(id: string): void {
    if (confirm('Delete this file?')) {
      this.api.deleteMedia(id).subscribe(() => this.loadMedia());
    }
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
}
