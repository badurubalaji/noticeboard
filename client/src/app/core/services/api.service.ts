import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Notice, PaginatedResponse, Category, Template,
  Board, BoardDisplayResponse, Media, Tenant, User,
  DataSource, DataSourceTestResult
} from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ===== NOTICES =====
  getNotices(params?: Record<string, string>): Observable<PaginatedResponse<Notice>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) httpParams = httpParams.set(key, value);
      });
    }
    return this.http.get<PaginatedResponse<Notice>>(`${this.baseUrl}/notices`, { params: httpParams });
  }

  getNotice(id: string): Observable<Notice> {
    return this.http.get<Notice>(`${this.baseUrl}/notices/${id}`);
  }

  createNotice(data: Partial<Notice>): Observable<Notice> {
    return this.http.post<Notice>(`${this.baseUrl}/notices`, data);
  }

  updateNotice(id: string, data: Partial<Notice>): Observable<Notice> {
    return this.http.put<Notice>(`${this.baseUrl}/notices/${id}`, data);
  }

  deleteNotice(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/notices/${id}`);
  }

  updateNoticeStatus(id: string, status: string): Observable<Notice> {
    return this.http.patch<Notice>(`${this.baseUrl}/notices/${id}/status`, { status });
  }

  shareNotice(id: string, data: { userIds?: string[]; isPublic?: boolean }): Observable<any> {
    return this.http.post(`${this.baseUrl}/notices/${id}/share`, data);
  }

  // ===== CATEGORIES =====
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`);
  }

  createCategory(data: Partial<Category>): Observable<Category> {
    return this.http.post<Category>(`${this.baseUrl}/categories`, data);
  }

  updateCategory(id: string, data: Partial<Category>): Observable<Category> {
    return this.http.put<Category>(`${this.baseUrl}/categories/${id}`, data);
  }

  deleteCategory(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/categories/${id}`);
  }

  // ===== TEMPLATES =====
  getTemplates(params?: Record<string, string>): Observable<Template[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) httpParams = httpParams.set(key, value);
      });
    }
    return this.http.get<Template[]>(`${this.baseUrl}/templates`, { params: httpParams });
  }

  getTemplate(id: string): Observable<Template> {
    return this.http.get<Template>(`${this.baseUrl}/templates/${id}`);
  }

  createTemplate(data: Partial<Template>): Observable<Template> {
    return this.http.post<Template>(`${this.baseUrl}/templates`, data);
  }

  updateTemplate(id: string, data: Partial<Template>): Observable<Template> {
    return this.http.put<Template>(`${this.baseUrl}/templates/${id}`, data);
  }

  deleteTemplate(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/templates/${id}`);
  }

  instantiateTemplate(id: string, data: any): Observable<Notice> {
    return this.http.post<Notice>(`${this.baseUrl}/templates/${id}/instantiate`, data);
  }

  // ===== BOARDS =====
  getBoards(): Observable<Board[]> {
    return this.http.get<Board[]>(`${this.baseUrl}/boards`);
  }

  getBoard(id: string): Observable<Board> {
    return this.http.get<Board>(`${this.baseUrl}/boards/${id}`);
  }

  createBoard(data: Partial<Board>): Observable<Board> {
    return this.http.post<Board>(`${this.baseUrl}/boards`, data);
  }

  updateBoard(id: string, data: Partial<Board>): Observable<Board> {
    return this.http.put<Board>(`${this.baseUrl}/boards/${id}`, data);
  }

  deleteBoard(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/boards/${id}`);
  }

  getBoardDisplay(boardId: string): Observable<BoardDisplayResponse> {
    return this.http.get<BoardDisplayResponse>(`${this.baseUrl}/boards/${boardId}/display`);
  }

  // ===== MEDIA =====
  uploadMedia(file: File): Observable<Media> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Media>(`${this.baseUrl}/media/upload`, formData);
  }

  getMediaList(type?: string): Observable<Media[]> {
    let params = new HttpParams();
    if (type) params = params.set('type', type);
    return this.http.get<Media[]>(`${this.baseUrl}/media`, { params });
  }

  deleteMedia(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/media/${id}`);
  }

  // ===== TENANT =====
  getTenant(): Observable<Tenant> {
    return this.http.get<Tenant>(`${this.baseUrl}/tenant`);
  }

  updateTenant(data: Partial<Tenant>): Observable<Tenant> {
    return this.http.put<Tenant>(`${this.baseUrl}/tenant`, data);
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/tenant/users`);
  }

  inviteUser(data: { email: string; name: string; role: string; password: string }): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/tenant/users`, data);
  }

  updateUser(id: string, data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/tenant/users/${id}`, data);
  }

  // ===== DATA SOURCES =====
  listDataSources(): Observable<DataSource[]> {
    return this.http.get<DataSource[]>(`${this.baseUrl}/datasources`);
  }

  getDataSource(id: string): Observable<DataSource> {
    return this.http.get<DataSource>(`${this.baseUrl}/datasources/${id}`);
  }

  createDataSource(data: Partial<DataSource>): Observable<DataSource> {
    return this.http.post<DataSource>(`${this.baseUrl}/datasources`, data);
  }

  updateDataSource(id: string, data: Partial<DataSource>): Observable<DataSource> {
    return this.http.put<DataSource>(`${this.baseUrl}/datasources/${id}`, data);
  }

  deleteDataSource(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/datasources/${id}`);
  }

  testDataSource(data: Partial<DataSource>): Observable<DataSourceTestResult> {
    return this.http.post<DataSourceTestResult>(`${this.baseUrl}/datasources/test`, data);
  }

  refreshDataSource(id: string): Observable<DataSource> {
    return this.http.post<DataSource>(`${this.baseUrl}/datasources/${id}/refresh`, {});
  }

  uploadJsonDataSource(file: File): Observable<{ data: any; filename: string; size: number }> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<{ data: any; filename: string; size: number }>(`${this.baseUrl}/datasources/upload-json`, fd);
  }
}
