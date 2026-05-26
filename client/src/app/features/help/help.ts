import { Component, OnInit, signal, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

interface HelpTopic {
  slug: string;
  icon: string;
  title: string;
  blurb: string;
  category: 'start' | 'daily' | 'setup' | 'fix';
}

const TOPICS: HelpTopic[] = [
  { slug: '01-start-here',   icon: '🟢', title: 'What is NoticeBoard?',                  blurb: 'A 2-minute tour. Read this first.',                    category: 'start' },
  { slug: '02-update-table', icon: '✏️', title: 'Change the numbers in a table',         blurb: "The everyday task — update today's values.",          category: 'daily' },
  { slug: '03-upload-json',  icon: '📤', title: 'Upload a new JSON file',                blurb: 'Got a file with new numbers? Drop it in here.',       category: 'daily' },
  { slug: '04-replace-image',icon: '🖼️', title: 'Replace a picture on a board',          blurb: 'Swap out a logo or photo in 30 seconds.',             category: 'daily' },
  { slug: '05-use-template', icon: '📄', title: 'Fill in a ready-made template',         blurb: 'Use the designs your admin already created.',         category: 'daily' },
  { slug: '06-branding',     icon: '🎨', title: 'Add your logo and colours',             blurb: 'Make NoticeBoard look like your company.',            category: 'setup' },
  { slug: '07-connect-url',  icon: '🔗', title: 'Connect to a live data feed',           blurb: 'For when your numbers live in another system.',       category: 'setup' },
  { slug: '08-show-on-tv',   icon: '📺', title: 'Show a board on a TV or tablet',        blurb: 'Get your board onto a real screen.',                  category: 'setup' },
  { slug: '09-troubleshooting', icon: '❓', title: 'Something is wrong — fix it',         blurb: 'Common problems and what to do.',                     category: 'fix' },
];

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './help.html',
  styleUrl: './help.scss',
  // innerHTML-rendered markdown wouldn't receive scoped attributes, so
  // scoped styles wouldn't reach headings/lists/tables inside the article.
  encapsulation: ViewEncapsulation.None,
})
export class HelpComponent implements OnInit {
  topics = TOPICS;
  activeSlug = signal<string | null>(null);
  loading = signal(false);
  contentHtml = signal<SafeHtml | null>(null);
  search = signal('');

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.topics;
    return this.topics.filter(t =>
      t.title.toLowerCase().includes(q) || t.blurb.toLowerCase().includes(q)
    );
  });

  byCategory = computed(() => {
    const groups: Record<string, HelpTopic[]> = { start: [], daily: [], setup: [], fix: [] };
    for (const t of this.filtered()) groups[t.category].push(t);
    return groups;
  });

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.queryParams['topic'];
    if (slug) this.openTopic(slug);
  }

  openTopic(slug: string): void {
    this.activeSlug.set(slug);
    this.loading.set(true);
    this.contentHtml.set(null);
    this.router.navigate([], { queryParams: { topic: slug }, queryParamsHandling: 'merge' });

    this.http.get(`/help/${slug}.md`, { responseType: 'text' }).subscribe({
      next: (md) => {
        const html = mdToHtml(md);
        this.contentHtml.set(this.sanitizer.bypassSecurityTrustHtml(html));
        this.loading.set(false);
        setTimeout(() => {
          const main = document.querySelector('.help-article');
          main?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
        }, 0);
      },
      error: () => {
        this.contentHtml.set(this.sanitizer.bypassSecurityTrustHtml('<p>Could not load this help topic. Please try again.</p>'));
        this.loading.set(false);
      },
    });
  }

  closeTopic(): void {
    this.activeSlug.set(null);
    this.contentHtml.set(null);
    this.router.navigate([], { queryParams: {} });
  }

  onSearch(v: string): void {
    this.search.set(v);
  }
}

/**
 * Render markdown → HTML using `marked` (GitHub-Flavored Markdown).
 *
 * Then rewrite internal links of the form `./03-upload-json.md` so the
 * help component can intercept clicks and route in-app (instead of
 * navigating away to a 404).
 */
function mdToHtml(md: string): string {
  marked.setOptions({ gfm: true, breaks: false });
  let html = marked.parse(md, { async: false }) as string;

  // Rewrite "./xx.md" links (and "./xx.md#anchor") into in-app help links.
  html = html.replace(
    /<a([^>]*?)href="\.\/([^"]+?)\.md(#[^"]*)?"([^>]*)>/g,
    (_m, before, slug, hash, after) =>
      `<a${before}class="help-internal" data-help-topic="${slug}"${hash ? ` data-help-hash="${hash}"` : ''}${after}>`
  );

  // Make external links open in a new tab.
  html = html.replace(
    /<a([^>]*?)href="(https?:\/\/[^"]+)"([^>]*)>/g,
    (_m, before, href, after) => `<a${before}href="${href}" target="_blank" rel="noopener"${after}>`
  );

  return html;
}
