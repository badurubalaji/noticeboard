import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-bg">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
      </div>
      <div class="auth-card animate-slide-up">
        <div class="auth-header">
          <div class="logo">
            <img src="/logo.png" alt="NoticeBoard" class="logo-icon" />
            <span class="logo-text">NoticeBoard</span>
          </div>
          <h1>Get Started</h1>
          <p>Create your digital signage workspace</p>
        </div>

        @if (error()) {
          <div class="error-banner">{{ error() }}</div>
        }

        <form (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label for="companyName">Company Name</label>
            <input id="companyName" type="text" class="form-input" [(ngModel)]="form.companyName"
              name="companyName" placeholder="Acme Corp" required />
          </div>

          <div class="form-group">
            <label for="industry">Industry</label>
            <select id="industry" class="form-select" [(ngModel)]="form.industry" name="industry">
              <option value="IT">IT & Technology</option>
              <option value="Logistics">Logistics & Supply Chain</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Assembly">Assembly</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Education">Education</option>
              <option value="Retail">Retail</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div class="form-group">
            <label for="name">Your Full Name</label>
            <input id="name" type="text" class="form-input" [(ngModel)]="form.name"
              name="name" placeholder="John Doe" required />
          </div>

          <div class="form-group">
            <label for="email">Work Email</label>
            <input id="email" type="email" class="form-input" [(ngModel)]="form.email"
              name="email" placeholder="john@acme.com" required autocomplete="email" />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" type="password" class="form-input" [(ngModel)]="form.password"
              name="password" placeholder="Minimum 6 characters" required minlength="6"
              autocomplete="new-password" />
          </div>

          <button type="submit" class="btn btn-primary btn-lg auth-submit"
            [disabled]="authService.loading()">
            @if (authService.loading()) {
              <span class="spinner"></span> Creating workspace...
            } @else {
              Create Workspace
            }
          </button>
        </form>

        <div class="auth-footer">
          Already have an account?
          <a routerLink="/auth/login">Sign in</a>
        </div>
      </div>
    </div>
  `,
  styleUrl: '../login/login.component.scss',
})
export class RegisterComponent {
  form = {
    companyName: '',
    industry: 'IT',
    name: '',
    email: '',
    password: '',
  };
  error = signal('');

  constructor(public authService: AuthService) {}

  async onSubmit() {
    this.error.set('');
    try {
      await this.authService.register(this.form);
    } catch (err: any) {
      this.error.set(err?.error?.error || 'Registration failed. Please try again.');
    }
  }
}
