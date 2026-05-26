module.exports = {
  // User roles
  ROLES: {
    OWNER: 'owner',
    ADMIN: 'admin',
    EDITOR: 'editor',
    VIEWER: 'viewer',
  },

  // Permissions
  PERMISSIONS: {
    NOTICE_CREATE: 'notice:create',
    NOTICE_EDIT: 'notice:edit',
    NOTICE_DELETE: 'notice:delete',
    NOTICE_VIEW: 'notice:view',
    TEMPLATE_MANAGE: 'template:manage',
    BOARD_CONFIGURE: 'board:configure',
    USER_MANAGE: 'user:manage',
    TENANT_MANAGE: 'tenant:manage',
    MEDIA_UPLOAD: 'media:upload',
    MEDIA_DELETE: 'media:delete',
    CATEGORY_MANAGE: 'category:manage',
  },

  // Role-permission mapping
  ROLE_PERMISSIONS: {
    owner: [
      'notice:create', 'notice:edit', 'notice:delete', 'notice:view',
      'template:manage', 'board:configure', 'user:manage', 'tenant:manage',
      'media:upload', 'media:delete', 'category:manage',
    ],
    admin: [
      'notice:create', 'notice:edit', 'notice:delete', 'notice:view',
      'template:manage', 'board:configure', 'user:manage',
      'media:upload', 'media:delete', 'category:manage',
    ],
    editor: [
      'notice:create', 'notice:edit', 'notice:view',
      'media:upload', 'category:manage',
    ],
    viewer: [
      'notice:view',
    ],
  },

  // Notice statuses
  NOTICE_STATUS: {
    DRAFT: 'draft',
    SCHEDULED: 'scheduled',
    ACTIVE: 'active',
    EXPIRED: 'expired',
    ARCHIVED: 'archived',
  },

  // Notice types
  NOTICE_TYPES: ['text', 'image', 'video', 'html', 'external'],

  // Display modes
  DISPLAY_MODES: ['carousel', 'grid', 'list', 'single'],

  // Notice sizes
  NOTICE_SIZES: ['small', 'medium', 'large', 'full'],

  // Priorities
  PRIORITIES: [1, 2, 3, 4, 5],

  // Industries
  INDUSTRIES: ['IT', 'Logistics', 'Manufacturing', 'Assembly', 'Healthcare', 'Education', 'Retail', 'Other'],

  // Recurrence types
  RECURRENCE_TYPES: ['none', 'daily', 'weekly', 'monthly'],

  // Transition effects
  TRANSITIONS: ['slide', 'fade', 'flip', 'zoom', 'none'],

  // Scroll directions
  SCROLL_DIRECTIONS: ['up', 'down', 'left', 'right'],

  // Allowed file types
  // SVG is intentionally excluded — SVG files can carry inline <script>
  // and are a stored-XSS vector when rendered with <img>/<object>.
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg'],

  // Pagination defaults
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};
