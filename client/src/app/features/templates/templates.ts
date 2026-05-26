import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Template } from '../../core/models/interfaces';

@Component({
  selector: 'app-templates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './templates.html',
  styleUrl: './templates.scss',
})
export class TemplatesComponent implements OnInit {
  templates = signal<Template[]>([]);
  loading = signal(true);
  filterCategory = '';
  showCreateModal = false;

  newTemplate: Partial<Template> = {
    name: '',
    description: '',
    category: 'custom',
    html: '<div class="notice">\n  <h2>{{title}}</h2>\n  <p>{{content}}</p>\n</div>',
    css: '.notice { padding: 24px; background: #1e293b; border-radius: 16px; color: #f1f5f9; }\nh2 { margin-bottom: 12px; }',
    fields: [],
  };

  constructor(
    private api: ApiService,
    private router: Router,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.loading.set(true);
    const params: Record<string, string> = {};
    if (this.filterCategory) params['category'] = this.filterCategory;

    this.api.getTemplates(params).subscribe({
      next: (templates) => {
        this.templates.set(templates);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  useTemplate(template: Template): void {
    this.api.instantiateTemplate(template._id, {
      title: `${template.name} - ${new Date().toLocaleDateString()}`,
    }).subscribe({
      next: (notice) => this.router.navigate(['/notices', notice._id, 'edit']),
    });
  }

  createTemplate(): void {
    this.api.createTemplate(this.newTemplate).subscribe({
      next: () => {
        this.showCreateModal = false;
        this.loadTemplates();
        this.resetForm();
      },
    });
  }

  deleteTemplate(id: string): void {
    if (confirm('Delete this template?')) {
      this.api.deleteTemplate(id).subscribe(() => this.loadTemplates());
    }
  }

  resetForm(): void {
    this.newTemplate = {
      name: '', description: '', category: 'custom',
      html: '<div class="notice">\n  <h2>{{title}}</h2>\n  <p>{{content}}</p>\n</div>',
      css: '.notice { padding: 24px; background: #1e293b; border-radius: 16px; color: #f1f5f9; }',
      fields: [],
    };
  }
}
