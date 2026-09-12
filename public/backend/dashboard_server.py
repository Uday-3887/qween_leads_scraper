"""
ITCYBER Lead Scraper - Dashboard API Server
=============================================
Flask-based API server for managing scraping jobs.

Usage:
    python dashboard_server.py --host 127.0.0.1 --port 8766 --no-open

Endpoints:
    GET  /api/health              - Health check
    GET  /api/jobs                - List all jobs
    POST /api/jobs                - Create new job
    GET  /api/jobs/<id>           - Get job details
    POST /api/jobs/<id>/stop      - Stop a running job
    GET  /api/jobs/<id>/results   - Get job results
    GET  /api/jobs/<id>/download  - Download results file
"""

import argparse
import json
import logging
import os
import signal
import subprocess
import sys
import threading
import time
import uuid
from datetime import datetime
from pathlib import Path

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('dashboard_server.log', encoding='utf-8'),
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# CORS configuration
ALLOWED_ORIGINS = os.environ.get(
    'ITCYBER_ALLOWED_ORIGINS',
    'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,https://itcyber.vercel.app'
).split(',')

CORS(app, origins=ALLOWED_ORIGINS, supports_credentials=True, methods=['GET', 'POST', 'OPTIONS'])

# Configuration
BASE_DIR = Path(__file__).parent
OUTPUT_DIR = BASE_DIR / 'output'
JOBS_FILE = BASE_DIR / 'jobs.json'
SCRAPER_SCRIPT = BASE_DIR / 'connected_scraper.py'

OUTPUT_DIR.mkdir(exist_ok=True)

# Job manager
class JobManager:
    def __init__(self):
        self.jobs = {}
        self.processes = {}
        self.lock = threading.Lock()
        self._load_jobs()

    def _load_jobs(self):
        """Load jobs from persistent storage."""
        try:
            if JOBS_FILE.exists():
                with open(JOBS_FILE, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.jobs = data.get('jobs', {})
                    # Mark any running jobs as interrupted
                    for job_id, job in self.jobs.items():
                        if job.get('status') == 'running':
                            job['status'] = 'interrupted'
                            job['error_message'] = 'Server restarted while job was running'
                logger.info(f"Loaded {len(self.jobs)} jobs from storage")
        except (json.JSONDecodeError, IOError) as e:
            logger.warning(f"Could not load jobs file: {e}")
            self.jobs = {}

    def _save_jobs(self):
        """Atomically save jobs to persistent storage."""
        try:
            temp_file = JOBS_FILE.with_suffix('.tmp')
            with open(temp_file, 'w', encoding='utf-8') as f:
                json.dump({'jobs': self.jobs, 'updated_at': datetime.now().isoformat()}, f, indent=2, default=str)
            # Atomic replace
            if JOBS_FILE.exists():
                JOBS_FILE.unlink()
            temp_file.rename(JOBS_FILE)
        except (IOError, OSError) as e:
            logger.warning(f"Could not save jobs file: {e}")

    def create_job(self, params):
        """Create a new scraping job."""
        job_id = str(uuid.uuid4())[:12]
        now = datetime.now().isoformat()

        job = {
            'id': job_id,
            'query': params.get('query', ''),
            'target': min(int(params.get('target', 50)), 2000),
            'enrichment': params.get('enrichment', 'none'),
            'format': params.get('format', 'csv'),
            'status': 'pending',
            'created_at': now,
            'started_at': None,
            'completed_at': None,
            'progress': {
                'stage': 'pending',
                'candidates_found': 0,
                'candidates_processed': 0,
                'accepted_results': 0,
                'requested_target': min(int(params.get('target', 50)), 2000),
                'percent': 0,
                'current_query': params.get('query', ''),
                'warnings': [],
                'message': 'Job created, waiting to start...',
            },
            'results_count': 0,
            'output_file': None,
            'error_message': None,
            'log_file': None,
        }

        with self.lock:
            self.jobs[job_id] = job
            self._save_jobs()

        # Start the job in a subprocess
        self._start_job(job_id)
        return job

    def _start_job(self, job_id):
        """Start a scraping job as a subprocess."""
        job = self.jobs[job_id]
        output_file = OUTPUT_DIR / f"job_{job_id}.{job['format']}"
        log_file = OUTPUT_DIR / f"job_{job_id}.log"

        job['status'] = 'running'
        job['started_at'] = datetime.now().isoformat()
        job['output_file'] = str(output_file)
        job['log_file'] = str(log_file)
        job['progress']['stage'] = 'initializing'
        job['progress']['message'] = 'Starting scraper subprocess...'

        cmd = [
            sys.executable,
            str(SCRAPER_SCRIPT),
            '--query', job['query'],
            '--target', str(job['target']),
            '--enrichment', job['enrichment'],
            '--format', job['format'],
            '--output', str(output_file),
            '--job-id', job_id,
        ]

        try:
            with open(log_file, 'w', encoding='utf-8') as log_f:
                process = subprocess.Popen(
                    cmd,
                    stdout=log_f,
                    stderr=subprocess.STDOUT,
                    cwd=str(BASE_DIR),
                    creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if sys.platform == 'win32' else 0,
                )
            self.processes[job_id] = process
            logger.info(f"Started scraper process {process.pid} for job {job_id}")

            # Start monitoring thread
            monitor = threading.Thread(target=self._monitor_job, args=(job_id,), daemon=True)
            monitor.start()
        except Exception as e:
            job['status'] = 'failed'
            job['error_message'] = f'Failed to start process: {str(e)}'
            job['completed_at'] = datetime.now().isoformat()
            logger.error(f"Failed to start job {job_id}: {e}")

        with self.lock:
            self._save_jobs()

    def _monitor_job(self, job_id):
        """Monitor a running job subprocess."""
        process = self.processes.get(job_id)
        if not process:
            return

        process.wait()
        job = self.jobs.get(job_id)
        if not job:
            return

        with self.lock:
            if job['status'] == 'running':
                if process.returncode == 0:
                    job['status'] = 'completed'
                    job['progress']['stage'] = 'completed'
                    job['progress']['percent'] = 100
                    job['progress']['message'] = f"Completed: {job['results_count']} leads collected"
                elif process.returncode == -1 or job.get('stop_requested'):
                    job['status'] = 'stopped'
                    job['progress']['stage'] = 'stopped'
                    job['progress']['message'] = f"Stopped by user. {job['results_count']} leads preserved."
                else:
                    job['status'] = 'failed'
                    job['error_message'] = f'Process exited with code {process.returncode}'

                job['completed_at'] = datetime.now().isoformat()

                # Parse log for final results count
                self._parse_log_for_results(job_id)
                self._save_jobs()

        logger.info(f"Job {job_id} finished with status: {job['status']}")

    def _parse_log_for_results(self, job_id):
        """Parse the log file to extract final results count."""
        job = self.jobs.get(job_id)
        if not job or not job.get('log_file'):
            return

        try:
            log_path = Path(job['log_file'])
            if log_path.exists():
                content = log_path.read_text(encoding='utf-8', errors='replace')
                # Count accepted results from log
                accepted = content.count('Accepted')
                if accepted > 0:
                    job['results_count'] = max(job['results_count'], accepted)
                    job['progress']['accepted_results'] = job['results_count']
        except Exception as e:
            logger.warning(f"Could not parse log for job {job_id}: {e}")

    def stop_job(self, job_id):
        """Stop a running job."""
        job = self.jobs.get(job_id)
        if not job:
            return {'error': 'Job not found'}, 404

        if job['status'] != 'running':
            return {'error': 'Job is not running'}, 400

        job['stop_requested'] = True
        process = self.processes.get(job_id)
        if process:
            try:
                if sys.platform == 'win32':
                    # On Windows, terminate the process tree
                    subprocess.run(
                        ['taskkill', '/F', '/T', '/PID', str(process.pid)],
                        capture_output=True
                    )
                else:
                    process.terminate()
                    try:
                        process.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        process.kill()
            except Exception as e:
                logger.warning(f"Error stopping process for job {job_id}: {e}")

        with self.lock:
            self._save_jobs()

        return {'message': 'Stop requested'}, 200

    def get_job(self, job_id):
        """Get job details."""
        job = self.jobs.get(job_id)
        if not job:
            return None
        return job

    def get_all_jobs(self):
        """Get all jobs sorted by creation date."""
        return sorted(
            self.jobs.values(),
            key=lambda j: j.get('created_at', ''),
            reverse=True
        )

    def get_results(self, job_id):
        """Get results for a job."""
        job = self.jobs.get(job_id)
        if not job:
            return None

        output_file = job.get('output_file')
        if not output_file or not Path(output_file).exists():
            return []

        fmt = job.get('format', 'csv')
        try:
            if fmt == 'csv':
                return self._read_csv(output_file)
            elif fmt == 'json':
                return self._read_json(output_file)
            elif fmt == 'xlsx':
                return self._read_xlsx(output_file)
        except Exception as e:
            logger.error(f"Error reading results for job {job_id}: {e}")
            return []

        return []

    def _read_csv(self, filepath):
        """Read CSV file and return list of dicts."""
        import csv
        results = []
        with open(filepath, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                results.append(dict(row))
        return results

    def _read_json(self, filepath):
        """Read JSON file and return list of dicts."""
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        if isinstance(data, list):
            return data
        return data.get('results', [])

    def _read_xlsx(self, filepath):
        """Read XLSX file and return list of dicts."""
        try:
            from openpyxl import load_workbook
            wb = load_workbook(filepath, read_only=True)
            ws = wb.active
            rows = list(ws.iter_rows(values_only=True))
            if len(rows) < 2:
                return []
            headers = [str(h) if h else f'col_{i}' for i, h in enumerate(rows[0])]
            results = []
            for row in rows[1:]:
                results.append(dict(zip(headers, [str(v) if v is not None else '' for v in row])))
            wb.close()
            return results
        except ImportError:
            logger.error("openpyxl not installed, cannot read XLSX")
            return []

    def get_download_file(self, job_id):
        """Get the output file for download."""
        job = self.jobs.get(job_id)
        if not job:
            return None
        output_file = job.get('output_file')
        if not output_file or not Path(output_file).exists():
            return None
        return output_file


# Initialize job manager
job_manager = JobManager()


# ============ API ROUTES ============

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint."""
    import platform
    scraper_ready = SCRAPER_SCRIPT.exists()
    playwright_ok = False
    try:
        import playwright
        playwright_ok = True
    except ImportError:
        pass

    return jsonify({
        'ok': True,
        'status': 'online',
        'version': '2.0.0',
        'python': platform.python_version(),
        'scraper_ready': scraper_ready,
        'playwright_importable': playwright_ok,
        'output_directory_writable': os.access(str(OUTPUT_DIR), os.W_OK),
    })


@app.route('/api/jobs', methods=['GET'])
def list_jobs():
    """List all jobs."""
    jobs = job_manager.get_all_jobs()
    return jsonify(jobs)


@app.route('/api/jobs', methods=['POST'])
def create_job():
    """Create a new scraping job."""
    data = request.get_json()
    if not data or not data.get('query'):
        return jsonify({'error': 'Query is required'}), 400

    # Check if there's already a running job
    running = [j for j in job_manager.jobs.values() if j['status'] == 'running']
    if running:
        return jsonify({
            'error': 'A job is already running. Stop it first or wait for completion.',
            'running_job_id': running[0]['id']
        }), 409

    job = job_manager.create_job(data)
    return jsonify(job), 201


@app.route('/api/jobs/<job_id>', methods=['GET'])
def get_job(job_id):
    """Get job details."""
    job = job_manager.get_job(job_id)
    if not job:
        return jsonify({'error': 'Job not found', 'code': 'JOB_NOT_FOUND'}), 404
    return jsonify(job)


@app.route('/api/jobs/<job_id>/stop', methods=['POST'])
def stop_job(job_id):
    """Stop a running job."""
    result, status = job_manager.stop_job(job_id)
    return jsonify(result), status


@app.route('/api/jobs/<job_id>/results', methods=['GET'])
def get_results(job_id):
    """Get job results."""
    job = job_manager.get_job(job_id)
    if not job:
        return jsonify({'error': 'Job not found', 'code': 'JOB_NOT_FOUND'}), 404

    results = job_manager.get_results(job_id)
    if results is None:
        return jsonify({
            'error': 'Results not ready yet',
            'code': 'RESULT_NOT_READY',
            'job_status': job['status']
        }), 404

    return jsonify(results)


@app.route('/api/jobs/<job_id>/download', methods=['GET'])
def download(job_id):
    """Download job results file."""
    filepath = job_manager.get_download_file(job_id)
    if not filepath:
        return jsonify({
            'error': 'Output file not available',
            'code': 'FILE_NOT_FOUND'
        }), 404

    mime_types = {
        'csv': 'text/csv',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'json': 'application/json',
    }

    job = job_manager.get_job(job_id)
    fmt = job.get('format', 'csv') if job else 'csv'

    return send_file(
        filepath,
        mimetype=mime_types.get(fmt, 'application/octet-stream'),
        as_attachment=True,
        download_name=f"leads_{job_id}.{fmt}"
    )


@app.route('/api/diagnostics', methods=['GET'])
def diagnostics():
    """Deep diagnostics endpoint."""
    import platform

    diag = {
        'platform': platform.platform(),
        'python': platform.python_version(),
        'python_path': sys.executable,
        'cwd': str(Path.cwd()),
        'base_dir': str(BASE_DIR),
        'output_dir': str(OUTPUT_DIR),
        'output_dir_exists': OUTPUT_DIR.exists(),
        'output_dir_writable': os.access(str(OUTPUT_DIR), os.W_OK),
        'scraper_exists': SCRAPER_SCRIPT.exists(),
        'jobs_count': len(job_manager.jobs),
        'running_jobs': len([j for j in job_manager.jobs.values() if j['status'] == 'running']),
    }

    # Check Playwright
    try:
        from playwright.sync_api import sync_playwright
        diag['playwright_importable'] = True
        # Try to check if chromium is installed
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                browser.close()
                diag['chromium_launchable'] = True
        except Exception as e:
            diag['chromium_launchable'] = False
            diag['chromium_error'] = str(e)
    except ImportError:
        diag['playwright_importable'] = False

    return jsonify(diag)


def main():
    parser = argparse.ArgumentParser(description='ITCYBER Dashboard API Server')
    parser.add_argument('--host', default=os.environ.get('HOST', '127.0.0.1'), help='Host to bind to')
    parser.add_argument('--port', type=int, default=int(os.environ.get('PORT', 8766)), help='Port to listen on')
    parser.add_argument('--no-open', action='store_true', help='Do not open browser')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode')
    args = parser.parse_args()

    print(f"""
╔══════════════════════════════════════════════════════╗
║         ITCYBER Lead Scraper API Server v2.0        ║
╠══════════════════════════════════════════════════════╣
║  URL:    http://{args.host}:{args.port}                    ║
║  Health: http://{args.host}:{args.port}/api/health          ║
║  Debug:  {'Yes' if args.debug else 'No'}                                      ║
╚══════════════════════════════════════════════════════╝
    """)

    app.run(
        host=args.host,
        port=args.port,
        debug=args.debug,
        use_reloader=False,
    )


if __name__ == '__main__':
    main()
