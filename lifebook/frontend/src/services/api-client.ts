// API Client for Technical Specification System
// Provides TypeScript-first HTTP client with automatic error handling

// Types based on data model
interface Document {
  id: string;
  title: string;
  content: {
    sections: Section[];
    metadata: Record<string, any>;
  };
  wordCount: number;
  status: 'draft' | 'review' | 'approved' | 'published' | 'archived';
  version: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  ownerId: string;
}

interface Section {
  id: string;
  documentId: string;
  parentId: string | null;
  title: string;
  content: string;
  level: number;
  order: number;
  wordCount: number;
  metadata: Record<string, any>;
}

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'editor' | 'viewer' | 'guest';
  preferences: Record<string, any>;
  lastActiveAt: string;
  createdAt: string;
  isActive: boolean;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  structure: {
    sections: Array<{
      title: string;
      level: number;
      content: string;
      placeholder?: string;
    }>;
    metadata: Record<string, any>;
  };
  defaultContent: {
    title: string;
    sections: Array<{
      title: string;
      content: string;
    }>;
  };
  metadata: {
    estimatedLength: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    tags: string[];
    industry?: string;
    useCase?: string[];
  };
  createdBy: string;
  isPublic: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ExportRequest {
  documentId: string;
  format: 'pdf' | 'html' | 'markdown' | 'word';
  parameters: {
    includeMetadata?: boolean;
    includeToc?: boolean;
    includePageNumbers?: boolean;
    headerFooter?: {
      header?: string;
      footer?: string;
    };
    styling?: {
      fontSize?: number;
      fontFamily?: string;
      margins?: {
        top: number;
        right: number;
        bottom: number;
        left: number;
      };
    };
    sections?: {
      included: string[];
      excluded: string[];
    };
  };
}

interface ExportStatus {
  id: string;
  documentId: string;
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  filePath?: string;
  fileSize?: number;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

interface SearchResult {
  type: 'document' | 'section' | 'content';
  id: string;
  documentId: string;
  title: string;
  content: string;
  highlight: string;
  score: number;
  metadata: {
    wordCount: number;
    sectionLevel?: number;
    documentStatus: string;
    createdBy: string;
    updatedAt: string;
  };
}

interface SearchFilters {
  types: ('document' | 'section' | 'content')[];
  status: string[];
  authors: string[];
  dateRange: {
    start: string | null;
    end: string | null;
  };
  minWordCount: number;
  maxWordCount: number;
}

interface APIError {
  code: string;
  message: string;
  details?: any;
}

interface APIResponse<T> {
  data: T;
  success: true;
}

interface APIErrorResponse {
  error: APIError;
  success: false;
}

type APIResult<T> = APIResponse<T> | APIErrorResponse;

// API Client Class
class APIClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = '/api/v1') {
    this.baseURL = baseURL;
  }

  // Authentication
  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  // Private request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResult<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      defaultHeaders.Authorization = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: {
            code: response.status.toString(),
            message: errorData.message || response.statusText,
            details: errorData,
          },
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network request failed',
        },
      };
    }
  }

  // GET request
  private async get<T>(endpoint: string): Promise<APIResult<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  private async post<T>(endpoint: string, data?: any): Promise<APIResult<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  private async put<T>(endpoint: string, data?: any): Promise<APIResult<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  private async delete<T>(endpoint: string): Promise<APIResult<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Document API methods
  async getDocuments(): Promise<APIResult<Document[]>> {
    return this.get<Document[]>('/documents');
  }

  async getDocument(id: string): Promise<APIResult<Document>> {
    return this.get<Document>(`/documents/${id}`);
  }

  async createDocument(document: Partial<Document>): Promise<APIResult<Document>> {
    return this.post<Document>('/documents', document);
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<APIResult<Document>> {
    return this.put<Document>(`/documents/${id}`, updates);
  }

  async deleteDocument(id: string): Promise<APIResult<void>> {
    return this.delete<void>(`/documents/${id}`);
  }

  // Section API methods
  async getDocumentSections(documentId: string): Promise<APIResult<Section[]>> {
    return this.get<Section[]>(`/documents/${documentId}/sections`);
  }

  async createSection(documentId: string, section: Partial<Section>): Promise<APIResult<Section>> {
    return this.post<Section>(`/documents/${documentId}/sections`, section);
  }

  async updateSection(documentId: string, sectionId: string, updates: Partial<Section>): Promise<APIResult<Section>> {
    return this.put<Section>(`/documents/${documentId}/sections/${sectionId}`, updates);
  }

  async deleteSection(documentId: string, sectionId: string): Promise<APIResult<void>> {
    return this.delete<void>(`/documents/${documentId}/sections/${sectionId}`);
  }

  // Export API methods
  async createExport(request: ExportRequest): Promise<APIResult<{ exportId: string }>> {
    return this.post<{ exportId: string }>(`/documents/${request.documentId}/export`, request);
  }

  async getExportStatus(exportId: string): Promise<APIResult<ExportStatus>> {
    return this.get<ExportStatus>(`/exports/${exportId}`);
  }

  async downloadExport(exportId: string): Promise<APIResult<Blob>> {
    const response = await fetch(`${this.baseURL}/exports/${exportId}/download`, {
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
    });
    
    if (!response.ok) {
      return {
        success: false,
        error: {
          code: response.status.toString(),
          message: response.statusText,
        },
      };
    }

    const blob = await response.blob();
    return {
      success: true,
      data: blob,
    };
  }

  // Search API methods
  async search(query: string, filters: SearchFilters): Promise<APIResult<SearchResult[]>> {
    const params = new URLSearchParams({
      q: query,
      types: filters.types.join(','),
      status: filters.status.join(','),
      authors: filters.authors.join(','),
      minWordCount: filters.minWordCount.toString(),
      maxWordCount: filters.maxWordCount.toString(),
    });

    if (filters.dateRange.start) {
      params.append('dateStart', filters.dateRange.start);
    }
    if (filters.dateRange.end) {
      params.append('dateEnd', filters.dateRange.end);
    }

    return this.get<SearchResult[]>(`/search?${params.toString()}`);
  }

  // Template API methods
  async getTemplates(): Promise<APIResult<Template[]>> {
    return this.get<Template[]>('/templates');
  }

  async getTemplate(id: string): Promise<APIResult<Template>> {
    return this.get<Template>(`/templates/${id}`);
  }

  async createTemplate(template: Partial<Template>): Promise<APIResult<Template>> {
    return this.post<Template>('/templates', template);
  }

  async updateTemplate(id: string, updates: Partial<Template>): Promise<APIResult<Template>> {
    return this.put<Template>(`/templates/${id}`, updates);
  }

  async deleteTemplate(id: string): Promise<APIResult<void>> {
    return this.delete<void>(`/templates/${id}`);
  }

  // User API methods
  async getCurrentUser(): Promise<APIResult<User>> {
    return this.get<User>('/users/me');
  }

  async updateUser(updates: Partial<User>): Promise<APIResult<User>> {
    return this.put<User>('/users/me', updates);
  }

  async getUsers(): Promise<APIResult<User[]>> {
    return this.get<User[]>('/users');
  }

  // Helper methods
  async handleAPIResult<T>(
    result: APIResult<T>,
    onSuccess?: (data: T) => void,
    onError?: (error: APIError) => void
  ): Promise<T | null> {
    if (result.success) {
      onSuccess?.(result.data);
      return result.data;
    } else {
      onError?.(result.error);
      console.error('API Error:', result.error);
      return null;
    }
  }

  // Utility method to create documents from templates
  async createDocumentFromTemplate(templateId: string, title?: string): Promise<APIResult<Document>> {
    const templateResult = await this.getTemplate(templateId);
    
    if (!templateResult.success) {
      return templateResult as APIErrorResponse;
    }

    const template = templateResult.data;
    const documentData: Partial<Document> = {
      title: title || template.defaultContent.title,
      content: {
        sections: template.defaultContent.sections.map((section, index) => ({
          id: `section-${index}`,
          documentId: '', // Will be set by backend
          parentId: null,
          title: section.title,
          content: section.content,
          level: 0,
          order: index,
          wordCount: section.content.split(' ').length,
          metadata: {},
        })),
        metadata: template.structure.metadata,
      },
      status: 'draft' as const,
      metadata: {
        createdFromTemplate: templateId,
        templateName: template.name,
      },
    };

    return this.createDocument(documentData);
  }
}

// Create and export default API client instance
const apiClient = new APIClient();

export default apiClient;
export type {
  Document,
  Section,
  User,
  Template,
  ExportRequest,
  ExportStatus,
  SearchResult,
  SearchFilters,
  APIError,
  APIResult,
};

// Export API client class for custom instances
export { APIClient };