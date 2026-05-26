import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, User, Tenant } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  // Signals for reactive state
  private _user = signal<User | null>(null);
  private _tenant = signal<Tenant | null>(null);
  private _token = signal<string | null>(null);
  private _loading = signal(false);

  readonly user = this._user.asReadonly();
  readonly tenant = this._tenant.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token());
  readonly loading = this._loading.asReadonly();
  readonly userRole = computed(() => this._user()?.role || 'viewer');

  constructor(private http: HttpClient, private router: Router) {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const token = localStorage.getItem('nb_token');
    const user = localStorage.getItem('nb_user');
    const tenant = localStorage.getItem('nb_tenant');

    if (token && user) {
      this._token.set(token);
      this._user.set(JSON.parse(user));
      if (tenant) this._tenant.set(JSON.parse(tenant));
    }
  }

  private saveToStorage(data: AuthResponse): void {
    localStorage.setItem('nb_token', data.accessToken);
    localStorage.setItem('nb_refresh_token', data.refreshToken);
    localStorage.setItem('nb_user', JSON.stringify(data.user));
    localStorage.setItem('nb_tenant', JSON.stringify(data.tenant));
  }

  getToken(): string | null {
    return this._token();
  }

  async register(data: {
    companyName: string;
    industry: string;
    name: string;
    email: string;
    password: string;
  }): Promise<void> {
    this._loading.set(true);
    try {
      const res = await firstValueFrom(this.http.post<AuthResponse>(`${this.apiUrl}/register`, data));
      if (res) {
        this._user.set(res.user);
        this._tenant.set(res.tenant);
        this._token.set(res.accessToken);
        this.saveToStorage(res);
        this.router.navigate(['/dashboard']);
      }
    } finally {
      this._loading.set(false);
    }
  }

  async login(email: string, password: string): Promise<void> {
    this._loading.set(true);
    try {
      const res = await firstValueFrom(this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password }));
      if (res) {
        this._user.set(res.user);
        this._tenant.set(res.tenant);
        this._token.set(res.accessToken);
        this.saveToStorage(res);
        this.router.navigate(['/dashboard']);
      }
    } finally {
      this._loading.set(false);
    }
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('nb_refresh_token');
  }

  async refreshToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;
    try {
      const res = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, { refreshToken })
      );
      if (res) {
        this._token.set(res.accessToken);
        this.saveToStorage(res);
        return res.accessToken;
      }
      return null;
    } catch {
      return null;
    }
  }

  logout(): void {
    this._user.set(null);
    this._tenant.set(null);
    this._token.set(null);
    localStorage.removeItem('nb_token');
    localStorage.removeItem('nb_refresh_token');
    localStorage.removeItem('nb_user');
    localStorage.removeItem('nb_tenant');
    this.router.navigate(['/auth/login']);
  }

  hasPermission(permission: string): boolean {
    return this._user()?.permissions?.includes(permission) || false;
  }

  updateTenant(tenant: Tenant): void {
    this._tenant.set(tenant);
    localStorage.setItem('nb_tenant', JSON.stringify(tenant));
  }
}
