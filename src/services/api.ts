import { ScrapingJob, HealthStatus, LeadRecord, DashboardStats } from '../types';

// ============ CONFIGURABLE BACKEND URL ============
const DEFAULT_BACKEND_URL = 'http://127.0.0.1:8766';
const STORAGE_KEY = 'itcyber_backend_url';

function getStoredBackendUrl(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored.startsWith('http')) return stored.replace(/\/$/, '');
  } catch { /* ignore */ }

  // Also check URL params: ?backend=https://my-backend.com
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('backend');
    if (fromUrl && fromUrl.startsWith('http')) return fromUrl.replace(/\/$/, '');
  } catch { /* ignore */ }

  return DEFAULT_BACKEND_URL;
}

let BACKEND_URL = getStoredBackendUrl();

export function setBackendUrl(url: string): void {
  BACKEND_URL = url.replace(/\/$/, '');
  try { localStorage.setItem(STORAGE_KEY, BACKEND_URL); } catch { /* ignore */ }
}

export function getBackendUrl(): string {
  return BACKEND_URL;
}

export function resetBackendUrl(): void {
  BACKEND_URL = DEFAULT_BACKEND_URL;
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

// ============ CONNECTION STATE ============
let _demoMode = false;
let _healthCheckInterval: ReturnType<typeof setInterval> | null = null;
let _onConnectionChange: ((connected: boolean) => void) | null = null;

export function isDemoMode(): boolean { return _demoMode; }
export function setDemoMode(value: boolean): void { _demoMode = value; }

export function onConnectionChange(cb: (connected: boolean) => void) {
  _onConnectionChange = cb;
}

// ============ HEALTH CHECK ============
export async function checkHealth(): Promise<HealthStatus> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${BACKEND_URL}/api/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const wasDemo = _demoMode;
      _demoMode = false;
      if (wasDemo && _onConnectionChange) _onConnectionChange(true);
      return { ...data, demo_mode: false };
    }
    throw new Error(`HTTP ${response.status}`);
  } catch (err: any) {
    const wasLive = !_demoMode;
    _demoMode = true;
    if (wasLive && _onConnectionChange) _onConnectionChange(false);

    const message = err.name === 'AbortError'
      ? 'Connection timeout (4s)'
      : err.message?.includes('Failed to fetch')
        ? 'Backend unreachable (CORS or offline)'
        : err.message || 'Unknown error';

    return {
      ok: false,
      status: 'offline',
      version: 'N/A',
      python: 'N/A',
      scraper_ready: false,
      playwright_importable: false,
      output_directory_writable: false,
      demo_mode: true,
      connection_error: message,
    } as HealthStatus & { connection_error: string };
  }
}

export function startHealthPolling(intervalMs: number = 5000) {
  if (_healthCheckInterval) return;
  _healthCheckInterval = setInterval(checkHealth, intervalMs);
}

export function stopHealthPolling() {
  if (_healthCheckInterval) { clearInterval(_healthCheckInterval); _healthCheckInterval = null; }
}

// ============ JOBS API ============
async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const url = `${BACKEND_URL}${path}`;
  try {
    return await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
  } catch (err: any) {
    if (_demoMode) throw err;
    throw new Error(`Cannot reach backend at ${BACKEND_URL}. ${err.message}`);
  }
}

export async function createJob(params: {
  query: string; target: number;
  enrichment: 'none' | 'website' | 'full';
  format: 'csv' | 'xlsx' | 'json';
}): Promise<ScrapingJob> {
  if (_demoMode) return createDemoJob(params);

  const response = await apiFetch('/api/jobs', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(err.error || err.message || `Failed to create job`);
  }
  return response.json();
}

export async function getJobs(): Promise<ScrapingJob[]> {
  if (_demoMode) return _demoJobs;
  const response = await apiFetch('/api/jobs');
  if (!response.ok) throw new Error(`Failed to fetch jobs: HTTP ${response.status}`);
  return response.json();
}

export async function getJob(id: string): Promise<ScrapingJob> {
  if (_demoMode) {
    const job = _demoJobs.find(j => j.id === id);
    if (!job) throw new Error('Job not found');
    return job;
  }
  const response = await apiFetch(`/api/jobs/${id}`);
  if (!response.ok) throw new Error(`Failed to fetch job: HTTP ${response.status}`);
  return response.json();
}

export async function stopJob(id: string): Promise<void> {
  if (_demoMode) {
    const job = _demoJobs.find(j => j.id === id);
    if (job) {
      job.status = 'stopped';
      job.completed_at = new Date().toISOString();
      job.progress.stage = 'stopped';
      job.progress.message = `Stopped. ${job.results_count} leads preserved.`;
    }
    return;
  }
  const response = await apiFetch(`/api/jobs/${id}/stop`, { method: 'POST' });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(err.error || 'Failed to stop job');
  }
}

export async function getJobResults(id: string): Promise<LeadRecord[]> {
  if (_demoMode) return _demoLeads;
  const response = await apiFetch(`/api/jobs/${id}/results`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(err.error || 'Failed to fetch results');
  }
  return response.json();
}

export async function getDashboardStats(): Promise<DashboardStats> {
  if (_demoMode) {
    return {
      total_jobs: _demoJobs.length,
      running_jobs: _demoJobs.filter(j => j.status === 'running').length,
      completed_jobs: _demoJobs.filter(j => ['completed', 'stopped', 'partial'].includes(j.status)).length,
      total_leads: _demoJobs.reduce((s, j) => s + j.results_count, 0),
    };
  }
  const jobs = await getJobs();
  return {
    total_jobs: jobs.length,
    running_jobs: jobs.filter(j => j.status === 'running').length,
    completed_jobs: jobs.filter(j => ['completed', 'stopped', 'partial'].includes(j.status)).length,
    total_leads: jobs.reduce((s, j) => s + j.results_count, 0),
  };
}

export function getDownloadUrl(jobId: string, format: string): string {
  if (_demoMode) return '#';
  return `${BACKEND_URL}/api/jobs/${jobId}/download?format=${format}`;
}

export async function getDiagnostics(): Promise<any> {
  if (_demoMode) return null;
  try {
    const response = await apiFetch('/api/diagnostics');
    if (!response.ok) return null;
    return response.json();
  } catch { return null; }
}

// ============ BACKEND FILES ZIP DOWNLOAD ============
export async function downloadBackendZip(): Promise<void> {
  const JSZip = (await import('jszip')).default;
  const { saveAs } = await import('file-saver');

  const zip = new JSZip();
  const backendFolder = zip.folder('itcyber-backend');
  if (!backendFolder) throw new Error('Failed to create zip folder');

  const files = [
    'dashboard_server.py',
    'connected_scraper.py',
    'universal_query.py',
    'location_planner.py',
    'contact_utils.py',
    'requirements.txt',
    'tests.py',
    'Dockerfile',
    'Procfile',
    'README.md',
  ];

  for (const filename of files) {
    try {
      const response = await fetch(`/backend/${filename}`);
      if (response.ok) {
        const content = await response.text();
        backendFolder.file(filename, content);
      }
    } catch (err) {
      console.warn(`Could not fetch ${filename}:`, err);
    }
  }

  // Add a quick start script
  const startScript = `# ITCYBER Backend Quick Start
# ==========================

# 1. Create virtual environment
python -m venv .venv

# 2. Activate it
# Windows PowerShell:
.\\.venv\\Scripts\\Activate.ps1
# Windows CMD:
.venv\\Scripts\\activate.bat
# Linux/Mac:
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Install Playwright browser
python -m playwright install chromium

# 5. Start the server
python dashboard_server.py --host 127.0.0.1 --port 8766 --no-open

# 6. Open dashboard
# http://127.0.0.1:5173
`;
  backendFolder.file('START_HERE.txt', startScript);

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, 'itcyber-backend.zip');
}

// ============ DEMO MODE DATA ============
let _demoJobs: ScrapingJob[] = [];
let _demoLeads: LeadRecord[] = [];

const DEMO_LEADS: LeadRecord[] = [
  { business_name: "Civil Hospital Pusad", category: "Government Hospital", google_address: "Civil Hospital Rd, Pusad, Maharashtra 445204", consolidated_addresses: "Civil Hospital Rd, Pusad, Yavatmal, Maharashtra 445204", google_phone: "+91 7234 222 100", consolidated_phones: "+91 7234 222 100", public_emails: "", official_website: "", facebook_url: "", instagram_url: "", linkedin_url: "", rating: "3.8", review_count: "45", business_status: "Open", hours: "Open 24 hours", latitude: "19.8345", longitude: "77.6167", google_maps_url: "https://maps.google.com/?cid=12345", google_query: "hospitals in Pusad", google_status: "found", website_status: "not_checked", social_status: "not_checked", pages_scanned: "0", connection_method: "google_maps", record_status: "verified", error_message: "", quality_score: "72", verification_status: "high", matched_query: "hospitals in Pusad", collected_at: new Date().toISOString() },
  { business_name: "Rural Hospital Pusad", category: "Rural Hospital", google_address: "Station Rd, Pusad, Maharashtra 445204", consolidated_addresses: "Station Rd, Pusad, Yavatmal, Maharashtra 445204", google_phone: "+91 7234 223 200", consolidated_phones: "+91 7234 223 200", public_emails: "", official_website: "", facebook_url: "", instagram_url: "", linkedin_url: "", rating: "3.5", review_count: "28", business_status: "Open", hours: "Open 24 hours", latitude: "19.8389", longitude: "77.6201", google_maps_url: "https://maps.google.com/?cid=12346", google_query: "hospitals in Pusad", google_status: "found", website_status: "not_checked", social_status: "not_checked", pages_scanned: "0", connection_method: "google_maps", record_status: "verified", error_message: "", quality_score: "68", verification_status: "high", matched_query: "hospitals in Pusad", collected_at: new Date().toISOString() },
  { business_name: "Pusad Multispeciality Hospital", category: "Multispeciality Hospital", google_address: "Main Rd, Pusad, Maharashtra 445204", consolidated_addresses: "Main Rd, Pusad, Yavatmal, Maharashtra 445204", google_phone: "+91 7234 224 300", consolidated_phones: "+91 7234 224 300", public_emails: "info@pusadmulti.com", official_website: "https://pusadmultispeciality.com", facebook_url: "https://facebook.com/pusadmulti", instagram_url: "", linkedin_url: "", rating: "4.2", review_count: "156", business_status: "Open", hours: "Open 24 hours", latitude: "19.8312", longitude: "77.6145", google_maps_url: "https://maps.google.com/?cid=12347", google_query: "hospitals in Pusad", google_status: "found", website_status: "checked", social_status: "partial", pages_scanned: "3", connection_method: "google_maps+website", record_status: "verified", error_message: "", quality_score: "89", verification_status: "high", matched_query: "hospitals in Pusad", collected_at: new Date().toISOString() },
  { business_name: "District Hospital Yavatmal", category: "Government Hospital", google_address: "Hospital Rd, Yavatmal, Maharashtra 445001", consolidated_addresses: "Hospital Rd, Yavatmal, Maharashtra 445001", google_phone: "+91 7232 234 100", consolidated_phones: "+91 7232 234 100", public_emails: "", official_website: "", facebook_url: "", instagram_url: "", linkedin_url: "", rating: "3.6", review_count: "89", business_status: "Open", hours: "Open 24 hours", latitude: "20.3897", longitude: "78.1247", google_maps_url: "https://maps.google.com/?cid=12348", google_query: "government hospitals in Yavatmal district", google_status: "found", website_status: "not_checked", social_status: "not_checked", pages_scanned: "0", connection_method: "google_maps", record_status: "verified", error_message: "", quality_score: "70", verification_status: "high", matched_query: "government hospitals in Yavatmal district", collected_at: new Date().toISOString() },
  { business_name: "City Care Hospital", category: "General Hospital", google_address: "Tilak Rd, Pusad, Maharashtra 445204", consolidated_addresses: "Tilak Rd, Pusad, Yavatmal, Maharashtra 445204", google_phone: "+91 7234 225 400", consolidated_phones: "+91 7234 225 400", public_emails: "contact@citycare.in", official_website: "https://citycarehospital.in", facebook_url: "https://facebook.com/citycarepusad", instagram_url: "https://instagram.com/citycarepusad", linkedin_url: "", rating: "4.0", review_count: "67", business_status: "Open", hours: "Mon-Sat: 8AM-10PM", latitude: "19.8356", longitude: "77.6189", google_maps_url: "https://maps.google.com/?cid=12349", google_query: "hospitals in Pusad", google_status: "found", website_status: "checked", social_status: "checked", pages_scanned: "5", connection_method: "google_maps+website+social", record_status: "verified", error_message: "", quality_score: "92", verification_status: "high", matched_query: "hospitals in Pusad", collected_at: new Date().toISOString() },
  { business_name: "Apollo Children's Hospital", category: "Children's Hospital", google_address: "Nerlha Rd, Pusad, Maharashtra 445204", consolidated_addresses: "Nerlha Rd, Pusad, Yavatmal, Maharashtra 445204", google_phone: "+91 7234 226 500", consolidated_phones: "+91 7234 226 500", public_emails: "", official_website: "", facebook_url: "", instagram_url: "", linkedin_url: "", rating: "4.5", review_count: "234", business_status: "Open", hours: "Open 24 hours", latitude: "19.8378", longitude: "77.6134", google_maps_url: "https://maps.google.com/?cid=12350", google_query: "hospitals in Pusad", google_status: "found", website_status: "not_checked", social_status: "not_checked", pages_scanned: "0", connection_method: "google_maps", record_status: "verified", error_message: "", quality_score: "75", verification_status: "medium", matched_query: "hospitals in Pusad", collected_at: new Date().toISOString() },
];

function extractCategory(query: string): string {
  const m = query.match(/(.+?)\s+(?:in|near|around|mdhi|madhe|madhye|mein)\s+/i);
  if (m) return m[1].trim();
  return query.split(/\s+/).slice(0, 2).join(' ');
}

function extractLocation(query: string): string {
  const m = query.match(/(?:in|near|around|mdhi|madhe|madhye|mein)\s+(.+)/i);
  if (m) return m[1].trim();
  const words = query.split(/\s+/);
  return words.length > 2 ? words.slice(-2).join(' ') : '';
}

function createDemoJob(params: { query: string; target: number; enrichment: 'none' | 'website' | 'full'; format: 'csv' | 'xlsx' | 'json' }): ScrapingJob {
  const job: ScrapingJob = {
    id: `demo-${Date.now()}`,
    query: params.query,
    parsed_category: extractCategory(params.query),
    parsed_location: extractLocation(params.query),
    target: params.target,
    enrichment: params.enrichment,
    format: params.format,
    status: 'running',
    created_at: new Date().toISOString(),
    started_at: new Date().toISOString(),
    progress: { stage: 'initializing', candidates_found: 0, candidates_processed: 0, accepted_results: 0, requested_target: params.target, percent: 0, current_query: params.query, warnings: ['Demo mode — start backend for live scraping'], message: 'Demo: simulating scraping...' },
    results_count: 0,
  };
  _demoJobs.unshift(job);
  simulateDemoProgress(job, params);
  return job;
}

function simulateDemoProgress(job: ScrapingJob, params: { query: string; target: number }) {
  const stages = [
    { stage: 'browser_start', delay: 800, message: 'Starting Chromium...' },
    { stage: 'maps_navigation', delay: 1200, message: 'Navigating to Google Maps...' },
    { stage: 'searching', delay: 1500, message: `Searching: "${params.query}"` },
    { stage: 'discovering', delay: 2000, message: 'Discovering businesses...' },
    { stage: 'collecting', delay: 1000, message: 'Collecting details...' },
  ];
  let totalDelay = 0;
  const target = Math.min(params.target, 6);

  stages.forEach((s, i) => {
    totalDelay += s.delay;
    setTimeout(() => { job.progress.stage = s.stage; job.progress.message = s.message; job.progress.percent = Math.round(((i + 1) / (stages.length + target)) * 100); }, totalDelay);
  });

  for (let i = 0; i < target; i++) {
    totalDelay += 600 + Math.random() * 800;
    setTimeout(() => {
      job.progress.candidates_found = i + 2;
      job.progress.candidates_processed = i + 1;
      job.progress.accepted_results = i + 1;
      job.progress.percent = Math.round(((stages.length + i + 1) / (stages.length + target)) * 100);
      job.results_count = i + 1;
      _demoLeads = DEMO_LEADS.slice(0, i + 1);
    }, totalDelay);
  }

  totalDelay += 1500;
  setTimeout(() => {
    job.status = 'completed';
    job.completed_at = new Date().toISOString();
    job.progress.stage = 'completed';
    job.progress.message = `Demo complete: ${target} leads`;
    job.progress.percent = 100;
    job.results_count = target;
    _demoLeads = DEMO_LEADS.slice(0, target);
  }, totalDelay);
}
