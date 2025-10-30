const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiError {
  error: string;
  message: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.message || 'API request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Sessions
  async createSession(patientId: string) {
    return this.request<{ id: string; sessionId: string }>('/sessions', {
      method: 'POST',
      body: JSON.stringify({ patientId }),
    });
  }

  async uploadRecording(sessionId: string, audioFile: File | Blob) {
    const formData = new FormData();

    // If it's a File object, use its original name; otherwise use 'recording.webm'
    if (audioFile instanceof File) {
      formData.append('audio', audioFile, audioFile.name);
    } else {
      formData.append('audio', audioFile, 'recording.webm');
    }

    const url = `${this.baseUrl}/sessions/${sessionId}/recording`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'Failed to upload recording');
    }

    return await response.json();
  }

  async getSession(sessionId: string) {
    return this.request<any>(`/sessions/${sessionId}`);
  }

  async getSessions(params?: { patientId?: string; status?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.patientId) queryParams.append('patientId', params.patientId);
    if (params?.status) queryParams.append('status', params.status);

    return this.request<{ sessions: any[] }>(`/sessions?${queryParams.toString()}`);
  }

  // Transcriptions
  async startTranscription(sessionId: string) {
    return this.request(`/transcriptions`, {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  }

  async getTranscriptionStatus(transcriptionId: string) {
    return this.request(`/transcriptions/${transcriptionId}`);
  }

  async getTranscriptSegments(sessionId: string) {
    return this.request<any>(`/transcriptions/${sessionId}/segments`);
  }

  // Clinical Notes
  async generateNote(sessionId: string, noteType: 'soap' | 'dare') {
    return this.request<any>(`/notes/generate`, {
      method: 'POST',
      body: JSON.stringify({ sessionId, noteType }),
    });
  }

  async createNote(data: {
    sessionId: string;
    type: 'soap' | 'dare';
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
    description?: string;
    action?: string;
    response?: string;
    evaluation?: string;
  }) {
    return this.request(`/notes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateNote(noteId: string, data: Partial<{
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
    description?: string;
    action?: string;
    response?: string;
    evaluation?: string;
  }>) {
    return this.request(`/notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async signNote(noteId: string) {
    return this.request(`/notes/${noteId}/sign`, {
      method: 'POST',
    });
  }

  async getNote(noteId: string) {
    return this.request(`/notes/${noteId}`);
  }

  async getSessionNotes(sessionId: string) {
    return this.request<any>(`/notes/session/${sessionId}`);
  }

  // Patients
  async getPatients() {
    return this.request<{ patients: any[] }>('/patients');
  }

  async getPatient(patientId: string) {
    return this.request<{ patient: any }>(`/patients/${patientId}`);
  }

  async createPatient(data: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    email?: string;
    phone?: string;
  }) {
    return this.request<{ patient: any }>('/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePatient(patientId: string, data: Partial<{
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    email?: string;
    phone?: string;
  }>) {
    return this.request(`/patients/${patientId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Search
  async search(query: string, filters?: {
    patientId?: string;
    startDate?: string;
    endDate?: string;
    tags?: string[];
    sessionType?: string;
  }) {
    const params = new URLSearchParams({ q: query });
    if (filters?.patientId) params.append('patientId', filters.patientId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.tags) filters.tags.forEach(tag => params.append('tags', tag));
    if (filters?.sessionType) params.append('sessionType', filters.sessionType);

    return this.request(`/search?${params.toString()}`);
  }
}

export const api = new ApiClient(API_BASE_URL);
