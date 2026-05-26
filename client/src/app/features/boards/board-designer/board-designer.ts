import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Board, BoardPage, BoardWidget, WidgetConfig, Template, Media, DataSource, Notice } from '../../../core/models/interfaces';

@Component({
  selector: 'app-board-designer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './board-designer.html',
  styleUrl: './board-designer.scss',
})
export class BoardDesignerComponent implements OnInit, OnDestroy {
  boardId = '';
  board = signal<Partial<Board> | null>(null);
  loading = signal(true);
  saving = signal(false);

  // Pages & widgets
  pages = signal<BoardPage[]>([]);
  activePageIndex = signal(0);
  selectedWidgetId = signal<string | null>(null);

  // Widget palette
  widgetTypes: { type: BoardWidget['type']; label: string; icon: string }[] = [
    { type: 'chart', label: 'Chart', icon: '📊' },
    { type: 'table', label: 'Table', icon: '📋' },
    { type: 'image', label: 'Image', icon: '🖼️' },
    { type: 'template', label: 'Template', icon: '📄' },
    { type: 'notice', label: 'Notice', icon: '📌' },
  ];

  // Grid config
  gridCols = signal(4);
  gridRows = signal(3);

  // Templates & media & data sources & notices for selectors
  templates = signal<Template[]>([]);
  mediaList = signal<Media[]>([]);
  dataSources = signal<DataSource[]>([]);
  noticesList = signal<Notice[]>([]);

  // Drag state
  dragWidgetType: BoardWidget['type'] | null = null;
  dragExistingId: string | null = null;

  // Preview mode
  previewMode = signal(false);

  // Inline image upload state
  uploadingImage = signal(false);
  uploadError = signal('');

  // Page carousel config
  pageCarouselEnabled = signal(true);
  pageCarouselInterval = signal(10);

  // Computed
  activePage = computed(() => {
    const idx = this.activePageIndex();
    const p = this.pages();
    return idx < p.length ? p[idx] : null;
  });

  selectedWidget = computed(() => {
    const page = this.activePage();
    const id = this.selectedWidgetId();
    if (!page || !id) return null;
    return page.widgets.find(w => w.id === id) || null;
  });

  constructor(private api: ApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.boardId = this.route.snapshot.params['id'];
    this.loadBoard();
    this.api.getTemplates().subscribe(t => this.templates.set(t));
    this.api.getMediaList().subscribe(m => this.mediaList.set(m));
    this.api.listDataSources().subscribe({
      next: (list) => this.dataSources.set(list),
      error: () => this.dataSources.set([]),
    });
    this.api.getNotices({ limit: '100' }).subscribe({
      next: (res) => this.noticesList.set(res.notices || []),
      error: () => this.noticesList.set([]),
    });
  }

  formatNoticeOption(n: Notice): string {
    const date = n.createdAt ? new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
    return date ? `${n.title} — ${date}` : n.title;
  }

  // ===== DATA SOURCE BINDING HELPERS =====
  getDataSource(id: string | undefined): DataSource | null {
    if (!id) return null;
    return this.dataSources().find((d) => d._id === id) || null;
  }

  /** Compute the array preview from a selected data source (after applying path). */
  resolveDataSourceArray(widget: any): any[] {
    const ds = this.getDataSource(widget?.config?.dataSourceId);
    if (!ds) return [];
    const path = widget?.config?.dataSourcePath || ds.dataPath || '';
    let cur = ds.data;
    if (path) {
      for (const part of path.split('.').map((p: string) => p.trim()).filter(Boolean)) {
        if (cur == null) return [];
        cur = cur[part];
      }
    }
    if (Array.isArray(cur)) return cur;
    if (cur && typeof cur === 'object') return [cur];
    return [];
  }

  /** First sample row keys — used to auto-suggest column mappings. */
  dataSourceSampleKeys(widget: any): string[] {
    const arr = this.resolveDataSourceArray(widget);
    if (arr.length === 0) return [];
    const sample = arr[0];
    return sample && typeof sample === 'object' ? Object.keys(sample).slice(0, 30) : [];
  }

  autoFillTableColumns(widget: any): void {
    const keys = this.dataSourceSampleKeys(widget);
    if (keys.length === 0) return;
    const cols = keys.map((k) => ({ key: k, label: k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) }));
    this.updateWidgetProp('config.dataSourceColumns', cols);
    // Also seed headers/rows preview so static fallback looks right
    this.updateWidgetProp('config.tableHeaders', cols.map((c) => c.label));
  }

  addBoundColumn(widget: any): void {
    const cols = [...((widget?.config?.dataSourceColumns) || [])];
    cols.push({ key: '', label: '' });
    this.updateWidgetProp('config.dataSourceColumns', cols);
  }

  removeBoundColumn(widget: any, i: number): void {
    const cols = [...((widget?.config?.dataSourceColumns) || [])];
    cols.splice(i, 1);
    this.updateWidgetProp('config.dataSourceColumns', cols);
  }

  updateBoundColumn(widget: any, i: number, field: 'key' | 'label', value: string): void {
    const cols = [...((widget?.config?.dataSourceColumns) || [])];
    cols[i] = { ...cols[i], [field]: value };
    this.updateWidgetProp('config.dataSourceColumns', cols);
  }

  refreshSelectedSource(widget: any): void {
    const ds = this.getDataSource(widget?.config?.dataSourceId);
    if (!ds) return;
    this.api.refreshDataSource(ds._id).subscribe({
      next: (updated) => {
        this.dataSources.update((list) => list.map((s) => s._id === updated._id ? updated : s));
      },
    });
  }

  ngOnDestroy(): void {}

  loadBoard(): void {
    this.loading.set(true);
    this.api.getBoard(this.boardId).subscribe({
      next: (board) => {
        this.board.set(board);
        this.gridCols.set(board.layout?.columns || 4);
        this.gridRows.set(board.layout?.rows || 3);

        if (board.pages && board.pages.length > 0) {
          this.pages.set(JSON.parse(JSON.stringify(board.pages)));
        } else {
          // Initialize with one empty page
          this.pages.set([{
            id: this.generateId(),
            name: 'Page 1',
            widgets: [],
            order: 0,
          }]);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/boards']);
      },
    });
  }

  // ===== PAGE MANAGEMENT =====
  addPage(): void {
    const p = this.pages();
    const newPage: BoardPage = {
      id: this.generateId(),
      name: `Page ${p.length + 1}`,
      widgets: [],
      order: p.length,
    };
    this.pages.set([...p, newPage]);
    this.activePageIndex.set(p.length);
  }

  removePage(index: number): void {
    const p = this.pages();
    if (p.length <= 1) return;
    const updated = p.filter((_, i) => i !== index);
    updated.forEach((pg, i) => pg.order = i);
    this.pages.set(updated);
    if (this.activePageIndex() >= updated.length) {
      this.activePageIndex.set(updated.length - 1);
    }
    this.selectedWidgetId.set(null);
  }

  selectPage(index: number): void {
    this.activePageIndex.set(index);
    this.selectedWidgetId.set(null);
  }

  renamePage(index: number): void {
    const p = [...this.pages()];
    const name = prompt('Page name:', p[index].name);
    if (name) {
      p[index] = { ...p[index], name };
      this.pages.set(p);
    }
  }

  // ===== DRAG & DROP FROM PALETTE =====
  onPaletteDragStart(event: DragEvent, type: BoardWidget['type']): void {
    this.dragWidgetType = type;
    this.dragExistingId = null;
    event.dataTransfer!.effectAllowed = 'copy';
    event.dataTransfer!.setData('text/plain', type);
  }

  // ===== DRAG EXISTING WIDGET =====
  onWidgetDragStart(event: DragEvent, widgetId: string): void {
    this.dragExistingId = widgetId;
    this.dragWidgetType = null;
    event.dataTransfer!.effectAllowed = 'move';
    event.dataTransfer!.setData('text/plain', widgetId);
    event.stopPropagation();
  }

  onGridCellDragOver(event: DragEvent): void {
    event.preventDefault();
    event.dataTransfer!.dropEffect = this.dragExistingId ? 'move' : 'copy';
  }

  onGridCellDrop(event: DragEvent, col: number, row: number): void {
    event.preventDefault();
    const page = this.activePage();
    if (!page) return;

    if (this.dragWidgetType) {
      // Drop new widget from palette
      const widget = this.createWidget(this.dragWidgetType, col, row);
      const updatedPages = [...this.pages()];
      const idx = this.activePageIndex();
      updatedPages[idx] = {
        ...updatedPages[idx],
        widgets: [...updatedPages[idx].widgets, widget],
      };
      this.pages.set(updatedPages);
      this.selectedWidgetId.set(widget.id);
    } else if (this.dragExistingId) {
      // Move existing widget
      const updatedPages = [...this.pages()];
      const idx = this.activePageIndex();
      const widgets = [...updatedPages[idx].widgets];
      const wIdx = widgets.findIndex(w => w.id === this.dragExistingId);
      if (wIdx >= 0) {
        widgets[wIdx] = { ...widgets[wIdx], gridCol: col, gridRow: row };
        updatedPages[idx] = { ...updatedPages[idx], widgets };
        this.pages.set(updatedPages);
      }
    }
    this.dragWidgetType = null;
    this.dragExistingId = null;
  }

  // ===== WIDGET CRUD =====
  createWidget(type: BoardWidget['type'], col: number, row: number): BoardWidget {
    const defaults: Record<string, Partial<WidgetConfig>> = {
      chart: { chartType: 'bar', chartData: { labels: ['A', 'B', 'C', 'D'], values: [30, 50, 20, 40], colors: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'] } },
      table: { tableHeaders: ['Name', 'Value', 'Status'], tableRows: [['Item 1', '100', 'Active'], ['Item 2', '200', 'Pending'], ['Item 3', '150', 'Done']] },
      image: { imageUrl: '', imageFit: 'cover' },
      template: { templateId: '' },
      notice: { noticeId: '' },
    };

    return {
      id: this.generateId(),
      type,
      title: type.charAt(0).toUpperCase() + type.slice(1) + ' Widget',
      gridCol: col,
      gridRow: row,
      colSpan: 1,
      rowSpan: 1,
      config: defaults[type] as WidgetConfig || {},
      style: {
        bgColor: '',
        textColor: '',
        borderRadius: 16,
        padding: 24,
      },
    };
  }

  selectWidget(widgetId: string, event: Event): void {
    event.stopPropagation();
    this.selectedWidgetId.set(widgetId);
  }

  deleteWidget(widgetId: string): void {
    const updatedPages = [...this.pages()];
    const idx = this.activePageIndex();
    updatedPages[idx] = {
      ...updatedPages[idx],
      widgets: updatedPages[idx].widgets.filter(w => w.id !== widgetId),
    };
    this.pages.set(updatedPages);
    this.selectedWidgetId.set(null);
  }

  deselectWidget(): void {
    this.selectedWidgetId.set(null);
  }

  // ===== WIDGET PROPERTY UPDATES =====
  updateWidgetProp(prop: string, value: any): void {
    const w = this.selectedWidget();
    if (!w) return;
    const updatedPages = [...this.pages()];
    const idx = this.activePageIndex();
    const widgets = [...updatedPages[idx].widgets];
    const wIdx = widgets.findIndex(x => x.id === w.id);
    if (wIdx < 0) return;

    const updatedWidget = { ...widgets[wIdx] };
    if (prop.startsWith('config.')) {
      const key = prop.replace('config.', '');
      updatedWidget.config = { ...updatedWidget.config, [key]: value };
    } else if (prop.startsWith('style.')) {
      const key = prop.replace('style.', '') as keyof BoardWidget['style'];
      updatedWidget.style = { ...updatedWidget.style, [key]: value };
    } else {
      (updatedWidget as any)[prop] = value;
    }

    widgets[wIdx] = updatedWidget;
    updatedPages[idx] = { ...updatedPages[idx], widgets };
    this.pages.set(updatedPages);
  }

  updateChartLabel(index: number, value: string): void {
    const w = this.selectedWidget();
    if (!w?.config?.chartData) return;
    const labels = [...w.config.chartData.labels];
    labels[index] = value;
    this.updateWidgetProp('config.chartData', { ...w.config.chartData, labels });
  }

  updateChartValue(index: number, value: number): void {
    const w = this.selectedWidget();
    if (!w?.config?.chartData) return;
    const values = [...w.config.chartData.values];
    values[index] = value;
    this.updateWidgetProp('config.chartData', { ...w.config.chartData, values });
  }

  addChartEntry(): void {
    const w = this.selectedWidget();
    if (!w?.config?.chartData) return;
    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#f97316'];
    this.updateWidgetProp('config.chartData', {
      labels: [...w.config.chartData.labels, `Item ${w.config.chartData.labels.length + 1}`],
      values: [...w.config.chartData.values, 0],
      colors: [...(w.config.chartData.colors || []), colors[w.config.chartData.labels.length % colors.length]],
    });
  }

  removeChartEntry(index: number): void {
    const w = this.selectedWidget();
    if (!w?.config?.chartData) return;
    this.updateWidgetProp('config.chartData', {
      labels: w.config.chartData.labels.filter((_: string, i: number) => i !== index),
      values: w.config.chartData.values.filter((_: number, i: number) => i !== index),
      colors: (w.config.chartData.colors || []).filter((_: string, i: number) => i !== index),
    });
  }

  updateTableHeader(index: number, value: string): void {
    const w = this.selectedWidget();
    if (!w?.config?.tableHeaders) return;
    const headers = [...w.config.tableHeaders];
    headers[index] = value;
    this.updateWidgetProp('config.tableHeaders', headers);
  }

  updateTableCell(rowIndex: number, colIndex: number, value: string): void {
    const w = this.selectedWidget();
    if (!w?.config?.tableRows) return;
    const rows = w.config.tableRows.map((r: string[]) => [...r]);
    rows[rowIndex][colIndex] = value;
    this.updateWidgetProp('config.tableRows', rows);
  }

  addTableRow(): void {
    const w = this.selectedWidget();
    if (!w?.config?.tableHeaders || !w?.config?.tableRows) return;
    const newRow = w.config.tableHeaders.map(() => '');
    this.updateWidgetProp('config.tableRows', [...w.config.tableRows, newRow]);
  }

  removeTableRow(index: number): void {
    const w = this.selectedWidget();
    if (!w?.config?.tableRows) return;
    this.updateWidgetProp('config.tableRows', w.config.tableRows.filter((_: string[], i: number) => i !== index));
  }

  addTableColumn(): void {
    const w = this.selectedWidget();
    if (!w?.config?.tableHeaders || !w?.config?.tableRows) return;
    this.updateWidgetProp('config.tableHeaders', [...w.config.tableHeaders, `Col ${w.config.tableHeaders.length + 1}`]);
    this.updateWidgetProp('config.tableRows', w.config.tableRows.map((r: string[]) => [...r, '']));
  }

  // ===== IMAGE UPLOAD =====
  onImageWidgetFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploadImageFile(file);
    input.value = '';
  }

  onImageWidgetDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) this.uploadImageFile(file);
  }

  onImageWidgetDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  private uploadImageFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.uploadError.set('Only image files are allowed.');
      return;
    }
    this.uploadError.set('');
    this.uploadingImage.set(true);
    this.api.uploadMedia(file).subscribe({
      next: (m) => {
        this.updateWidgetProp('config.imageUrl', m.url);
        this.mediaList.update((list) => [m, ...list]);
        this.uploadingImage.set(false);
      },
      error: (err) => {
        this.uploadError.set(err?.error?.error || 'Upload failed. Please try again.');
        this.uploadingImage.set(false);
      },
    });
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

  getImageWrapStyle(widget: any): Record<string, string> {
    const cfg = widget?.config || {};
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

  getImageStyle(widget: any): Record<string, string> {
    const cfg = widget?.config || {};
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
  private parseNumeric(v: string): number {
    if (v === undefined || v === null) return 0;
    const n = parseFloat(String(v).replace(/[, ]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }

  private formatTotal(n: number): string {
    if (!Number.isFinite(n)) return '';
    return Number.isInteger(n) ? String(n) : n.toFixed(2);
  }

  rowTotal(row: string[]): string {
    const sum = (row || []).reduce((acc, c) => acc + this.parseNumeric(c), 0);
    return this.formatTotal(sum);
  }

  columnTotal(widget: any, colIndex: number): string {
    const rows = widget?.config?.tableRows || [];
    const sum = rows.reduce((acc: number, r: string[]) => acc + this.parseNumeric(r[colIndex]), 0);
    return this.formatTotal(sum);
  }

  grandTotal(widget: any): string {
    const rows = widget?.config?.tableRows || [];
    const sum = rows.reduce((acc: number, r: string[]) =>
      acc + (r || []).reduce((rAcc: number, c: string) => rAcc + this.parseNumeric(c), 0), 0);
    return this.formatTotal(sum);
  }

  // ===== RESIZE =====
  resizeWidget(widgetId: string, direction: string, event: Event): void {
    event.stopPropagation();
    const updatedPages = [...this.pages()];
    const idx = this.activePageIndex();
    const widgets = [...updatedPages[idx].widgets];
    const wIdx = widgets.findIndex(w => w.id === widgetId);
    if (wIdx < 0) return;

    const w = { ...widgets[wIdx] };
    const maxCols = this.gridCols();
    const maxRows = this.gridRows();

    switch (direction) {
      case 'right':
        if (w.gridCol + w.colSpan <= maxCols) w.colSpan++;
        break;
      case 'left':
        if (w.colSpan > 1) w.colSpan--;
        break;
      case 'down':
        if (w.gridRow + w.rowSpan <= maxRows) w.rowSpan++;
        break;
      case 'up':
        if (w.rowSpan > 1) w.rowSpan--;
        break;
    }

    widgets[wIdx] = w;
    updatedPages[idx] = { ...updatedPages[idx], widgets };
    this.pages.set(updatedPages);
  }

  // ===== GRID HELPERS =====
  getGridCells(): { col: number; row: number }[] {
    const cells = [];
    for (let r = 1; r <= this.gridRows(); r++) {
      for (let c = 1; c <= this.gridCols(); c++) {
        cells.push({ col: c, row: r });
      }
    }
    return cells;
  }

  getWidgetAtCell(col: number, row: number): BoardWidget | null {
    const page = this.activePage();
    if (!page) return null;
    return page.widgets.find(w =>
      col >= w.gridCol && col < w.gridCol + w.colSpan &&
      row >= w.gridRow && row < w.gridRow + w.rowSpan
    ) || null;
  }

  isWidgetOrigin(widget: BoardWidget, col: number, row: number): boolean {
    return widget.gridCol === col && widget.gridRow === row;
  }

  // ===== SAVE =====
  save(): void {
    this.saving.set(true);
    const board = this.board();
    if (!board) { this.saving.set(false); return; }

    const updateData: Partial<Board> = {
      ...board,
      pages: this.pages(),
      layout: {
        columns: this.gridCols(),
        rows: this.gridRows(),
        gap: board.layout?.gap || 16,
      },
    };

    this.api.updateBoard(this.boardId, updateData).subscribe({
      next: () => {
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  saveAndExit(): void {
    this.saving.set(true);
    const board = this.board();
    if (!board) { this.saving.set(false); return; }

    const updateData: Partial<Board> = {
      ...board,
      pages: this.pages(),
      layout: {
        columns: this.gridCols(),
        rows: this.gridRows(),
        gap: board.layout?.gap || 16,
      },
    };

    this.api.updateBoard(this.boardId, updateData).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/boards']);
      },
      error: () => this.saving.set(false),
    });
  }

  // ===== UTILS =====
  generateId(): string {
    return 'w' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  }

  trackByWidgetId(_: number, w: BoardWidget): string {
    return w.id;
  }

  trackByPageId(_: number, p: BoardPage): string {
    return p.id;
  }

  // ===== CHART HELPERS =====
  maxChartValue(widget: BoardWidget): number {
    const values = widget.config?.chartData?.values || [];
    return values.length > 0 ? Math.max(...values) : 1;
  }

  getPieSlices(widget: BoardWidget): { color: string; dashArray: string; offset: number }[] {
    const data = widget.config?.chartData;
    if (!data?.values?.length) return [];
    const total = data.values.reduce((a: number, b: number) => a + b, 0);
    if (total === 0) return [];

    const radius = widget.config.chartType === 'doughnut' ? 30 : 40;
    const circumference = 2 * Math.PI * radius;
    const slices: { color: string; dashArray: string; offset: number }[] = [];
    let cumulativeOffset = 0;

    data.values.forEach((val: number, i: number) => {
      const pct = val / total;
      const dash = pct * circumference;
      slices.push({
        color: (data.colors || [])[i] || '#3b82f6',
        dashArray: `${dash} ${circumference - dash}`,
        offset: -cumulativeOffset,
      });
      cumulativeOffset += dash;
    });

    return slices;
  }
}
