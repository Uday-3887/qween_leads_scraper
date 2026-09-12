import { useState, useEffect, useCallback, useRef } from 'react';
import { PageView, ScrapingJob, HealthStatus, LeadRecord } from './types';
import {
  checkHealth,
  createJob,
  getJobs,
  stopJob,
  getJobResults,
  getDownloadUrl,
  isDemoMode,
  getBackendUrl,
  setBackendUrl,
  resetBackendUrl,
  startHealthPolling,
  stopHealthPolling,
} from './services/api';

// ============ ICONS ============
const Icon = {
  Dashboard: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  Search: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Database: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>,
  Settings: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Play: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Stop: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>,
  Download: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
  Check: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  Warning: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>,
  Globe: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Logs: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  Server: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>,
  Copy: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  Refresh: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
};

// ============ MAIN APP ============
export default function App() {
  const [currentPage, setCurrentPage] = useState<PageView>('dashboard');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [jobs, setJobs] = useState<ScrapingJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<ScrapingJob | null>(null);
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initial health check
  useEffect(() => {
    const doCheck = async () => {
      const h = await checkHealth();
      setHealth(h);
      setConnectionStatus(h.demo_mode ? 'disconnected' : 'connected');
    };
    doCheck();
    startHealthPolling(5000);

    // Also poll health to update status
    const statusPoll = setInterval(async () => {
      const h = await checkHealth();
      setHealth(h);
      setConnectionStatus(h.demo_mode ? 'disconnected' : 'connected');
    }, 5000);

    return () => {
      stopHealthPolling();
      clearInterval(statusPoll);
    };
  }, []);

  // Poll jobs
  useEffect(() => {
    const loadJobs = async () => {
      try {
        const data = await getJobs();
        setJobs(data);
        if (selectedJob) {
          const updated = data.find(j => j.id === selectedJob.id);
          if (updated) setSelectedJob(updated);
        }
      } catch { /* silent */ }
    };
    loadJobs();
    pollRef.current = setInterval(loadJobs, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedJob]);

  const notify = useCallback((type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  const handleStartScrape = useCallback(async (params: { query: string; target: number; enrichment: 'none' | 'website' | 'full'; format: 'csv' | 'xlsx' | 'json' }) => {
    setIsLoading(true);
    try {
      const job = await createJob(params);
      setSelectedJob(job);
      setJobs(prev => [job, ...prev]);
      setCurrentPage('dashboard');
      if (isDemoMode()) {
        notify('warning', `Demo job started. Start backend for live scraping.`);
      } else {
        notify('success', `Live scraping started: ${job.id}`);
      }
    } catch (err: any) {
      notify('error', err.message || 'Failed to start job');
    } finally {
      setIsLoading(false);
    }
  }, [notify]);

  const handleStopJob = useCallback(async (jobId: string) => {
    try {
      await stopJob(jobId);
      notify('warning', 'Job stop requested. Partial data preserved.');
      const updated = await getJobs();
      setJobs(updated);
    } catch (err: any) {
      notify('error', err.message || 'Failed to stop job');
    }
  }, [notify]);

  const handleLoadResults = useCallback(async (jobId: string) => {
    setIsLoading(true);
    try {
      const results = await getJobResults(jobId);
      setLeads(results);
      setCurrentPage('leads');
    } catch (err: any) {
      notify('error', err.message || 'Failed to load results');
    } finally {
      setIsLoading(false);
    }
  }, [notify]);

  const filteredLeads = leads.filter(lead => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      lead.business_name?.toLowerCase().includes(q) ||
      lead.category?.toLowerCase().includes(q) ||
      lead.google_address?.toLowerCase().includes(q) ||
      lead.google_phone?.toLowerCase().includes(q) ||
      lead.official_website?.toLowerCase().includes(q)
    );
  });

  const isLive = connectionStatus === 'connected';

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-slide-in ${
          notification.type === 'success' ? 'bg-green-600' :
          notification.type === 'error' ? 'bg-red-600' :
          notification.type === 'warning' ? 'bg-amber-600' : 'bg-blue-600'
        } text-white`}>
          {notification.type === 'success' ? <Icon.Check /> : <Icon.Warning />}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Icon.Globe />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">ITCYBER</h1>
              <p className="text-xs text-gray-400">Lead Scraper v2.0</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {([
            { id: 'dashboard', label: 'Dashboard', icon: <Icon.Dashboard /> },
            { id: 'scrape', label: 'New Scrape', icon: <Icon.Search /> },
            { id: 'leads', label: 'Lead Database', icon: <Icon.Database /> },
            { id: 'logs', label: 'Activity Logs', icon: <Icon.Logs /> },
            { id: 'setup', label: 'Backend Setup', icon: <Icon.Server /> },
            { id: 'settings', label: 'Settings', icon: <Icon.Settings /> },
          ] as { id: PageView; label: string; icon: React.ReactNode }[]).map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                currentPage === item.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
              {item.id === 'setup' && !isLive && (
                <span className="ml-auto w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          ))}
        </nav>

        {/* Connection Status */}
        <div className="p-4 border-t border-gray-700 space-y-2">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-400 shadow-sm shadow-green-400/50' :
              connectionStatus === 'checking' ? 'bg-yellow-400 animate-pulse' :
              'bg-red-400'
            }`} />
            <span className="text-xs font-medium text-gray-300">
              {connectionStatus === 'connected' ? 'Backend Live' :
               connectionStatus === 'checking' ? 'Checking...' : 'Backend Offline'}
            </span>
          </div>
          <div className="text-xs text-gray-500 space-y-0.5">
            <p>Frontend: 127.0.0.1:5173</p>
            <p>Backend: {getBackendUrl()}</p>
          </div>
          {!isLive && (
            <button
              onClick={() => setCurrentPage('setup')}
              className="w-full mt-2 px-3 py-1.5 bg-amber-600/20 border border-amber-600/40 text-amber-400 text-xs rounded-lg hover:bg-amber-600/30 transition-colors"
            >
              Setup Backend →
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Connection Banner */}
        {!isLive && connectionStatus !== 'checking' && (
          <div className="bg-gradient-to-r from-amber-900/40 to-orange-900/40 border-b border-amber-700/40 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon.Warning />
              <div>
                <p className="text-sm font-medium text-amber-200">Backend Not Connected</p>
                <p className="text-xs text-amber-400/80">Start the Python backend for live Google Maps scraping. Currently in demo mode.</p>
              </div>
            </div>
            <button
              onClick={() => setCurrentPage('setup')}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-sm rounded-lg font-medium transition-colors"
            >
              Setup Guide
            </button>
          </div>
        )}

        {isLive && (
          <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-b border-green-700/30 px-6 py-2 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <p className="text-xs text-green-300 font-medium">
              Live Connection — Backend v{health?.version || '2.0'} | Python {health?.python || '3.x'} | Scraper {health?.scraper_ready ? '✓ Ready' : '✗ Not Ready'}
            </p>
          </div>
        )}

        {currentPage === 'dashboard' && (
          <DashboardPage jobs={jobs} selectedJob={selectedJob} onSelectJob={setSelectedJob} onStopJob={handleStopJob} onLoadResults={handleLoadResults} isLive={isLive} />
        )}
        {currentPage === 'scrape' && (
          <ScrapePage onStartScrape={handleStartScrape} isLoading={isLoading} isLive={isLive} />
        )}
        {currentPage === 'leads' && (
          <LeadsPage leads={filteredLeads} totalLeads={leads.length} searchQuery={searchQuery} onSearchChange={setSearchQuery} selectedJob={selectedJob} />
        )}
        {currentPage === 'logs' && (
          <LogsPage jobs={jobs} isLive={isLive} />
        )}
        {currentPage === 'setup' && (
          <SetupPage health={health} isLive={isLive} onRefresh={async () => { const h = await checkHealth(); setHealth(h); setConnectionStatus(h.demo_mode ? 'disconnected' : 'connected'); }} />
        )}
        {currentPage === 'settings' && (
          <SettingsPage health={health} isLive={isLive} />
        )}
      </main>
    </div>
  );
}

// ============ DASHBOARD PAGE ============
function DashboardPage({ jobs, selectedJob, onSelectJob, onStopJob, onLoadResults, isLive }: {
  jobs: ScrapingJob[]; selectedJob: ScrapingJob | null;
  onSelectJob: (j: ScrapingJob) => void; onStopJob: (id: string) => void;
  onLoadResults: (id: string) => void; isLive: boolean;
}) {
  const runningJobs = jobs.filter(j => j.status === 'running');
  const completedJobs = jobs.filter(j => ['completed', 'stopped', 'partial'].includes(j.status));
  const totalLeads = jobs.reduce((sum, j) => sum + j.results_count, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-gray-400 text-sm mt-1">
            {isLive ? 'Live scraping engine connected' : 'Demo mode — connect backend for live data'}
          </p>
        </div>
        <div className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
          isLive ? 'bg-green-600/20 border-green-600/40 text-green-400' : 'bg-amber-600/20 border-amber-600/40 text-amber-400'
        }`}>
          {isLive ? '🟢 LIVE ENGINE' : '🟡 DEMO MODE'}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Jobs" value={jobs.length} icon="📋" color="blue" />
        <StatCard title="Running" value={runningJobs.length} icon="⚡" color="green" />
        <StatCard title="Completed" value={completedJobs.length} icon="✅" color="purple" />
        <StatCard title="Total Leads" value={totalLeads} icon="🏢" color="orange" />
      </div>

      {/* Active Job */}
      {selectedJob && selectedJob.status === 'running' && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Active Job</h3>
              <p className="text-sm text-gray-400">{selectedJob.query}</p>
            </div>
            <button onClick={() => onStopJob(selectedJob.id)} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
              <Icon.Stop /> Stop
            </button>
          </div>
          <JobProgress job={selectedJob} />
        </div>
      )}

      {/* Jobs List */}
      <div className="bg-gray-800 rounded-xl border border-gray-700">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Recent Jobs</h3>
          <span className="text-xs text-gray-400">{jobs.length} total</span>
        </div>
        {jobs.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-lg mb-2">No jobs yet</p>
            <p className="text-sm">Start a new scraping job from the "New Scrape" tab</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700 max-h-96 overflow-y-auto">
            {jobs.map(job => (
              <JobRow key={job.id} job={job} isSelected={selectedJob?.id === job.id} onSelect={() => onSelectJob(job)} onStop={() => onStopJob(job.id)} onViewResults={() => onLoadResults(job.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'from-blue-600/20 to-blue-800/10 border-blue-600/30',
    green: 'from-green-600/20 to-green-800/10 border-green-600/30',
    purple: 'from-purple-600/20 to-purple-800/10 border-purple-600/30',
    orange: 'from-orange-600/20 to-orange-800/10 border-orange-600/30',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value.toLocaleString()}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

function JobProgress({ job }: { job: ScrapingJob }) {
  const { progress } = job;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">Stage: <span className="text-white font-medium capitalize">{progress.stage.replace(/_/g, ' ')}</span></span>
        <span className="text-blue-400 font-bold">{progress.percent}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-700 ease-out" style={{ width: `${Math.min(progress.percent, 100)}%` }} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div><span className="text-gray-400">Found</span><p className="text-white font-medium">{progress.candidates_found}</p></div>
        <div><span className="text-gray-400">Processed</span><p className="text-white font-medium">{progress.candidates_processed}</p></div>
        <div><span className="text-gray-400">Accepted</span><p className="text-green-400 font-bold">{progress.accepted_results}</p></div>
        <div><span className="text-gray-400">Target</span><p className="text-white font-medium">{progress.requested_target}</p></div>
      </div>
      {progress.message && <p className="text-xs text-gray-400 italic">{progress.message}</p>}
      {progress.warnings.length > 0 && (
        <div className="space-y-1">{progress.warnings.map((w, i) => <p key={i} className="text-xs text-amber-400">⚠️ {w}</p>)}</div>
      )}
    </div>
  );
}

function JobRow({ job, isSelected, onSelect, onStop, onViewResults }: {
  job: ScrapingJob; isSelected: boolean; onSelect: () => void; onStop: () => void; onViewResults: () => void;
}) {
  const statusColors: Record<string, string> = {
    running: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    completed: 'bg-green-500/20 text-green-400 border-green-500/30',
    stopped: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    partial: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    pending: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    interrupted: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  };

  return (
    <div className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${isSelected ? 'bg-gray-700/50' : 'hover:bg-gray-700/30'}`} onClick={onSelect}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium text-white truncate">{job.query}</p>
          <span className={`px-2 py-0.5 text-xs rounded-full border ${statusColors[job.status] || statusColors.pending}`}>{job.status}</span>
        </div>
        <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
          <span>ID: {job.id.slice(0, 12)}</span>
          <span>Target: {job.target}</span>
          <span>Results: {job.results_count}</span>
          <span>{job.format.toUpperCase()}</span>
          <span>{new Date(job.created_at).toLocaleString()}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4">
        {job.status === 'running' && (
          <button onClick={(e) => { e.stopPropagation(); onStop(); }} className="p-2 text-red-400 hover:bg-red-600/20 rounded-lg" title="Stop"><Icon.Stop /></button>
        )}
        {job.results_count > 0 && (
          <button onClick={(e) => { e.stopPropagation(); onViewResults(); }} className="p-2 text-blue-400 hover:bg-blue-600/20 rounded-lg" title="View results"><Icon.Database /></button>
        )}
      </div>
    </div>
  );
}

// ============ SCRAPE PAGE ============
function ScrapePage({ onStartScrape, isLoading, isLive }: {
  onStartScrape: (p: { query: string; target: number; enrichment: 'none' | 'website' | 'full'; format: 'csv' | 'xlsx' | 'json' }) => void;
  isLoading: boolean; isLive: boolean;
}) {
  const [query, setQuery] = useState('');
  const [target, setTarget] = useState(50);
  const [enrichment, setEnrichment] = useState<'none' | 'website' | 'full'>('none');
  const [format, setFormat] = useState<'csv' | 'xlsx' | 'json'>('csv');

  const examples = [
    'hospitals in Pusad', 'government hospitals in Yavatmal district',
    'restaurants in Pune', 'interior designers in Nagpur',
    'schools in Mumbai', 'car rentals in Yavatmal',
    'packers and movers in Amravati', 'solar panel dealers in Maharashtra',
    'computer institutes in Pusad', 'wedding photographers in Yavatmal',
    'medical stores in Pusad', 'gyms near Pune',
    'Pusad mdhi hospitals kiti ahe', 'banquet halls in Pusad',
    'tile adhesive dealers in Nagpur', 'RO water purifier shops in Pune',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onStartScrape({ query: query.trim(), target, enrichment, format });
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-white">New Scraping Job</h2>
        <p className="text-gray-400 text-sm mt-1">
          {isLive ? '🟢 Live engine ready — will scrape real Google Maps data' : '🟡 Demo mode — start backend for real scraping'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Search Query</label>
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., hospitals in Pusad, restaurants in Pune, solar dealers in Maharashtra"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base" />
            <p className="text-xs text-gray-500 mt-2">Supports English, Marathi (mdhi/madhe), Hindi/Hinglish. Any business category works.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Target Leads (1–2000)</label>
            <input type="range" min={1} max={2000} value={target} onChange={(e) => setTarget(Number(e.target.value))} className="w-full" />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-400">1</span>
              <span className="text-xl font-bold text-blue-400">{target}</span>
              <span className="text-xs text-gray-400">2000</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Enrichment Level</label>
            <div className="grid grid-cols-3 gap-3">
              {([
                { value: 'none', label: 'Maps Only', desc: 'Google Maps data' },
                { value: 'website', label: '+ Website', desc: 'Maps + website' },
                { value: 'full', label: 'Full', desc: 'Maps + website + social' },
              ] as const).map(opt => (
                <button key={opt.value} type="button" onClick={() => setEnrichment(opt.value)}
                  className={`p-3 rounded-lg border text-left transition-all ${enrichment === opt.value ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-gray-900 border-gray-600 text-gray-400 hover:border-gray-500'}`}>
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs mt-1 opacity-70">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Output Format</label>
            <div className="grid grid-cols-3 gap-3">
              {([
                { value: 'csv', label: 'CSV', desc: 'Universal' },
                { value: 'xlsx', label: 'XLSX', desc: 'Excel' },
                { value: 'json', label: 'JSON', desc: 'Developer' },
              ] as const).map(opt => (
                <button key={opt.value} type="button" onClick={() => setFormat(opt.value)}
                  className={`p-3 rounded-lg border text-left transition-all ${format === opt.value ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-gray-900 border-gray-600 text-gray-400 hover:border-gray-500'}`}>
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs mt-1 opacity-70">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={isLoading || !query.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-600/20 disabled:shadow-none">
            {isLoading ? (
              <><svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Starting...</>
            ) : (
              <><Icon.Play />{isLive ? 'Start Live Scraping' : 'Start Demo Scraping'}</>
            )}
          </button>
        </div>
      </form>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Example Queries (click to use)</h3>
        <div className="flex flex-wrap gap-2">
          {examples.map(ex => (
            <button key={ex} onClick={() => setQuery(ex)} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-full transition-colors">{ex}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ LEADS PAGE ============
function LeadsPage({ leads, totalLeads, searchQuery, onSearchChange, selectedJob }: {
  leads: LeadRecord[]; totalLeads: number; searchQuery: string;
  onSearchChange: (q: string) => void; selectedJob: ScrapingJob | null;
}) {
  const [viewFormat, setViewFormat] = useState<'table' | 'json'>('table');

  const downloadResults = () => {
    if (!selectedJob) return;
    const url = getDownloadUrl(selectedJob.id, selectedJob.format);
    if (url === '#') {
      const csvContent = leadsToCSV(leads);
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `leads_${selectedJob.id}.csv`;
      link.click();
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="p-6 space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Lead Database</h2>
          <p className="text-gray-400 text-sm mt-1">
            {totalLeads > 0 ? `${leads.length} of ${totalLeads} leads` : 'No leads loaded'}
            {selectedJob && ` — "${selectedJob.query}"`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setViewFormat(viewFormat === 'table' ? 'json' : 'table')} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg">
            {viewFormat === 'table' ? 'JSON View' : 'Table View'}
          </button>
          {totalLeads > 0 && (
            <button onClick={downloadResults} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
              <Icon.Download /> Download {selectedJob?.format?.toUpperCase() || 'CSV'}
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        <input type="text" value={searchQuery} onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search leads by name, category, address, phone..."
          className="w-full px-4 py-3 pl-10 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {totalLeads === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-4xl mb-4">📊</p>
            <p className="text-gray-400 text-lg">No leads loaded</p>
            <p className="text-gray-500 text-sm mt-2">Run a scraping job and view results from Dashboard</p>
          </div>
        </div>
      ) : viewFormat === 'table' ? (
        <div className="flex-1 overflow-auto bg-gray-800 rounded-xl border border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 sticky top-0 z-10">
                <tr>
                  {['#', 'Business Name', 'Category', 'Address', 'Phone', 'Website', 'Rating', 'Quality', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {leads.map((lead, i) => (
                  <tr key={i} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3 text-white font-medium max-w-[200px] truncate">{lead.business_name}</td>
                    <td className="px-4 py-3 text-gray-300 max-w-[150px] truncate">{lead.category}</td>
                    <td className="px-4 py-3 text-gray-400 max-w-[200px] truncate" title={lead.google_address}>{lead.google_address}</td>
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{lead.google_phone || '—'}</td>
                    <td className="px-4 py-3 max-w-[150px] truncate">
                      {lead.official_website ? <a href={lead.official_website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{safeHostname(lead.official_website)}</a> : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{lead.rating ? `⭐ ${lead.rating}` : '—'}</td>
                    <td className="px-4 py-3"><QualityBadge score={parseInt(lead.quality_score) || 0} /></td>
                    <td className="px-4 py-3"><StatusBadge status={lead.verification_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto bg-gray-800 rounded-xl border border-gray-700 p-4">
          <pre className="text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(leads, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

function safeHostname(url: string): string {
  try { return new URL(url).hostname; } catch { return url; }
}

function QualityBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-green-400 bg-green-400/10' : score >= 60 ? 'text-yellow-400 bg-yellow-400/10' : 'text-red-400 bg-red-400/10';
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>{score}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = { high: 'bg-green-400/10 text-green-400', medium: 'bg-yellow-400/10 text-yellow-400', basic: 'bg-gray-400/10 text-gray-400' };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] || colors.basic}`}>{status}</span>;
}

function leadsToCSV(leads: LeadRecord[]): string {
  if (leads.length === 0) return '';
  const headers = Object.keys(leads[0]);
  const rows = leads.map(lead => headers.map(h => `"${String((lead as any)[h] || '').replace(/"/g, '""')}"`).join(','));
  return [headers.join(','), ...rows].join('\n');
}

// ============ LOGS PAGE ============
function LogsPage({ jobs, isLive }: { jobs: ScrapingJob[]; isLive: boolean }) {
  const logs = generateLogs(jobs, isLive);
  return (
    <div className="p-6 space-y-4 h-full flex flex-col">
      <div>
        <h2 className="text-2xl font-bold text-white">Activity Logs</h2>
        <p className="text-gray-400 text-sm mt-1">System events and scraping activity</p>
      </div>
      <div className="flex-1 overflow-auto bg-gray-900 rounded-xl border border-gray-700 p-4 font-mono text-sm">
        {logs.length === 0 ? (
          <p className="text-gray-500">No activity yet.</p>
        ) : (
          <div className="space-y-1">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-gray-500 shrink-0">{log.time}</span>
                <span className={`shrink-0 ${log.level === 'error' ? 'text-red-400' : log.level === 'warning' ? 'text-amber-400' : log.level === 'success' ? 'text-green-400' : 'text-blue-400'}`}>
                  [{log.level.toUpperCase()}]
                </span>
                <span className="text-gray-300">{log.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function generateLogs(jobs: ScrapingJob[], isLive: boolean) {
  const logs: { time: string; level: string; message: string }[] = [];
  const now = new Date().toLocaleTimeString();

  logs.push({ time: now, level: 'info', message: 'ITCYBER Dashboard v2.0 loaded' });
  logs.push({ time: now, level: isLive ? 'success' : 'warning', message: isLive ? 'Backend connected — live scraping available' : 'Backend offline — demo mode active' });

  if (!isLive) {
    logs.push({ time: now, level: 'info', message: 'To enable live scraping, start the Python backend:' });
    logs.push({ time: now, level: 'info', message: '  cd backend && python dashboard_server.py --host 127.0.0.1 --port 8766' });
  }

  jobs.forEach(job => {
    const t = new Date(job.created_at).toLocaleTimeString();
    logs.push({ time: t, level: 'info', message: `Job created: "${job.query}" (target: ${job.target}, ${job.format})` });
    if (job.status === 'running') logs.push({ time: t, level: 'info', message: `Job running: stage=${job.progress.stage}, accepted=${job.progress.accepted_results}` });
    else if (job.status === 'completed') logs.push({ time: t, level: 'success', message: `Job completed: ${job.results_count} leads` });
    else if (job.status === 'stopped') logs.push({ time: t, level: 'warning', message: `Job stopped: ${job.results_count} leads preserved` });
    else if (job.status === 'failed') logs.push({ time: t, level: 'error', message: `Job failed: ${job.error_message || 'Unknown'}` });
  });

  return logs.reverse();
}

// ============ SETUP PAGE ============
function SetupPage({ health, isLive, onRefresh }: { health: HealthStatus | null; isLive: boolean; onRefresh: () => void }) {
  const [copied, setCopied] = useState<string | null>(null);
  const [backendUrlInput, setBackendUrlInput] = useState(getBackendUrl());
  const [urlSaved, setUrlSaved] = useState(false);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleSaveUrl = () => {
    const url = backendUrlInput.trim().replace(/\/$/, '');
    if (url.startsWith('http')) {
      setBackendUrl(url);
      setUrlSaved(true);
      setTimeout(() => setUrlSaved(false), 2000);
      onRefresh();
    }
  };

  const handleResetUrl = () => {
    resetBackendUrl();
    setBackendUrlInput('http://127.0.0.1:8766');
    onRefresh();
  };

  const backendFiles = [
    { name: 'dashboard_server.py', path: '/backend/dashboard_server.py', desc: 'Flask API server — job management, CORS, health checks' },
    { name: 'connected_scraper.py', path: '/backend/connected_scraper.py', desc: 'Playwright scraper — Google Maps discovery, dedup, checkpointing' },
    { name: 'universal_query.py', path: '/backend/universal_query.py', desc: 'Natural language query parser — English, Marathi, Hindi' },
    { name: 'location_planner.py', path: '/backend/location_planner.py', desc: 'Location expansion — district/city variants' },
    { name: 'contact_utils.py', path: '/backend/contact_utils.py', desc: 'Contact extraction — emails, phones, social links' },
    { name: 'requirements.txt', path: '/backend/requirements.txt', desc: 'Python dependencies' },
    { name: 'tests.py', path: '/backend/tests.py', desc: 'Unit tests for all modules' },
    { name: 'README.md', path: '/backend/README.md', desc: 'Backend documentation' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Backend Setup</h2>
          <p className="text-gray-400 text-sm mt-1">Connect the Python backend for live Google Maps scraping</p>
        </div>
        <button onClick={onRefresh} className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm">
          <Icon.Refresh /> Test Connection
        </button>
      </div>

      {/* Connection Status Card */}
      <div className={`rounded-xl border p-6 ${isLive ? 'bg-green-900/20 border-green-700/40' : 'bg-red-900/20 border-red-700/40'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-4 h-4 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          <h3 className={`text-lg font-bold ${isLive ? 'text-green-300' : 'text-red-300'}`}>
            {isLive ? '✅ Backend Connected & Live' : '❌ Backend Not Connected'}
          </h3>
        </div>
        {isLive ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-gray-400">Version:</span> <span className="text-white">{health?.version}</span></div>
            <div><span className="text-gray-400">Python:</span> <span className="text-white">{health?.python}</span></div>
            <div><span className="text-gray-400">Scraper:</span> <span className={health?.scraper_ready ? 'text-green-400' : 'text-red-400'}>{health?.scraper_ready ? '✓ Ready' : '✗ Missing'}</span></div>
            <div><span className="text-gray-400">Playwright:</span> <span className={health?.playwright_importable ? 'text-green-400' : 'text-red-400'}>{health?.playwright_importable ? '✓ Available' : '✗ Missing'}</span></div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-red-300 text-sm">The backend Python server is not running. Follow the steps below to start it.</p>
            <p className="text-gray-400 text-xs">Expected endpoint: <code className="bg-gray-800 px-1.5 py-0.5 rounded">http://127.0.0.1:8766/api/health</code></p>
          </div>
        )}
      </div>

      {/* Backend URL Configuration */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">🔗 Backend URL Configuration</h3>
        <p className="text-sm text-gray-400">Configure the backend API endpoint. Change this if your backend is running on a different host or port.</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={backendUrlInput}
            onChange={(e) => setBackendUrlInput(e.target.value)}
            placeholder="http://127.0.0.1:8766"
            className="flex-1 px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
          <button
            onClick={handleSaveUrl}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {urlSaved ? '✓ Saved' : 'Save'}
          </button>
          <button
            onClick={handleResetUrl}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm font-medium transition-colors"
          >
            Reset
          </button>
        </div>
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Current: <code className="text-blue-400">{getBackendUrl()}</code></p>
          <p>• Default: <code className="text-gray-400">http://127.0.0.1:8766</code></p>
          <p>• For deployed backend: <code className="text-gray-400">https://your-backend.railway.app</code></p>
          <p>• URL is saved in browser localStorage</p>
        </div>
      </div>

      {/* Deployment Options */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">🚀 Deployment Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <p className="text-blue-400 font-medium text-sm mb-2">Local Development</p>
            <p className="text-xs text-gray-400 mb-2">Run both frontend and backend locally</p>
            <CodeBlock id="deploy-local" code={`# Terminal 1: Backend
cd backend
python dashboard_server.py

# Terminal 2: Frontend
npm run dev`} copied={copied} onCopy={copyToClipboard} />
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <p className="text-green-400 font-medium text-sm mb-2">Docker (Full Stack)</p>
            <p className="text-xs text-gray-400 mb-2">Containerized deployment</p>
            <CodeBlock id="deploy-docker" code={`# Build and run
docker-compose up --build

# Or run separately
docker build -t itcyber-backend ./backend
docker run -p 8766:8766 itcyber-backend`} copied={copied} onCopy={copyToClipboard} />
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <p className="text-purple-400 font-medium text-sm mb-2">Cloud (Vercel + Railway)</p>
            <p className="text-xs text-gray-400 mb-2">Deploy frontend and backend separately</p>
            <CodeBlock id="deploy-cloud" code={`# Frontend: Vercel
vercel deploy

# Backend: Railway/Render
# Push backend/ folder to Git
# Connect repo to Railway/Render`} copied={copied} onCopy={copyToClipboard} />
          </div>
        </div>
        <div className="text-xs text-gray-400 mt-4 space-y-1">
          <p>📄 <strong>Deployment configs included:</strong></p>
          <ul className="list-disc list-inside ml-2 space-y-0.5">
            <li><code className="text-blue-400">vercel.json</code> — Frontend deployment to Vercel</li>
            <li><code className="text-blue-400">Dockerfile</code> — Backend containerization</li>
            <li><code className="text-blue-400">docker-compose.yml</code> — Full-stack local deployment</li>
            <li><code className="text-blue-400">Procfile</code> — PaaS deployment (Heroku/Render)</li>
          </ul>
        </div>
      </div>

      {/* Setup Steps */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-6">
        <h3 className="text-lg font-semibold text-white">📋 Setup Steps (Windows PowerShell)</h3>

        <Step number={1} title="Download Backend Files" description="Copy all backend files to a local folder.">
          <div className="space-y-2">
            {backendFiles.map(file => (
              <div key={file.name} className="flex items-center justify-between bg-gray-900 rounded-lg px-3 py-2">
                <div>
                  <span className="text-white text-sm font-medium">{file.name}</span>
                  <span className="text-gray-500 text-xs ml-2">— {file.desc}</span>
                </div>
                <a href={file.path} download className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded hover:bg-blue-600/30">
                  <Icon.Download />
                </a>
              </div>
            ))}
          </div>
        </Step>

        <Step number={2} title="Create Virtual Environment" description="Set up an isolated Python environment.">
          <CodeBlock id="step2" code={`cd backend
python -m venv .venv`} copied={copied} onCopy={copyToClipboard} />
        </Step>

        <Step number={3} title="Activate Environment" description="Activate the virtual environment.">
          <CodeBlock id="step3" code={`# Windows PowerShell:
.\\.venv\\Scripts\\Activate.ps1

# Windows CMD:
.venv\\Scripts\\activate.bat`} copied={copied} onCopy={copyToClipboard} />
        </Step>

        <Step number={4} title="Install Dependencies" description="Install Python packages and Playwright browser.">
          <CodeBlock id="step4" code={`python -m pip install --upgrade pip
pip install -r requirements.txt
python -m playwright install chromium`} copied={copied} onCopy={copyToClipboard} />
        </Step>

        <Step number={5} title="Start Backend Server" description="Launch the API server.">
          <CodeBlock id="step5" code={`python dashboard_server.py --host 127.0.0.1 --port 8766 --no-open`} copied={copied} onCopy={copyToClipboard} />
          <p className="text-xs text-gray-400 mt-2">Expected output: <code className="bg-gray-900 px-1 rounded">ITCYBER scraper API running at http://127.0.0.1:8766/</code></p>
        </Step>

        <Step number={6} title="Verify Connection" description="Check that the backend is reachable.">
          <CodeBlock id="step6" code={`# Open in browser or use curl:
http://127.0.0.1:8766/api/health

# Or test with PowerShell:
Invoke-RestMethod http://127.0.0.1:8766/api/health`} copied={copied} onCopy={copyToClipboard} />
          <p className="text-xs text-green-400 mt-2">Once connected, this dashboard will automatically switch to LIVE mode.</p>
        </Step>
      </div>

      {/* Architecture */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🏗️ Architecture</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <p className="text-blue-400 font-medium text-sm mb-2">Frontend (This Page)</p>
            <p className="text-xs text-gray-400">React + Vite + Tailwind</p>
            <p className="text-xs text-gray-400">Port: 5173</p>
            <p className="text-xs text-gray-400">Sends API requests to backend</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <p className="text-green-400 font-medium text-sm mb-2">Backend (Python)</p>
            <p className="text-xs text-gray-400">Flask API Server</p>
            <p className="text-xs text-gray-400">Port: 8766</p>
            <p className="text-xs text-gray-400">Manages jobs, spawns workers</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <p className="text-purple-400 font-medium text-sm mb-2">Scraper (Worker)</p>
            <p className="text-xs text-gray-400">Playwright + Chromium</p>
            <p className="text-xs text-gray-400">Google Maps discovery</p>
            <p className="text-xs text-gray-400">Runs as subprocess</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({ number, title, description, children }: { number: number; title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">{number}</span>
        <div>
          <p className="text-white font-medium">{title}</p>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
      </div>
      <div className="ml-10">{children}</div>
    </div>
  );
}

function CodeBlock({ id, code, copied, onCopy }: { id: string; code: string; copied: string | null; onCopy: (text: string, id: string) => void }) {
  return (
    <div className="relative bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      <pre className="p-3 text-sm text-green-400 overflow-x-auto whitespace-pre-wrap font-mono">{code}</pre>
      <button onClick={() => onCopy(code, id)} className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-400 hover:text-white transition-colors" title="Copy">
        {copied === id ? <Icon.Check /> : <Icon.Copy />}
      </button>
    </div>
  );
}

// ============ SETTINGS PAGE ============
function SettingsPage({ health, isLive }: { health: HealthStatus | null; isLive: boolean }) {
  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-white">Settings & System Info</h2>
        <p className="text-gray-400 text-sm mt-1">Backend configuration and diagnostics</p>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">Connection</h3>
        <div className="grid grid-cols-2 gap-4">
          <InfoRow label="Status" value={isLive ? '🟢 Connected' : '🔴 Offline'} />
          <InfoRow label="Backend URL" value="http://127.0.0.1:8766" />
          <InfoRow label="Frontend URL" value="http://127.0.0.1:5173" />
          <InfoRow label="Version" value={health?.version || 'N/A'} />
          <InfoRow label="Python" value={health?.python || 'N/A'} />
          <InfoRow label="Scraper Ready" value={health?.scraper_ready ? '✅ Yes' : '❌ No'} />
          <InfoRow label="Playwright" value={health?.playwright_importable ? '✅ Available' : '❌ Not Available'} />
          <InfoRow label="Output Dir" value={health?.output_directory_writable ? '✅ Writable' : '❌ Not Writable'} />
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">API Endpoints</h3>
        <div className="space-y-2 text-sm">
          {[
            { method: 'GET', path: '/api/health', desc: 'Health check' },
            { method: 'GET', path: '/api/jobs', desc: 'List all jobs' },
            { method: 'POST', path: '/api/jobs', desc: 'Create new job' },
            { method: 'GET', path: '/api/jobs/{id}', desc: 'Job details' },
            { method: 'POST', path: '/api/jobs/{id}/stop', desc: 'Stop running job' },
            { method: 'GET', path: '/api/jobs/{id}/results', desc: 'Get results' },
            { method: 'GET', path: '/api/jobs/{id}/download', desc: 'Download file' },
            { method: 'GET', path: '/api/diagnostics', desc: 'Deep diagnostics' },
          ].map(ep => (
            <div key={ep.path} className="flex items-center gap-3 py-1.5 border-b border-gray-700 last:border-0">
              <span className={`px-2 py-0.5 text-xs rounded font-mono ${ep.method === 'GET' ? 'bg-green-600/20 text-green-400' : 'bg-blue-600/20 text-blue-400'}`}>{ep.method}</span>
              <code className="text-gray-300 font-mono text-xs">{ep.path}</code>
              <span className="text-gray-500 text-xs ml-auto">{ep.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-3">
        <h3 className="text-lg font-semibold text-white">Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-300">
          <p>✅ Arbitrary category support</p>
          <p>✅ Natural language queries (EN/MR/HI)</p>
          <p>✅ Government qualifier enforcement</p>
          <p>✅ Multi-key deduplication</p>
          <p>✅ Atomic checkpoint saving</p>
          <p>✅ Browser crash recovery</p>
          <p>✅ CAPTCHA detection (no bypass)</p>
          <p>✅ CSV/XLSX/JSON output</p>
          <p>✅ Website contact enrichment</p>
          <p>✅ Social media discovery</p>
          <p>✅ Quality scoring (0-100)</p>
          <p>✅ Windows compatible</p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="text-white text-sm font-medium">{value}</span>
    </div>
  );
}
