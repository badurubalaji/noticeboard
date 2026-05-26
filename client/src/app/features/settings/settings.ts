import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Tenant, User, DisplayScreens, DataSource, DataSourceTestResult } from '../../core/models/interfaces';

interface CustomFont {
  family: string;
  url: string; // Google Fonts CSS URL or uploaded font file URL
}

type ExtendedBranding = Tenant['branding'] & {
  customFonts?: CustomFont[];
};

const DEFAULT_DISPLAY_SCREENS: DisplayScreens = {
  showLogo: true,
  loadingTitle: 'Loading board…',
  loadingSubtitle: 'Please wait a moment',
  unavailableTitle: 'Board not available',
  unavailableSubtitle: 'Please check the board URL or contact your administrator.',
  emptyTitle: 'No notices yet',
  emptySubtitle: 'Notices will appear here once published.',
};

const BUILTIN_FONTS = ['Inter', 'Roboto', 'Outfit', 'Poppins', 'Open Sans', 'Montserrat', 'Lato', 'Nunito'];

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class SettingsComponent implements OnInit {
  saving = signal(false);
  uploadingLogo = signal(false);
  users = signal<User[]>([]);
  activeTab: 'branding' | 'display' | 'fonts' | 'datasources' | 'users' = 'branding';
  showInviteModal = false;
  previewMode: 'loading' | 'unavailable' | 'empty' = 'loading';

  // Data sources
  dataSources = signal<DataSource[]>([]);
  showDsModal = false;
  editingDs: Partial<DataSource> = this.emptyDataSource();
  dsTestResult = signal<DataSourceTestResult | null>(null);
  dsTesting = signal(false);
  dsSaving = signal(false);
  dsHeaderKey = '';
  dsHeaderVal = '';
  // JSON-mode helpers
  dsJsonText = '';
  dsJsonError = signal('');
  dsJsonFilename = signal('');
  dsJsonUploading = signal(false);

  branding: ExtendedBranding = {
    logo: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    accentColor: '#F59E0B',
    fontFamily: 'Inter',
    darkMode: false,
    customCSS: '',
    displayScreens: { ...DEFAULT_DISPLAY_SCREENS },
    customFonts: [],
  };

  newFont: CustomFont = { family: '', url: '' };

  builtinFonts = BUILTIN_FONTS;
  fontOptions = computed(() => [
    ...this.builtinFonts.map((f) => ({ family: f, url: '' })),
    ...(this.branding.customFonts || []),
  ]);

  invite = { name: '', email: '', role: 'editor', password: '' };

  constructor(public auth: AuthService, private api: ApiService) {}

  ngOnInit(): void {
    const tenant = this.auth.tenant();
    if (tenant) {
      this.branding = {
        ...this.branding,
        ...tenant.branding,
        displayScreens: {
          ...DEFAULT_DISPLAY_SCREENS,
          ...(tenant.branding.displayScreens || ({} as any)),
        },
        customFonts: ((tenant.branding as any).customFonts as CustomFont[]) || [],
      };
    }
    this.applyCustomFonts();
    this.api.getUsers().subscribe({ next: (u) => this.users.set(u), error: () => {} });
    this.loadDataSources();
  }

  // ===== Branding save =====
  saveBranding(): void {
    this.saving.set(true);
    this.api.updateTenant({ branding: this.branding as any }).subscribe({
      next: (t) => { this.auth.updateTenant(t); this.saving.set(false); },
      error: () => this.saving.set(false),
    });
  }

  // ===== Logo upload =====
  onLogoSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploadingLogo.set(true);
    this.api.uploadMedia(file).subscribe({
      next: (m) => {
        this.branding.logo = m.url;
        this.uploadingLogo.set(false);
      },
      error: () => this.uploadingLogo.set(false),
    });
  }

  clearLogo(): void {
    this.branding.logo = '';
  }

  // ===== Custom fonts =====
  addCustomFont(): void {
    const family = this.newFont.family.trim();
    const url = this.newFont.url.trim();
    if (!family || !url) return;
    if (!this.branding.customFonts) this.branding.customFonts = [];
    if (this.branding.customFonts.some((f) => f.family === family)) return;
    this.branding.customFonts.push({ family, url });
    this.newFont = { family: '', url: '' };
    this.applyCustomFonts();
  }

  removeCustomFont(family: string): void {
    this.branding.customFonts = (this.branding.customFonts || []).filter((f) => f.family !== family);
    if (this.branding.fontFamily === family) this.branding.fontFamily = 'Inter';
  }

  applyCustomFonts(): void {
    // Inject <link>/<style> tags for live preview
    document.querySelectorAll('link[data-nb-font],style[data-nb-font]').forEach((n) => n.remove());
    for (const f of this.branding.customFonts || []) {
      if (!f.url) continue;
      if (/^https?:\/\/.*\.css/i.test(f.url) || f.url.includes('fonts.googleapis.com')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = f.url;
        link.setAttribute('data-nb-font', f.family);
        document.head.appendChild(link);
      } else {
        // Treat as a font file URL (woff2/ttf)
        const style = document.createElement('style');
        style.setAttribute('data-nb-font', f.family);
        style.textContent = `@font-face { font-family: '${f.family}'; src: url('${f.url}'); font-display: swap; }`;
        document.head.appendChild(style);
      }
    }
  }

  // ===== Preview helpers =====
  previewLogoLetter(): string {
    return (this.auth.tenant()?.name || 'N').charAt(0).toUpperCase();
  }

  previewStyles(): Record<string, string> {
    const b = this.branding;
    return {
      '--brand-primary': b.primaryColor,
      'background': b.darkMode
        ? `linear-gradient(135deg, #0F172A 0%, ${b.secondaryColor}33 100%)`
        : `linear-gradient(135deg, #ffffff 0%, ${b.primaryColor}11 100%)`,
      'color': b.darkMode ? '#f1f5f9' : '#0F172A',
      'font-family': `${b.fontFamily}, system-ui, sans-serif`,
    };
  }

  resetDisplayMessages(): void {
    this.branding.displayScreens = { ...DEFAULT_DISPLAY_SCREENS };
  }

  // ===== Users =====
  inviteUser(): void {
    this.api.inviteUser(this.invite).subscribe({
      next: () => {
        this.showInviteModal = false;
        this.invite = { name: '', email: '', role: 'editor', password: '' };
        this.api.getUsers().subscribe(u => this.users.set(u));
      },
    });
  }

  updateUserRole(userId: string, role: string): void {
    this.api.updateUser(userId, { role } as any).subscribe(() => {
      this.api.getUsers().subscribe(u => this.users.set(u));
    });
  }

  // ===== Data Sources =====
  emptyDataSource(): Partial<DataSource> {
    return {
      name: '',
      description: '',
      sourceType: 'url',
      url: '',
      method: 'GET',
      headers: {},
      body: null,
      refreshInterval: 300,
      dataPath: '',
      isActive: true,
      data: null,
    };
  }

  loadDataSources(): void {
    this.api.listDataSources().subscribe({
      next: (list) => this.dataSources.set(list),
      error: () => this.dataSources.set([]),
    });
  }

  openNewDs(): void {
    this.editingDs = this.emptyDataSource();
    this.resetJsonModeState();
    this.dsTestResult.set(null);
    this.dsHeaderKey = '';
    this.dsHeaderVal = '';
    this.showDsModal = true;
  }

  openEditDs(ds: DataSource): void {
    this.editingDs = JSON.parse(JSON.stringify(ds));
    this.resetJsonModeState();
    if (ds.sourceType === 'json' && ds.data != null) {
      try { this.dsJsonText = JSON.stringify(ds.data, null, 2); } catch { this.dsJsonText = ''; }
    }
    this.dsTestResult.set(null);
    this.dsHeaderKey = '';
    this.dsHeaderVal = '';
    this.showDsModal = true;
  }

  private resetJsonModeState(): void {
    this.dsJsonText = '';
    this.dsJsonError.set('');
    this.dsJsonFilename.set('');
    this.dsJsonUploading.set(false);
  }

  setSourceType(type: 'url' | 'json'): void {
    this.editingDs.sourceType = type;
    this.dsTestResult.set(null);
    this.dsJsonError.set('');
  }

  onJsonFileSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.dsJsonUploading.set(true);
    this.dsJsonError.set('');
    this.api.uploadJsonDataSource(file).subscribe({
      next: (res) => {
        this.editingDs.data = res.data;
        this.dsJsonText = JSON.stringify(res.data, null, 2);
        this.dsJsonFilename.set(res.filename);
        this.dsJsonUploading.set(false);
        input.value = '';
      },
      error: (err) => {
        this.dsJsonError.set(err?.error?.error || 'Could not read JSON file');
        this.dsJsonUploading.set(false);
        input.value = '';
      },
    });
  }

  parseJsonPaste(): void {
    this.dsJsonError.set('');
    const text = (this.dsJsonText || '').trim();
    if (!text) {
      this.editingDs.data = null;
      return;
    }
    try {
      this.editingDs.data = JSON.parse(text);
      this.dsJsonFilename.set('');
    } catch (e: any) {
      this.dsJsonError.set(`Invalid JSON: ${e.message}`);
    }
  }

  clearJsonData(): void {
    this.editingDs.data = null;
    this.dsJsonText = '';
    this.dsJsonError.set('');
    this.dsJsonFilename.set('');
  }

  closeDsModal(): void {
    this.showDsModal = false;
    this.editingDs = this.emptyDataSource();
  }

  headerKeys(): string[] {
    return Object.keys(this.editingDs.headers || {});
  }

  addHeader(): void {
    const k = this.dsHeaderKey.trim();
    const v = this.dsHeaderVal.trim();
    if (!k) return;
    this.editingDs.headers = { ...(this.editingDs.headers || {}), [k]: v };
    this.dsHeaderKey = '';
    this.dsHeaderVal = '';
  }

  removeHeader(key: string): void {
    if (!this.editingDs.headers) return;
    const { [key]: _, ...rest } = this.editingDs.headers as Record<string, string>;
    this.editingDs.headers = rest;
  }

  testDs(): void {
    if (!this.editingDs.url) return;
    this.dsTesting.set(true);
    this.dsTestResult.set(null);
    this.api.testDataSource(this.editingDs).subscribe({
      next: (r) => { this.dsTestResult.set(r); this.dsTesting.set(false); },
      error: (err) => {
        this.dsTestResult.set({ status: 'error', error: err?.error?.error || 'Test failed', data: null, preview: null });
        this.dsTesting.set(false);
      },
    });
  }

  canSaveDs(): boolean {
    if (!this.editingDs.name) return false;
    if (this.editingDs.sourceType === 'json') return this.editingDs.data != null;
    return !!this.editingDs.url;
  }

  saveDs(): void {
    if (!this.canSaveDs()) return;
    // For JSON sources, parse the textarea one more time so unsaved edits land
    if (this.editingDs.sourceType === 'json' && this.dsJsonText.trim()) {
      this.parseJsonPaste();
      if (this.dsJsonError()) return;
    }
    this.dsSaving.set(true);
    const obs = this.editingDs._id
      ? this.api.updateDataSource(this.editingDs._id, this.editingDs)
      : this.api.createDataSource(this.editingDs);
    obs.subscribe({
      next: () => {
        this.dsSaving.set(false);
        this.closeDsModal();
        this.loadDataSources();
      },
      error: () => this.dsSaving.set(false),
    });
  }

  deleteDs(ds: DataSource): void {
    if (!confirm(`Delete data source "${ds.name}"? Widgets using it will fall back to their static config.`)) return;
    this.api.deleteDataSource(ds._id).subscribe(() => this.loadDataSources());
  }

  refreshDs(ds: DataSource): void {
    this.api.refreshDataSource(ds._id).subscribe({
      next: (updated) => {
        this.dataSources.update((list) => list.map((s) => s._id === updated._id ? updated : s));
      },
    });
  }

  previewJson(value: any): string {
    try {
      return JSON.stringify(value, null, 2).slice(0, 1200);
    } catch {
      return String(value);
    }
  }

  formatRelativeTime(iso: string | null | undefined): string {
    if (!iso) return 'never';
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60_000) return `${Math.round(diff / 1000)}s ago`;
    if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
    return `${Math.round(diff / 86_400_000)}d ago`;
  }
}
