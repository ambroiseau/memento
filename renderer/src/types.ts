export interface RenderJob {
  id: string;
  family_id: string;
  period_start: string;
  period_end: string;
  status: 'running' | 'succeeded' | 'failed';
  pdf_url?: string;
  page_count?: number;
  requested_by?: string;
  requested_at: string;
  finished_at?: string;
}

export interface RenderRequest {
  family_id: string;
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  requested_by?: string;
}

export interface RenderResponse {
  ok: boolean;
  pdf_url?: string;
  page_count?: number;
  error?: string;
}

export interface Post {
  id: string;
  content: string;
  created_at: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  images: Array<{
    id: string;
    url: string;
    alt_text?: string;
  }>;
}

export interface Family {
  id: string;
  name: string;
  avatar?: string;
}
