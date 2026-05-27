import { Component, OnInit, OnDestroy, signal, computed, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import DOMPurify from 'dompurify';
import { ApiService } from '../../core/services/api.service';
import { SocketService } from '../../core/services/socket.service';
import { Notice, BoardDisplayResponse, Board, BoardPage, BoardWidget, DisplayBranding, DataSourceLite } from '../../core/models/interfaces';

interface TemplateBlob { _id: string; name: string; html: string; css: string; fields?: any[]; }

const DEFAULT_BRANDING: DisplayBranding = {
  logo: '',
  primaryColor: '#3B82F6',
  secondaryColor: '#1E40AF',
  accentColor: '#F59E0B',
  fontFamily: 'Inter',
  darkMode: true,
  brandStyle: 'logo+text',
  displayScreens: {
    showLogo: true,
    loadingTitle: 'Loading board…',
    loadingSubtitle: 'Please wait a moment',
    unavailableTitle: 'Board not available',
    unavailableSubtitle: 'Please check the board URL or contact your administrator.',
    emptyTitle: 'No notices yet',
    emptySubtitle: 'Notices will appear here once published.',
  },
};

const BRANDING_CACHE_KEY = (boardId: string) => `nb_display_branding_${boardId}`;

@Component({
  selector: 'app-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './display.html',
  styleUrl: './display.scss',
})
export class DisplayComponent implements OnInit, OnDestroy {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  boardId = '';
  board = signal<Partial<Board> | null>(null);
  notices = signal<Notice[]>([]);
  templates = signal<Record<string, TemplateBlob>>({});
  widgetNotices = signal<Record<string, Notice>>({});
  dataSources = signal<Record<string, DataSourceLite>>({});
  loading = signal(true);
  error = signal('');
  branding = signal<DisplayBranding>(DEFAULT_BRANDING);
  msgs = computed(() => this.branding().displayScreens);
  brandStyle = computed(() => this.branding().brandStyle || 'logo+text');

  // Carousel state (for notices)
  currentIndex = signal(0);
  isPaused = signal(false);

  // Page carousel state
  currentPageIndex = signal(0);
  hasPages = computed(() => {
    const b = this.board();
    return (b?.pages && b.pages.length > 0 && b.pages.some(p => p.widgets.length > 0)) || false;
  });
  currentPage = computed<BoardPage | null>(() => {
    const b = this.board();
    const idx = this.currentPageIndex();
    if (b?.pages && b.pages.length > 0) {
      return idx < b.pages.length ? b.pages[idx] : null;
    }
    return null;
  });

  // Clock
  currentTime = signal('');
  currentDate = signal('');

  private carouselTimer: any;
  private pageCarouselTimer: any;
  private clockTimer: any;
  private refreshTimer: any;
  private scrollAnimFrame: any;
  private scrollPos = 0;

  // Signatures used to detect config changes so we don't restart timers
  // every 30s refresh (which made 10s intervals drift to 30s+).
  private carouselSig = '';
  private pageCarouselSig = '';
  private autoScrollSig = '';

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private socket: SocketService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.boardId = this.route.snapshot.params['boardId'];
    this.restoreCachedBranding();
    this.loadBoardData();
    this.startClock();

    // Refresh data every 30 seconds
    this.refreshTimer = setInterval(() => this.loadBoardData(), 30000);

    // Live updates via socket
    this.socket.connect(this.boardId);
    this.socket.onBoardUpdate(() => this.loadBoardData());

    // Fullscreen on double-click
    document.addEventListener('dblclick', this.toggleFullscreen);
  }

  private restoreCachedBranding(): void {
    try {
      const raw = localStorage.getItem(BRANDING_CACHE_KEY(this.boardId));
      if (raw) {
        const cached = JSON.parse(raw) as DisplayBranding;
        this.applyBranding(cached);
      }
    } catch {}
  }

  private applyBranding(b: DisplayBranding | undefined | null): void {
    if (!b) return;
    const merged: DisplayBranding = {
      ...DEFAULT_BRANDING,
      ...b,
      displayScreens: { ...DEFAULT_BRANDING.displayScreens, ...(b.displayScreens || {} as any) },
    };
    this.branding.set(merged);
    this.injectCustomFonts(merged.customFonts || []);
    try {
      localStorage.setItem(BRANDING_CACHE_KEY(this.boardId), JSON.stringify(merged));
    } catch {}
  }

  private injectCustomFonts(fonts: { family: string; url: string }[]): void {
    document.querySelectorAll('link[data-nb-font],style[data-nb-font]').forEach((n) => n.remove());
    for (const f of fonts) {
      if (!f.url) continue;
      if (/^https?:\/\/.*\.css/i.test(f.url) || f.url.includes('fonts.googleapis.com')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = f.url;
        link.setAttribute('data-nb-font', f.family);
        document.head.appendChild(link);
      } else {
        const style = document.createElement('style');
        style.setAttribute('data-nb-font', f.family);
        style.textContent = `@font-face { font-family: '${f.family}'; src: url('${f.url}'); font-display: swap; }`;
        document.head.appendChild(style);
      }
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.carouselTimer);
    clearInterval(this.pageCarouselTimer);
    clearInterval(this.clockTimer);
    clearInterval(this.refreshTimer);
    cancelAnimationFrame(this.scrollAnimFrame);
    this.socket.disconnect();
    document.removeEventListener('dblclick', this.toggleFullscreen);
  }

  loadBoardData(): void {
    this.api.getBoardDisplay(this.boardId).subscribe({
      next: (res) => {
        if (res.branding) this.applyBranding(res.branding);
        this.board.set(res.board);
        this.notices.set(res.notices);
        this.templates.set(res.templates || {});
        this.widgetNotices.set(res.widgetNotices || {});
        this.dataSources.set(res.dataSources || {});
        this.error.set('');
        this.loading.set(false);
        this.startCarousel();
        this.startAutoScroll();
        this.startPageCarousel();
      },
      error: (err) => {
        const fallback = err?.error?.branding as DisplayBranding | undefined;
        if (fallback) this.applyBranding(fallback);
        this.error.set(this.branding().displayScreens.unavailableTitle);
        this.loading.set(false);
      },
    });
  }

  /**
   * Outer board wrapper styles — just the fallback colour. The actual
   * background (image / gradient / video) renders on a separate layer
   * below so the opacity slider only affects the background, never the
   * widgets/content on top.
   */
  boardBgStyles(): Record<string, string> {
    const t = this.board()?.theme;
    return { 'background-color': t?.bgColor || '#0F172A' };
  }

  /** Visual background layer (image or gradient) — image and gradient
   *  branches; video gets its own <video> element. */
  bgLayerStyles(): Record<string, string> {
    const t = this.board()?.theme;
    if (!t) return { display: 'none' };
    const opacity = String((t.bgOpacity ?? 100) / 100);
    if (t.bgType === 'image' && t.bgImage) {
      return {
        'background-image': `url("${t.bgImage}")`,
        'background-size': t.bgFit || 'cover',
        'background-position': 'center',
        'background-repeat': 'no-repeat',
        opacity,
      };
    }
    if (t.bgType === 'gradient') {
      return {
        background: t.bgGradient || `linear-gradient(135deg, ${t.bgColor || '#0F172A'} 0%, #1E40AF 100%)`,
        opacity,
      };
    }
    return { display: 'none' };
  }

  bgVideoStyles(): Record<string, string> {
    const t = this.board()?.theme;
    return { opacity: String((t?.bgOpacity ?? 100) / 100) };
  }

  // ===== SECTION WIDGET =====
  sectionJustify(align: string | undefined): string {
    if (align === 'center') return 'center';
    if (align === 'right')  return 'flex-end';
    return 'flex-start';
  }

  resolveSectionTextColor(widget: BoardWidget): string | null {
    const c = widget.config?.sectionTextColor;
    if (c) return c;
    // If a category is linked, use its colour; otherwise default text colour.
    const catId = widget.config?.sectionCategoryId;
    if (catId) {
      // The kiosk doesn't have the full Category list; tenant's primary
      // colour is the next-best default.
      return this.branding().primaryColor || null;
    }
    return null;
  }

  resolveSectionBgColor(widget: BoardWidget): string | null {
    const c = widget.config?.sectionBgColor;
    if (c) return c;
    if ((widget.config?.sectionStyle || 'filled') !== 'filled') return null;
    const catId = widget.config?.sectionCategoryId;
    if (catId) {
      const primary = this.branding().primaryColor || '#3B82F6';
      return primary + '22'; // ~13% alpha
    }
    return null;
  }

  brandStyles(): Record<string, string> {
    const b = this.branding();
    return {
      '--brand-primary': b.primaryColor,
      '--brand-secondary': b.secondaryColor,
      '--brand-accent': b.accentColor,
      '--brand-font': b.fontFamily ? `${b.fontFamily}, system-ui, sans-serif` : 'system-ui, sans-serif',
      'background': b.darkMode
        ? `linear-gradient(135deg, #0F172A 0%, ${b.secondaryColor}22 100%)`
        : `linear-gradient(135deg, #ffffff 0%, ${b.primaryColor}11 100%)`,
      'color': b.darkMode ? '#f1f5f9' : '#0F172A',
      'font-family': b.fontFamily ? `${b.fontFamily}, system-ui, sans-serif` : 'system-ui, sans-serif',
    };
  }

  // ===== PAGE CAROUSEL =====
  startPageCarousel(): void {
    const b = this.board();
    const pagesLen = b?.pages?.length || 0;
    const interval = (b?.carousel?.interval || 10) * 1000;
    const autoPlay = b?.carousel?.autoPlay !== false;
    const sig = `${pagesLen}|${interval}|${autoPlay}`;

    // Already running with the same config — don't reset the timer
    // (this is what was causing 10s intervals to drift on every 30s refresh).
    if (sig === this.pageCarouselSig && this.pageCarouselTimer) return;

    clearInterval(this.pageCarouselTimer);
    this.pageCarouselSig = sig;
    if (pagesLen <= 1 || !autoPlay) return;

    this.pageCarouselTimer = setInterval(() => {
      if (!this.isPaused()) this.nextPage();
    }, interval);
  }

  nextPage(): void {
    const b = this.board();
    if (!b?.pages || b.pages.length === 0) return;
    this.currentPageIndex.update(i => (i + 1) % b.pages!.length);
  }

  prevPage(): void {
    const b = this.board();
    if (!b?.pages || b.pages.length === 0) return;
    this.currentPageIndex.update(i => (i - 1 + b.pages!.length) % b.pages!.length);
  }

  goToPage(index: number): void {
    this.currentPageIndex.set(index);
  }

  // ===== NOTICE CAROUSEL =====
  startCarousel(): void {
    const b = this.board();
    const interval = (b?.carousel?.interval || 8) * 1000;
    const enabled = !!b?.carousel?.autoPlay && b?.displayMode === 'carousel';
    const sig = `${interval}|${enabled}|${this.notices().length}`;

    if (sig === this.carouselSig && this.carouselTimer) return;

    clearInterval(this.carouselTimer);
    this.carouselSig = sig;
    if (!enabled) return;

    this.carouselTimer = setInterval(() => {
      if (!this.isPaused()) this.nextSlide();
    }, interval);
  }

  nextSlide(): void {
    const total = this.notices().length;
    if (total === 0) return;
    this.currentIndex.update(i => (i + 1) % total);
  }

  prevSlide(): void {
    const total = this.notices().length;
    if (total === 0) return;
    this.currentIndex.update(i => (i - 1 + total) % total);
  }

  goToSlide(index: number): void {
    this.currentIndex.set(index);
  }

  onMouseEnter(): void {
    if (this.board()?.carousel?.pauseOnHover) this.isPaused.set(true);
  }

  onMouseLeave(): void {
    this.isPaused.set(false);
  }

  // ===== AUTO SCROLL =====
  startAutoScroll(): void {
    const b = this.board();
    const enabled = !!b?.autoScroll?.enabled && b?.displayMode === 'list';
    const speed = (b?.autoScroll?.speed || 30) / 60;
    const sig = `${enabled}|${speed}`;

    if (sig === this.autoScrollSig && this.scrollAnimFrame) return;

    cancelAnimationFrame(this.scrollAnimFrame);
    this.autoScrollSig = sig;
    if (!enabled) return;

    const animate = () => {
      if (!this.isPaused() && this.scrollContainer?.nativeElement) {
        const el = this.scrollContainer.nativeElement;
        this.scrollPos += speed;
        if (this.scrollPos >= el.scrollHeight - el.clientHeight) {
          this.scrollPos = 0;
        }
        el.scrollTop = this.scrollPos;
      }
      this.scrollAnimFrame = requestAnimationFrame(animate);
    };
    this.scrollAnimFrame = requestAnimationFrame(animate);
  }

  // ===== CLOCK =====
  startClock(): void {
    const update = () => {
      const now = new Date();
      this.currentTime.set(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      this.currentDate.set(now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    update();
    this.clockTimer = setInterval(update, 1000);
  }

  // ===== FULLSCREEN =====
  toggleFullscreen = (): void => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // ===== GRID HELPERS =====
  getGridStyles(): Record<string, string> {
    const layout = this.board()?.layout;
    return {
      'grid-template-columns': `repeat(${layout?.columns || 3}, 1fr)`,
      'grid-template-rows': `repeat(${layout?.rows || 2}, 1fr)`,
      'gap': `${layout?.gap || 16}px`,
    };
  }

  getNoticeCardStyles(notice: Notice): Record<string, string> {
    const styles: Record<string, string> = {};
    if (notice.displayConfig?.bgColor) styles['background-color'] = notice.displayConfig.bgColor;
    if (notice.displayConfig?.textColor) styles['color'] = notice.displayConfig.textColor;
    if (notice.displayConfig?.gridSpan?.cols > 1) styles['grid-column'] = `span ${notice.displayConfig.gridSpan.cols}`;
    if (notice.displayConfig?.gridSpan?.rows > 1) styles['grid-row'] = `span ${notice.displayConfig.gridSpan.rows}`;
    return styles;
  }

  getTransitionClass(): string {
    return `transition-${this.board()?.carousel?.transition || 'slide'}`;
  }

  getPagesTransitionClass(): string {
    return `pages-${this.board()?.carousel?.transition || 'slide'}`;
  }

  pageSlideClass(i: number): Record<string, boolean> {
    const total = this.board()?.pages?.length || 0;
    const cur = this.currentPageIndex();
    const isActive = i === cur;
    const isPrev = total > 1 && i === (cur - 1 + total) % total;
    const isNext = total > 1 && i === (cur + 1) % total;
    return {
      'page-slide': true,
      'active': isActive,
      'prev': isPrev && !isActive,
      'next': isNext && !isActive,
    };
  }

  getPriorityColor(p: number): string {
    return ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#94a3b8'][p] || '#3b82f6';
  }

  // ===== WIDGET HELPERS =====
  getWidgetGridStyles(widget: BoardWidget): Record<string, string> {
    return {
      'grid-column': `${widget.gridCol} / span ${widget.colSpan}`,
      'grid-row': `${widget.gridRow} / span ${widget.rowSpan}`,
      'background-color': widget.style?.bgColor || 'rgba(255, 255, 255, 0.05)',
      'color': widget.style?.textColor || '#f1f5f9',
      'border-radius': `${widget.style?.borderRadius || 16}px`,
      'padding': `${widget.style?.padding || 24}px`,
    };
  }

  getPageGridStyles(): Record<string, string> {
    const layout = this.board()?.layout;
    return {
      'grid-template-columns': `repeat(${layout?.columns || 4}, 1fr)`,
      'grid-template-rows': `repeat(${layout?.rows || 3}, 1fr)`,
      'gap': `${layout?.gap || 16}px`,
    };
  }

  // ===== DATA SOURCE BINDING =====
  private resolvePath(value: any, path: string): any {
    if (!path) return value;
    let cur = value;
    for (const part of path.split('.').map((p) => p.trim()).filter(Boolean)) {
      if (cur == null) return cur;
      cur = cur[part];
    }
    return cur;
  }

  private getBoundArray(widget: BoardWidget): any[] {
    const dsId = widget.config?.dataSourceId;
    if (!dsId) return [];
    const ds = this.dataSources()[dsId];
    if (!ds) return [];
    const path = widget.config?.dataSourcePath || ds.dataPath || '';
    const drilled = this.resolvePath(ds.data, path);
    let arr: any[] = [];
    if (Array.isArray(drilled)) arr = drilled;
    else if (drilled && typeof drilled === 'object') arr = [drilled];
    const limit = widget.config?.dataSourceRowLimit || 0;
    return limit > 0 ? arr.slice(0, limit) : arr;
  }

  isBoundTable(widget: BoardWidget): boolean {
    return widget.type === 'table'
      && !!widget.config?.dataSourceId
      && !!this.dataSources()[widget.config!.dataSourceId!];
  }

  isBoundChart(widget: BoardWidget): boolean {
    return widget.type === 'chart'
      && !!widget.config?.dataSourceId
      && !!this.dataSources()[widget.config!.dataSourceId!];
  }

  getBoundTableHeaders(widget: BoardWidget): string[] {
    const cols = widget.config?.dataSourceColumns || [];
    if (cols.length > 0) return cols.map((c) => c.label || c.key);
    // Fallback: keys from first row
    const arr = this.getBoundArray(widget);
    if (arr.length > 0 && typeof arr[0] === 'object' && arr[0] != null) {
      return Object.keys(arr[0]).slice(0, 8);
    }
    return [];
  }

  getBoundTableRows(widget: BoardWidget): string[][] {
    const arr = this.getBoundArray(widget);
    const cols = widget.config?.dataSourceColumns || [];
    if (arr.length === 0) return [];
    const keys = cols.length > 0
      ? cols.map((c) => c.key)
      : (typeof arr[0] === 'object' && arr[0] != null ? Object.keys(arr[0]).slice(0, 8) : []);
    return arr.map((row) => keys.map((k) => {
      const v = this.resolvePath(row, k);
      if (v == null) return '';
      if (typeof v === 'object') return JSON.stringify(v);
      return String(v);
    }));
  }

  getBoundChartLabels(widget: BoardWidget): string[] {
    const arr = this.getBoundArray(widget);
    const key = widget.config?.dataSourceLabelKey;
    if (!key) return arr.map((_, i) => String(i + 1));
    return arr.map((r) => {
      const v = this.resolvePath(r, key);
      return v == null ? '' : String(v);
    });
  }

  getBoundChartValues(widget: BoardWidget): number[] {
    const arr = this.getBoundArray(widget);
    const key = widget.config?.dataSourceValueKey;
    if (!key) return [];
    return arr.map((r) => {
      const v = this.resolvePath(r, key);
      const n = typeof v === 'number' ? v : parseFloat(String(v));
      return Number.isFinite(n) ? n : 0;
    });
  }

  // ===== TEMPLATE RENDERING =====
  /** HTML-escape so user data can't break out into markup. */
  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private substituteFields(html: string, data: Record<string, string> | undefined): string {
    if (!html) return '';
    if (!data) return html;
    return html.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_match, key) => {
      // Block prototype-chain access; escape value so a field containing
      // `<script>` can never inject script into the rendered template.
      if (['__proto__', 'prototype', 'constructor'].includes(key)) return '';
      const v = (data as any)[key];
      return v === undefined || v === null ? '' : this.escapeHtml(String(v));
    });
  }

  renderTemplateHtml(widget: BoardWidget): SafeHtml | null {
    const tplId = widget.config?.templateId;
    if (!tplId) return null;
    const tpl = this.templates()[tplId];
    if (!tpl) return null;
    const body = this.substituteFields(tpl.html, widget.config?.templateData);
    // Sanitize template HTML even though admins author it — any single
    // malicious admin shouldn't be able to XSS every kiosk on the network.
    // Allow a tame whitelist of layout/typography tags. Drop <script>, event
    // handlers, javascript: URLs, dangerous CSS. CSS from the template is
    // wrapped in a sanitized <style> separately via a CSS allowlist below.
    const cleanBody = DOMPurify.sanitize(body, {
      USE_PROFILES: { html: true },
      // Belt-and-braces: explicitly drop scriptable elements/attributes.
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'link', 'meta', 'base'],
      FORBID_ATTR: ['style', 'srcset', 'formaction', 'xlink:href'],
    });
    const safeCss = tpl.css ? this.sanitizeCss(tpl.css) : '';
    const scopedCss = safeCss ? `<style data-tpl="${tplId}">${safeCss}</style>` : '';
    return this.sanitizer.bypassSecurityTrustHtml(scopedCss + cleanBody);
  }

  /**
   * Tiny CSS sanitizer — strips @import, javascript: / expression() / behavior:
   * style values. Template CSS is admin-authored, but the kiosk is public, so
   * defense-in-depth applies.
   */
  private sanitizeCss(css: string): string {
    return css
      .replace(/@import[^;]*;?/gi, '')
      .replace(/expression\s*\(/gi, '')
      .replace(/behaviou?r\s*:/gi, '')
      .replace(/javascript\s*:/gi, '')
      .replace(/vbscript\s*:/gi, '')
      .replace(/<\/?style[^>]*>/gi, '');
  }

  getNoticeForWidget(widget: BoardWidget): Notice | null {
    const id = widget.config?.noticeId;
    if (!id) return null;
    return this.widgetNotices()[id] || null;
  }

  // ===== IMAGE STYLE =====
  private imageAlignToValues(pos: string | undefined): { justify: string; align: string; objectPos: string } {
    switch (pos) {
      case 'top':    return { justify: 'center',     align: 'flex-start', objectPos: 'center top' };
      case 'bottom': return { justify: 'center',     align: 'flex-end',   objectPos: 'center bottom' };
      case 'left':   return { justify: 'flex-start', align: 'center',     objectPos: 'left center' };
      case 'right':  return { justify: 'flex-end',   align: 'center',     objectPos: 'right center' };
      default:       return { justify: 'center',     align: 'center',     objectPos: 'center center' };
    }
  }

  getImageWrapStyle(widget: BoardWidget): Record<string, string> {
    const cfg = widget?.config || ({} as any);
    const pad = widget?.style?.padding ?? 0;
    const radius = widget?.style?.borderRadius ?? 0;
    const align = this.imageAlignToValues(cfg.imagePosition);
    const styles: Record<string, string> = {
      'display': 'flex',
      'width': '100%',
      'height': '100%',
      'justify-content': align.justify,
      'align-items': align.align,
      'background': cfg.imageBgColor || 'transparent',
      'overflow': 'hidden',
    };
    if (cfg.imageEdgeToEdge) {
      styles['margin'] = `-${pad}px`;
      styles['width'] = `calc(100% + ${pad * 2}px)`;
      styles['height'] = `calc(100% + ${pad * 2}px)`;
      styles['border-radius'] = `${radius}px`;
    }
    return styles;
  }

  getImageStyle(widget: BoardWidget): Record<string, string> {
    const cfg = widget?.config || ({} as any);
    const fit = cfg.imageFit || 'cover';
    const w = Math.max(10, Math.min(100, cfg.imageWidthPct ?? 100));
    const h = Math.max(10, Math.min(100, cfg.imageHeightPct ?? 100));
    const align = this.imageAlignToValues(cfg.imagePosition);
    const styles: Record<string, string> = {
      'width': `${w}%`,
      'height': `${h}%`,
      'object-fit': fit,
      'object-position': align.objectPos,
      'display': 'block',
    };
    if (fit === 'none') {
      styles['width'] = 'auto';
      styles['height'] = 'auto';
      styles['max-width'] = `${w}%`;
      styles['max-height'] = `${h}%`;
    }
    return styles;
  }

  // ===== TABLE TOTALS =====
  private parseNumeric(v: string | undefined | null): number {
    if (v === undefined || v === null) return 0;
    const n = parseFloat(String(v).replace(/[, ]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }

  private formatTotal(n: number): string {
    return Number.isInteger(n) ? String(n) : n.toFixed(2);
  }

  rowTotal(row: string[]): string {
    return this.formatTotal((row || []).reduce((acc, c) => acc + this.parseNumeric(c), 0));
  }

  columnTotal(widget: BoardWidget, colIndex: number): string {
    const rows = widget.config?.tableRows || [];
    const sum = rows.reduce((acc: number, r: string[]) => acc + this.parseNumeric(r[colIndex]), 0);
    return this.formatTotal(sum);
  }

  grandTotal(widget: BoardWidget): string {
    const rows = widget.config?.tableRows || [];
    const sum = rows.reduce((acc: number, r: string[]) =>
      acc + (r || []).reduce((rAcc: number, c: string) => rAcc + this.parseNumeric(c), 0), 0);
    return this.formatTotal(sum);
  }

  columnTotalFromRows(rows: string[][], colIndex: number): string {
    const sum = (rows || []).reduce((acc: number, r: string[]) => acc + this.parseNumeric(r?.[colIndex]), 0);
    return this.formatTotal(sum);
  }

  grandTotalFromRows(rows: string[][]): string {
    const sum = (rows || []).reduce((acc: number, r: string[]) =>
      acc + (r || []).reduce((rAcc: number, c: string) => rAcc + this.parseNumeric(c), 0), 0);
    return this.formatTotal(sum);
  }

  maxChartValue(widget: BoardWidget): number {
    const values = widget.config?.chartData?.values || [];
    return values.length > 0 ? Math.max(...values) : 1;
  }

  chartMax_(values: number[]): number {
    return values && values.length > 0 ? Math.max(...values) : 1;
  }

  getPieSlicesFromValues(widget: BoardWidget, values: number[]): { color: string; dashArray: string; offset: number }[] {
    if (!values?.length) return [];
    const total = values.reduce((a, b) => a + b, 0);
    if (total === 0) return [];

    const radius = widget.config?.chartType === 'doughnut' ? 30 : 40;
    const circumference = 2 * Math.PI * radius;
    const colors = widget.config?.chartData?.colors || [];
    const slices: { color: string; dashArray: string; offset: number }[] = [];
    let cumOffset = 0;

    values.forEach((val, i) => {
      const pct = val / total;
      const dash = pct * circumference;
      slices.push({
        color: colors[i] || ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'][i % 6],
        dashArray: `${dash} ${circumference - dash}`,
        offset: -cumOffset,
      });
      cumOffset += dash;
    });
    return slices;
  }

  getPieSlices(widget: BoardWidget): { color: string; dashArray: string; offset: number }[] {
    const data = widget.config?.chartData;
    if (!data?.values?.length) return [];
    const total = data.values.reduce((a: number, b: number) => a + b, 0);
    if (total === 0) return [];

    const radius = widget.config.chartType === 'doughnut' ? 30 : 40;
    const circumference = 2 * Math.PI * radius;
    const slices: { color: string; dashArray: string; offset: number }[] = [];
    let cumOffset = 0;

    data.values.forEach((val: number, i: number) => {
      const pct = val / total;
      const dash = pct * circumference;
      slices.push({
        color: (data.colors || [])[i] || '#3b82f6',
        dashArray: `${dash} ${circumference - dash}`,
        offset: -cumOffset,
      });
      cumOffset += dash;
    });
    return slices;
  }
}
