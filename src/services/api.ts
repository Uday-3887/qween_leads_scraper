import { ScrapingJob, HealthStatus, LeadRecord, DashboardStats } from '../types';

const BACKEND_URL = 'http://127.0.0.1:8766';

let demoMode = false;
let demoJobs: ScrapingJob[] = [];
let demoLeads: LeadRecord[] = [];

// Demo data for when backend is not available
const DEMO_LEADS: LeadRecord[] = [
  {
    business_name: "Civil Hospital Pusad",
    category: "Government Hospital",
    google_address: "Civil Hospital Rd, Pusad, Maharashtra 445204",
    consolidated_addresses: "Civil Hospital Rd, Pusad, Yavatmal, Maharashtra 445204",
    google_phone: "+91 7234 222 100",
    consolidated_phones: "+91 7234 222 100",
    public_emails: "",
    official_website: "",
    facebook_url: "",
    instagram_url: "",
    linkedin_url: "",
    rating: "3.8",
    review_count: "45",
    business_status: "Open",
    hours: "Open 24 hours",
    latitude: "19.8345",
    longitude: "77.6167",
    google_maps_url: "https://maps.google.com/?cid=12345",
    google_query: "hospitals in Pusad",
    google_status: "found",
    website_status: "not_checked",
    social_status: "not_checked",
    pages_scanned: "0",
    connection_method: "google_maps",
    record_status: "verified",
    error_message: "",
    quality_score: "72",
    verification_status: "high",
    matched_query: "hospitals in Pusad",
    collected_at: new Date().toISOString()
  },
  {
    business_name: "Rural Hospital Pusad",
    category: "Rural Hospital",
    google_address: "Station Rd, Pusad, Maharashtra 445204",
    consolidated_addresses: "Station Rd, Pusad, Yavatmal, Maharashtra 445204",
    google_phone: "+91 7234 223 200",
    consolidated_phones: "+91 7234 223 200",
    public_emails: "",
    official_website: "",
    facebook_url: "",
    instagram_url: "",
    linkedin_url: "",
    rating: "3.5",
    review_count: "28",
    business_status: "Open",
    hours: "Open 24 hours",
    latitude: "19.8389",
    longitude: "77.6201",
    google_maps_url: "https://maps.google.com/?cid=12346",
    google_query: "hospitals in Pusad",
    google_status: "found",
    website_status: "not_checked",
    social_status: "not_checked",
    pages_scanned: "0",
    connection_method: "google_maps",
    record_status: "verified",
    error_message: "",
    quality_score: "68",
    verification_status: "high",
    matched_query: "hospitals in Pusad",
    collected_at: new Date().toISOString()
  },
  {
    business_name: "Pusad Multispeciality Hospital",
    category: "Multispeciality Hospital",
    google_address: "Main Rd, Near Bus Stand, Pusad, Maharashtra 445204",
    consolidated_addresses: "Main Rd, Near Bus Stand, Pusad, Yavatmal, Maharashtra 445204",
    google_phone: "+91 7234 224 300",
    consolidated_phones: "+91 7234 224 300",
    public_emails: "info@pusadmultispeciality.com",
    official_website: "https://pusadmultispeciality.com",
    facebook_url: "https://facebook.com/pusadmultispeciality",
    instagram_url: "",
    linkedin_url: "",
    rating: "4.2",
    review_count: "156",
    business_status: "Open",
    hours: "Open 24 hours",
    latitude: "19.8312",
    longitude: "77.6145",
    google_maps_url: "https://maps.google.com/?cid=12347",
    google_query: "hospitals in Pusad",
    google_status: "found",
    website_status: "checked",
    social_status: "partial",
    pages_scanned: "3",
    connection_method: "google_maps+website",
    record_status: "verified",
    error_message: "",
    quality_score: "89",
    verification_status: "high",
    matched_query: "hospitals in Pusad",
    collected_at: new Date().toISOString()
  },
  {
    business_name: "District General Hospital Yavatmal",
    category: "Government Hospital",
    google_address: "Hospital Rd, Yavatmal, Maharashtra 445001",
    consolidated_addresses: "Hospital Rd, Yavatmal, Maharashtra 445001",
    google_phone: "+91 7232 234 100",
    consolidated_phones: "+91 7232 234 100",
    public_emails: "",
    official_website: "",
    facebook_url: "",
    instagram_url: "",
    linkedin_url: "",
    rating: "3.6",
    review_count: "89",
    business_status: "Open",
    hours: "Open 24 hours",
    latitude: "20.3897",
    longitude: "78.1247",
    google_maps_url: "https://maps.google.com/?cid=12348",
    google_query: "government hospitals in Yavatmal district",
    google_status: "found",
    website_status: "not_checked",
    social_status: "not_checked",
    pages_scanned: "0",
    connection_method: "google_maps",
    record_status: "verified",
    error_message: "",
    quality_score: "70",
    verification_status: "high",
    matched_query: "government hospitals in Yavatmal district",
    collected_at: new Date().toISOString()
  },
  {
    business_name: "City Care Hospital",
    category: "General Hospital",
    google_address: "Tilak Rd, Pusad, Maharashtra 445204",
    consolidated_addresses: "Tilak Rd, Pusad, Yavatmal, Maharashtra 445204",
    google_phone: "+91 7234 225 400",
    consolidated_phones: "+91 7234 225 400",
    public_emails: "contact@citycarehospital.in",
    official_website: "https://citycarehospital.in",
    facebook_url: "https://facebook.com/citycarepusad",
    instagram_url: "https://instagram.com/citycarepusad",
    linkedin_url: "",
    rating: "4.0",
    review_count: "67",
    business_status: "Open",
    hours: "Mon-Sat: 8AM-10PM, Sun: 9AM-6PM",
    latitude: "19.8356",
    longitude: "77.6189",
    google_maps_url: "https://maps.google.com/?cid=12349",
    google_query: "hospitals in Pusad",
    google_status: "found",
    website_status: "checked",
    social_status: "checked",
    pages_scanned: "5",
    connection_method: "google_maps+website+social",
    record_status: "verified",
    error_message: "",
    quality_score: "92",
    verification_status: "high",
    matched_query: "hospitals in Pusad",
    collected_at: new Date().toISOString()
  },
  {
    business_name: "Apollo Children's Hospital",
    category: "Children's Hospital",
    google_address: "Nerlha Rd, Pusad, Maharashtra 445204",
    consolidated_addresses: "Nerlha Rd, Pusad, Yavatmal, Maharashtra 445204",
    google_phone: "+91 7234 226 500",
    consolidated_phones: "+91 7234 226 500",
    public_emails: "",
    official_website: "",
    facebook_url: "",
    instagram_url: "",
    linkedin_url: "",
    rating: "4.5",
    review_count: "234",
    business_status: "Open",
    hours: "Open 24 hours",
    latitude: "19.8378",
    longitude: "77.6134",
    google_maps_url: "https://maps.google.com/?cid=12350",
    google_query: "hospitals in Pusad",
    google_status: "found",
    website_status: "not_checked",
    social_status: "not_checked",
    pages_scanned: "0",
    connection_method: "google_maps",
    record_status: "verified",
    error_message: "",
    quality_score: "75",
    verification_status: "medium",
    matched_query: "hospitals in Pusad",
    collected_at: new Date().toISOString()
  }
];

export function isDemoMode(): boolean {
  return demoMode;
}

export function setDemoMode(value: boolean): void {
  demoMode = value;
}

export async function checkHealth(): Promise<HealthStatus> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    if (response.ok) {
      const data = await response.json();
      demoMode = false;
      return { ...data, demo_mode: false };
    }
    throw new Error('Health check failed');
  } catch {
    demoMode = true;
    return {
      ok: true,
      status: 'demo',
      version: '2.0.0-demo',
      python: 'N/A',
      scraper_ready: false,
      playwright_importable: false,
      output_directory_writable: false,
      demo_mode: true,
    };
  }
}

export async function createJob(params: {
  query: string;
  target: number;
  enrichment: 'none' | 'website' | 'full';
  format: 'csv' | 'xlsx' | 'json';
}): Promise<ScrapingJob> {
  if (demoMode) {
    return createDemoJob(params);
  }

  const response = await fetch(`${BACKEND_URL}/api/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || 'Failed to create job');
  }

  return response.json();
}

function createDemoJob(params: {
  query: string;
  target: number;
  enrichment: 'none' | 'website' | 'full';
  format: 'csv' | 'xlsx' | 'json';
}): ScrapingJob {
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
    progress: {
      stage: 'initializing',
      candidates_found: 0,
      candidates_processed: 0,
      accepted_results: 0,
      requested_target: params.target,
      percent: 0,
      current_query: params.query,
      warnings: [],
      message: 'Starting browser and initializing scraper...',
    },
    results_count: 0,
  };

  demoJobs.unshift(job);
  simulateDemoProgress(job, params);
  return job;
}

function extractCategory(query: string): string {
  const patterns = [
    /(.+?)\s+(?:in|near|around|mdhi|madhe|madhye)\s+/i,
    /^(.+?)\s+(?:in|near|around)\s+/i,
  ];
  for (const p of patterns) {
    const m = query.match(p);
    if (m) return m[1].trim();
  }
  return query.split(/\s+/).slice(0, 2).join(' ');
}

function extractLocation(query: string): string {
  const patterns = [
    /(?:in|near|around|mdhi|madhe|madhye)\s+(.+)/i,
    /(.+)\s+(?:mdhi|madhe|madhye)/i,
  ];
  for (const p of patterns) {
    const m = query.match(p);
    if (m) return m[1].trim();
  }
  const words = query.split(/\s+/);
  if (words.length > 2) return words.slice(-2).join(' ');
  return '';
}

function simulateDemoProgress(job: ScrapingJob, params: { query: string; target: number; enrichment: string }) {
  const stages = [
    { stage: 'browser_start', delay: 800, message: 'Starting Chromium browser...' },
    { stage: 'maps_navigation', delay: 1200, message: 'Navigating to Google Maps...' },
    { stage: 'searching', delay: 1500, message: `Searching: "${params.query}"` },
    { stage: 'discovering', delay: 2000, message: 'Discovering businesses from Maps results...' },
    { stage: 'collecting', delay: 1000, message: 'Collecting business details...' },
  ];

  let totalDelay = 0;
  const target = Math.min(params.target, 6);

  stages.forEach((s, i) => {
    totalDelay += s.delay;
    setTimeout(() => {
      job.progress.stage = s.stage;
      job.progress.message = s.message;
      job.progress.percent = Math.round(((i + 1) / (stages.length + target)) * 100);
    }, totalDelay);
  });

  for (let i = 0; i < target; i++) {
    totalDelay += 600 + Math.random() * 800;
    setTimeout(() => {
      job.progress.candidates_found = i + 2;
      job.progress.candidates_processed = i + 1;
      job.progress.accepted_results = i + 1;
      job.progress.current_query = params.query;
      job.progress.percent = Math.round(((stages.length + i + 1) / (stages.length + target)) * 100);
      job.results_count = i + 1;
      demoLeads = DEMO_LEADS.slice(0, i + 1);
    }, totalDelay);
  }

  totalDelay += 1500;
  setTimeout(() => {
    job.status = 'completed';
    job.completed_at = new Date().toISOString();
    job.progress.stage = 'completed';
    job.progress.message = `Completed: ${target} leads collected`;
    job.progress.percent = 100;
    job.results_count = target;
    demoLeads = DEMO_LEADS.slice(0, target);
  }, totalDelay);
}

export async function getJobs(): Promise<ScrapingJob[]> {
  if (demoMode) {
    return demoJobs;
  }

  const response = await fetch(`${BACKEND_URL}/api/jobs`);
  if (!response.ok) throw new Error('Failed to fetch jobs');
  return response.json();
}

export async function getJob(id: string): Promise<ScrapingJob> {
  if (demoMode) {
    const job = demoJobs.find(j => j.id === id);
    if (!job) throw new Error('Job not found');
    return job;
  }

  const response = await fetch(`${BACKEND_URL}/api/jobs/${id}`);
  if (!response.ok) throw new Error('Failed to fetch job');
  return response.json();
}

export async function stopJob(id: string): Promise<void> {
  if (demoMode) {
    const job = demoJobs.find(j => j.id === id);
    if (job) {
      job.status = 'stopped';
      job.completed_at = new Date().toISOString();
      job.progress.stage = 'stopped';
      job.progress.message = `Stopped by user. ${job.results_count} leads preserved.`;
    }
    return;
  }

  const response = await fetch(`${BACKEND_URL}/api/jobs/${id}/stop`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed to stop job');
}

export async function getJobResults(id: string): Promise<LeadRecord[]> {
  if (demoMode) {
    return demoLeads;
  }

  const response = await fetch(`${BACKEND_URL}/api/jobs/${id}/results`);
  if (!response.ok) throw new Error('Failed to fetch results');
  return response.json();
}

export async function getDashboardStats(): Promise<DashboardStats> {
  if (demoMode) {
    const running = demoJobs.filter(j => j.status === 'running').length;
    const completed = demoJobs.filter(j => j.status === 'completed' || j.status === 'stopped').length;
    const totalLeads = demoJobs.reduce((sum, j) => sum + j.results_count, 0);
    return {
      total_jobs: demoJobs.length,
      running_jobs: running,
      completed_jobs: completed,
      total_leads: totalLeads,
    };
  }

  const jobs = await getJobs();
  const running = jobs.filter(j => j.status === 'running').length;
  const completed = jobs.filter(j => j.status === 'completed' || j.status === 'stopped' || j.status === 'partial').length;
  const totalLeads = jobs.reduce((sum, j) => sum + j.results_count, 0);
  return {
    total_jobs: jobs.length,
    running_jobs: running,
    completed_jobs: completed,
    total_leads: totalLeads,
  };
}

export function getDownloadUrl(jobId: string, format: string): string {
  if (demoMode) {
    return '#';
  }
  return `${BACKEND_URL}/api/jobs/${jobId}/download?format=${format}`;
}
