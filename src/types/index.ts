export interface ScrapingJob {
  id: string;
  query: string;
  parsed_category?: string;
  parsed_location?: string;
  target: number;
  enrichment: 'none' | 'website' | 'full';
  format: 'csv' | 'xlsx' | 'json';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'stopped' | 'partial' | 'interrupted';
  created_at: string;
  started_at?: string;
  completed_at?: string;
  progress: JobProgress;
  results_count: number;
  error_message?: string;
  output_file?: string;
}

export interface JobProgress {
  stage: string;
  candidates_found: number;
  candidates_processed: number;
  accepted_results: number;
  requested_target: number;
  percent: number;
  current_query?: string;
  warnings: string[];
  message?: string;
}

export interface LeadRecord {
  business_name: string;
  category: string;
  google_address: string;
  consolidated_addresses: string;
  google_phone: string;
  consolidated_phones: string;
  public_emails: string;
  official_website: string;
  facebook_url: string;
  instagram_url: string;
  linkedin_url: string;
  rating: string;
  review_count: string;
  business_status: string;
  hours: string;
  latitude: string;
  longitude: string;
  google_maps_url: string;
  google_query: string;
  google_status: string;
  website_status: string;
  social_status: string;
  pages_scanned: string;
  connection_method: string;
  record_status: string;
  error_message: string;
  quality_score: string;
  verification_status: string;
  matched_query: string;
  collected_at: string;
}

export interface HealthStatus {
  ok: boolean;
  status: string;
  version: string;
  python: string;
  scraper_ready: boolean;
  playwright_importable: boolean;
  output_directory_writable: boolean;
  demo_mode?: boolean;
  connection_error?: string;
}

export interface DashboardStats {
  total_jobs: number;
  running_jobs: number;
  completed_jobs: number;
  total_leads: number;
  active_query?: string;
}

export type PageView = 'dashboard' | 'scrape' | 'leads' | 'settings' | 'logs' | 'setup';

export interface ConnectionInfo {
  connected: boolean;
  backendUrl: string;
  lastCheck: number;
  error?: string;
  version?: string;
  python?: string;
  playwright?: boolean;
  chromium?: boolean;
}
