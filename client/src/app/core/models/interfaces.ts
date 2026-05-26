export interface DisplayScreens {
  showLogo: boolean;
  loadingTitle: string;
  loadingSubtitle: string;
  unavailableTitle: string;
  unavailableSubtitle: string;
  emptyTitle: string;
  emptySubtitle: string;
}

export interface CustomFont {
  family: string;
  url: string;
}

export interface DisplayBranding {
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  darkMode: boolean;
  tenantName?: string;
  customFonts?: CustomFont[];
  displayScreens: DisplayScreens;
}

export interface Tenant {
  _id: string;
  name: string;
  slug: string;
  industry: string;
  branding: {
    logo: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
    darkMode: boolean;
    customCSS: string;
    displayScreens?: DisplayScreens;
  };
  subscription: {
    plan: string;
    expiresAt: string | null;
  };
  settings: {
    timezone: string;
    dateFormat: string;
    maxFileSize: number;
    maxNotices: number;
    maxBoards: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  tenantId: string;
  email: string;
  name: string;
  avatar: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  permissions: string[];
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Notice {
  _id: string;
  tenantId: string;
  title: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'html' | 'external';
  media: MediaItem[];
  category: Category | null;
  priority: number;
  tags: string[];
  displayConfig: {
    size: 'small' | 'medium' | 'large' | 'full';
    gridSpan: { cols: number; rows: number };
    bgColor: string;
    textColor: string;
    animation: string;
  };
  schedule: {
    startDate: string | null;
    endDate: string | null;
    recurrence: 'none' | 'daily' | 'weekly' | 'monthly';
    timeSlots: { start: string; end: string }[];
  };
  sharing: {
    sharedWith: string[];
    isPublic: boolean;
    shareLink: string;
  };
  templateId: string | null;
  status: 'draft' | 'scheduled' | 'active' | 'expired' | 'archived';
  viewCount: number;
  createdBy: { _id: string; name: string; email: string; avatar: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface MediaItem {
  url: string;
  type: 'image' | 'video';
  thumbnail: string;
  filename: string;
  size: number;
}

export interface Media {
  _id: string;
  tenantId: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  thumbnail: string;
  type: 'image' | 'video';
  tags: string[];
  uploadedBy: { _id: string; name: string; email: string };
  createdAt: string;
}

export interface Category {
  _id: string;
  tenantId: string;
  name: string;
  color: string;
  icon: string;
  order: number;
  isActive: boolean;
}

export interface Template {
  _id: string;
  tenantId: string | null;
  name: string;
  description: string;
  thumbnail: string;
  category: string;
  industry: string[];
  html: string;
  css: string;
  fields: TemplateField[];
  isSystem: boolean;
  isActive: boolean;
  usageCount: number;
  createdBy: string | null;
  createdAt: string;
}

export interface TemplateField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'image' | 'number' | 'date' | 'color' | 'select';
  defaultValue: string;
  options: string[];
  required: boolean;
}

// ===== Widget System =====
export interface WidgetConfig {
  // Chart
  chartType?: 'bar' | 'line' | 'pie' | 'doughnut';
  chartData?: { labels: string[]; values: number[]; colors?: string[] };
  // Table
  tableHeaders?: string[];
  tableRows?: string[][];
  tableShowRowTotals?: boolean;
  tableShowColumnTotals?: boolean;
  tableRowTotalLabel?: string;     // header for the row-total column (default "Total")
  tableColumnTotalLabel?: string;  // first-column label for totals row (default "Total")
  // Image
  imageUrl?: string;
  imageFit?: 'cover' | 'contain' | 'fill' | 'none';
  imageEdgeToEdge?: boolean;             // ignore widget padding/radius
  imageWidthPct?: number;                 // 10–100, % of widget body width
  imageHeightPct?: number;                // 10–100, % of widget body height
  imagePosition?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  imageBgColor?: string;                  // shown behind image (useful with 'contain')
  // Template
  templateId?: string;
  templateData?: Record<string, string>;
  // Notice
  noticeId?: string;
  // Data source binding
  dataSourceId?: string;
  dataSourcePath?: string;
  dataSourceColumns?: { key: string; label?: string }[];
  dataSourceRowLimit?: number;
  dataSourceLabelKey?: string;
  dataSourceValueKey?: string;
  dataSourceTextTemplate?: string;
}

export interface DataSource {
  _id: string;
  tenantId: string;
  name: string;
  description: string;
  sourceType: 'url' | 'json';
  url: string;
  method: 'GET' | 'POST';
  headers: Record<string, string>;
  body: any;
  refreshInterval: number;
  dataPath: string;
  isActive: boolean;
  data: any;
  lastFetchedAt: string | null;
  lastFetchStatus: 'success' | 'error' | 'never';
  lastError: string;
  createdAt: string;
  updatedAt: string;
}

export interface DataSourceTestResult {
  status: 'success' | 'error';
  error: string;
  data: any;
  preview: any;
}

export interface DataSourceLite {
  _id: string;
  name: string;
  dataPath: string;
  data: any;
  lastFetchedAt: string | null;
  lastFetchStatus: 'success' | 'error' | 'never';
  lastError: string;
}

export interface BoardWidget {
  id: string;
  type: 'chart' | 'table' | 'image' | 'template' | 'notice';
  title: string;
  gridCol: number;
  gridRow: number;
  colSpan: number;
  rowSpan: number;
  config: WidgetConfig;
  style: {
    bgColor: string;
    textColor: string;
    borderRadius: number;
    padding: number;
  };
}

export interface BoardPage {
  id: string;
  name: string;
  widgets: BoardWidget[];
  order: number;
}

export interface Board {
  _id: string;
  tenantId: string;
  name: string;
  description: string;
  displayMode: 'carousel' | 'grid' | 'list' | 'single';
  layout: {
    columns: number;
    rows: number;
    gap: number;
  };
  carousel: {
    autoPlay: boolean;
    interval: number;
    transition: string;
    pauseOnHover: boolean;
    showIndicators: boolean;
    showNavigation: boolean;
  };
  autoScroll: {
    enabled: boolean;
    speed: number;
    direction: 'up' | 'down' | 'left' | 'right';
    pauseOnHover: boolean;
  };
  filters: {
    categories: string[];
    priorities: number[];
    tags: string[];
    statuses: string[];
  };
  theme: {
    bgColor: string;
    bgImage: string;
    bgGradient: string;
    headerVisible: boolean;
    headerText: string;
    clockVisible: boolean;
    dateVisible: boolean;
    logoVisible: boolean;
    fontFamily: string;
    fontSize: string;
  };
  pages: BoardPage[];
  externalDataSources: ExternalDataSource[];
  accessCode: string;
  isActive: boolean;
  lastAccessedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExternalDataSource {
  name: string;
  url: string;
  method: 'GET' | 'POST';
  headers: Record<string, string>;
  body: any;
  refreshInterval: number;
  fieldMapping: Record<string, string>;
  isActive: boolean;
}

export interface PaginatedResponse<T> {
  notices: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AuthResponse {
  message: string;
  user: User;
  tenant: Tenant;
  accessToken: string;
  refreshToken: string;
}

export interface BoardDisplayResponse {
  available?: boolean;
  board: Partial<Board>;
  notices: Notice[];
  templates?: Record<string, { _id: string; name: string; html: string; css: string; fields?: TemplateField[] }>;
  widgetNotices?: Record<string, Notice>;
  dataSources?: Record<string, DataSourceLite>;
  branding?: DisplayBranding;
}

export interface BoardUnavailableResponse {
  error: string;
  available: false;
  branding?: DisplayBranding;
}
