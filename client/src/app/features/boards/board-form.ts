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
      bgType: 'color',
      bgColor: '#0F172A',
      bgImage: '',
      bgVideo: '',
      bgGradient: '',
      bgFit: 'cover',
      bgOverlay: 0,
      bgOverlayColor: '#000000',
      headerVisible: true, headerText: '',
      clockVisible: true, dateVisible: true, logoVisible: true, fontFamily: '', fontSize: 'medium',
    },
  };

  uploadingBg = signal(false);
  bgError = signal('');

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

  // ===== BACKGROUND =====
  setBgType(t: 'color' | 'image' | 'video' | 'gradient'): void {
    if (!this.form.theme) return;
    this.form.theme.bgType = t;
  }

  /** Hint when the upload is large enough to choke a kiosk. */
  bgSizeHint(bytes: number, kind: 'image' | 'video'): string {
    const mb = bytes / 1024 / 1024;
    if (kind === 'video' && mb > 20) {
      return `⚠️ ${mb.toFixed(1)} MB video — kiosks on Fire TV / older Smart TVs may stutter. Aim for ≤20 MB and ≤1080p.`;
    }
    if (kind === 'image' && mb > 5) {
      return `⚠️ ${mb.toFixed(1)} MB image — try resizing to 1920×1080 for sharper, faster loading.`;
    }
    return '';
  }

  onBgFileSelected(e: Event, kind: 'image' | 'video'): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (kind === 'image' && file.type === 'image/gif' && file.size > 10 * 1024 * 1024) {
      this.bgError.set('Big GIFs are slow on kiosks. Convert to MP4 and choose Video instead — it’ll be ~10× smaller.');
      return;
    }
    if (kind === 'video' && !file.type.startsWith('video/')) {
      this.bgError.set('Pick a video file (MP4 or WebM).');
      return;
    }
    if (kind === 'image' && !file.type.startsWith('image/')) {
      this.bgError.set('Pick an image file.');
      return;
    }

    this.uploadingBg.set(true);
    this.bgError.set('');
    this.api.uploadMedia(file).subscribe({
      next: (m) => {
        if (!this.form.theme) return;
        if (kind === 'image') {
          this.form.theme.bgImage = m.url;
          this.form.theme.bgType = 'image';
        } else {
          this.form.theme.bgVideo = m.url;
          this.form.theme.bgType = 'video';
        }
        const hint = this.bgSizeHint(file.size, kind);
        if (hint) this.bgError.set(hint);
        this.uploadingBg.set(false);
        input.value = '';
      },
      error: (err) => {
        this.bgError.set(err?.error?.error || 'Upload failed.');
        this.uploadingBg.set(false);
        input.value = '';
      },
    });
  }

  clearBgImage(): void {
    if (!this.form.theme) return;
    this.form.theme.bgImage = '';
    this.bgError.set('');
  }
  clearBgVideo(): void {
    if (!this.form.theme) return;
    this.form.theme.bgVideo = '';
    this.bgError.set('');
  }

  /** CSS for the preview tile — same logic the kiosk will use. */
  bgPreviewStyles(): Record<string, string> {
    const t = this.form.theme;
    if (!t) return {};
    const styles: Record<string, string> = { position: 'relative', overflow: 'hidden' };
    switch (t.bgType) {
      case 'image':
        styles['background-image'] = `url("${t.bgImage}")`;
        styles['background-size'] = t.bgFit || 'cover';
        styles['background-position'] = 'center';
        styles['background-repeat'] = 'no-repeat';
        styles['background-color'] = t.bgColor || '#0F172A';
        break;
      case 'gradient':
        styles['background'] = t.bgGradient || `linear-gradient(135deg, ${t.bgColor} 0%, #1E40AF 100%)`;
        break;
      case 'video':
        styles['background-color'] = t.bgColor || '#0F172A';
        break;
      case 'color':
      default:
        styles['background-color'] = t.bgColor || '#0F172A';
    }
    return styles;
  }

  bgOverlayStyles(): Record<string, string> {
    const t = this.form.theme;
    const pct = t?.bgOverlay ?? 0;
    if (!pct) return { display: 'none' };
    return {
      position: 'absolute',
      inset: '0',
      'background-color': t?.bgOverlayColor || '#000000',
      opacity: String(pct / 100),
      'pointer-events': 'none',
    };
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
