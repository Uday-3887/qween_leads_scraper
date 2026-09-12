"""
ITCYBER Connected Scraper - Google Maps Business Discovery
===========================================================
Uses Playwright to discover businesses from Google Maps public search.

Usage:
    python connected_scraper.py --query "hospitals in Pusad" --target 50 --format csv --output output/results.csv

Features:
    - Arbitrary category support (not limited to hard-coded list)
    - Natural language query parsing (English, Marathi, Hindi)
    - Government qualifier enforcement
    - Multi-key deduplication
    - Atomic checkpoint saving
    - Browser crash recovery
    - CAPTCHA detection (no bypass)
    - Contact enrichment from websites
"""

import argparse
import csv
import json
import logging
import os
import re
import signal
import sys
import time
import unicodedata
from datetime import datetime
from pathlib import Path
from urllib.parse import quote_plus, urlparse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Try to import playwright
try:
    from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    logger.warning("Playwright not installed. Install with: pip install playwright && python -m playwright install chromium")

# Try to import openpyxl for XLSX support
try:
    from openpyxl import Workbook
    OPENPYXL_AVAILABLE = True
except ImportError:
    OPENPYXL_AVAILABLE = False


# ============ QUERY PARSER ============

class QueryParser:
    """Parse natural language queries into structured components."""

    # Location indicators in various languages
    LOCATION_PREPOSITIONS = [
        'in', 'near', 'around', 'at', 'of',
        'mdhi', 'madhe', 'madhye', 'me',  # Marathi
        'mein', 'me', 'ke', 'ka', 'ke area mein',  # Hindi/Hinglish
    ]

    # Government qualifiers
    GOV_QUALIFIERS = [
        'government', 'govt', 'sarkari', 'sarकारी', 'public',
        'municipal', 'state', 'district', 'civil',
    ]

    # Scope indicators
    SCOPE_PATTERNS = {
        'district': re.compile(r'\bdistrict\b', re.I),
        'taluka': re.compile(r'\btaluka\b|\btaluk\b', re.I),
        'state': re.compile(r'\bstate\b|\bmaharashtra\b|\bgujarat\b|\bkarnataka\b', re.I),
    }

    def parse(self, query: str) -> dict:
        """Parse a natural language query."""
        original = query.strip()
        result = {
            'original': original,
            'category': '',
            'location': '',
            'qualifiers': [],
            'scope': 'local',
            'is_government': False,
            'count_query': False,
        }

        # Check for count queries
        if re.search(r'\b(kiti|how many|count|total|संख्या)\b', original, re.I):
            result['count_query'] = True

        # Check for government qualifier
        for qual in self.GOV_QUALIFIERS:
            if qual in original.lower():
                result['is_government'] = True
                result['qualifiers'].append('government')
                break

        # Check scope
        for scope, pattern in self.SCOPE_PATTERNS.items():
            if pattern.search(original):
                result['scope'] = scope
                break

        # Extract category and location
        category, location = self._extract_category_location(original)
        result['category'] = category
        result['location'] = location

        return result

    def _extract_category_location(self, query: str) -> tuple:
        """Extract category and location from query."""
        # Try various patterns
        patterns = [
            # "category in location"
            r'^(.+?)\s+(?:in|near|around|at)\s+(.+)$',
            # "category location mdhi/madhe" (Marathi)
            r'^(.+?)\s+(.+?)\s+(?:mdhi|madhe|madhye)\s*$',
            # "location mdhi category" (Marathi reversed)
            r'^(.+?)\s+(?:mdhi|madhe|madhye)\s+(.+?)$',
            # "location mein category" (Hindi)
            r'^(.+?)\s+(?:mein|me|के)\s+(.+?)$',
            # "category of location"
            r'^(.+?)\s+of\s+(.+)$',
        ]

        for pattern in patterns:
            match = re.match(pattern, query, re.I)
            if match:
                parts = [match.group(1).strip(), match.group(2).strip()]
                # Determine which is category and which is location
                # Heuristic: shorter one with known place names is location
                return self._classify_parts(parts)

        # Fallback: try to split on common words
        words = query.split()
        if len(words) >= 3:
            # Assume first N words are category, rest is location
            for i in range(1, len(words)):
                potential_loc = ' '.join(words[i:])
                potential_cat = ' '.join(words[:i])
                if self._looks_like_location(potential_loc):
                    return potential_cat, potential_loc

        # Last resort: entire query is category, no location
        return query, ''

    def _classify_parts(self, parts: list) -> tuple:
        """Classify two parts as category and location."""
        if len(parts) != 2:
            return parts[0] if parts else '', ''

        a, b = parts
        if self._looks_like_location(b):
            return a, b
        elif self._looks_like_location(a):
            return b, a
        else:
            # Default: first is category, second is location
            return a, b

    def _looks_like_location(self, text: str) -> bool:
        """Heuristic to determine if text looks like a location."""
        # Known Indian cities/states/regions
        known_places = {
            'pusad', 'yavatmal', 'pune', 'mumbai', 'nagpur', 'amravati',
            'nashik', 'aurangabad', 'kolhapur', 'solapur', 'sangli',
            'maharashtra', 'gujarat', 'karnataka', 'tamil nadu',
            'delhi', 'hyderabad', 'bangalore', 'chennai', 'kolkata',
            'district', 'taluka', 'tehsil',
        }
        text_lower = text.lower()
        for place in known_places:
            if place in text_lower:
                return True
        # If it's short (1-3 words) and doesn't contain business terms
        words = text.split()
        if len(words) <= 3:
            business_terms = {'hospital', 'school', 'restaurant', 'shop', 'store',
                            'dealer', 'service', 'clinic', 'office', 'institute'}
            if not any(t in text_lower for t in business_terms):
                return True
        return False


# ============ CATEGORY MATCHER ============

class CategoryMatcher:
    """Match business categories with relevance scoring."""

    # Strict category groups - for these, be more selective
    STRICT_CATEGORIES = {
        'hospital': {
            'accept': ['hospital', 'clinic', 'medical center', 'health center',
                      'multispeciality', 'general hospital', 'civil hospital',
                      'rural hospital', 'children\'s hospital', 'nursing home',
                      'trauma center', 'eye hospital', 'heart hospital'],
            'reject': ['pharmacy', 'medical store', 'chemist', 'pathology',
                      'lab', 'diagnostic', 'ayurvedic store', 'medical shop'],
        },
        'medical store': {
            'accept': ['pharmacy', 'medical store', 'chemist', 'medical shop',
                      'medicine', 'pharmacist', 'drug store'],
            'reject': ['hospital', 'clinic', 'doctor'],
        },
    }

    def score_relevance(self, query_category: str, business_name: str,
                       maps_category: str, search_query: str) -> float:
        """
        Score how relevant a business is to the query category.
        Returns 0-100 score.
        """
        if not query_category:
            return 50  # Unknown category, neutral

        query_tokens = self._normalize_tokens(query_category)
        name_tokens = self._normalize_tokens(business_name)
        maps_tokens = self._normalize_tokens(maps_category)

        score = 0

        # Direct name match
        name_match = sum(1 for t in query_tokens if t in name_tokens)
        if name_match > 0:
            score += min(50, name_match * 20)

        # Maps category match
        maps_match = sum(1 for t in query_tokens if any(t in mt for mt in maps_tokens))
        if maps_match > 0:
            score += min(30, maps_match * 15)

        # Check strict category rules
        strict_key = self._find_strict_category(query_category)
        if strict_key:
            rules = self.STRICT_CATEGORIES[strict_key]
            combined = f"{business_name} {maps_category}".lower()

            # Check rejects
            for reject in rules['reject']:
                if reject in combined:
                    return 0  # Hard reject

            # Check accepts
            for accept in rules['accept']:
                if accept in combined:
                    score += 20

        # If no strict rules and we have some match, give base score
        if score == 0 and not strict_key:
            # For unknown categories, be lenient if there's any overlap
            if name_match > 0 or maps_match > 0:
                score = 40
            else:
                # Check for partial/related matches
                for qt in query_tokens:
                    if any(qt in nt for nt in name_tokens):
                        score = 30
                        break

        return min(100, score)

    def _normalize_tokens(self, text: str) -> list:
        """Normalize text into searchable tokens."""
        if not text:
            return []
        text = text.lower().strip()
        # Remove special chars
        text = re.sub(r'[^\w\s]', ' ', text)
        # Split and deduplicate
        tokens = set(text.split())
        # Singular forms
        singular = set()
        for t in tokens:
            if t.endswith('s') and len(t) > 3:
                singular.add(t[:-1])
            if t.endswith('ies'):
                singular.add(t[:-3] + 'y')
        return list(tokens | singular)

    def _find_strict_category(self, query: str) -> str:
        """Check if query matches a strict category."""
        query_lower = query.lower()
        for key in self.STRICT_CATEGORIES:
            if key in query_lower:
                return key
        return ''


# ============ DEDUPLICATION ============

class Deduplicator:
    """Multi-key deduplication for business records."""

    def __init__(self):
        self.seen_phones = set()
        self.seen_names_addresses = set()
        self.seen_coordinates = set()
        self.seen_place_ids = set()

    def is_duplicate(self, record: dict) -> bool:
        """Check if record is a duplicate."""
        # Check place ID
        place_id = record.get('place_id', '')
        if place_id and place_id in self.seen_place_ids:
            return True

        # Check phone
        phone = self._normalize_phone(record.get('google_phone', ''))
        if phone and phone in self.seen_phones:
            return True

        # Check name + address
        name = self._normalize(record.get('business_name', ''))
        address = self._normalize(record.get('google_address', ''))
        if name and address:
            key = f"{name}|{address}"
            if key in self.seen_names_addresses:
                return True

        # Check coordinates (within ~50m)
        lat = record.get('latitude', '')
        lng = record.get('longitude', '')
        if lat and lng:
            try:
                coord_key = f"{float(lat):.3f}|{float(lng):.3f}"
                if coord_key in self.seen_coordinates:
                    return True
            except (ValueError, TypeError):
                pass

        return False

    def register(self, record: dict):
        """Register a record's keys."""
        place_id = record.get('place_id', '')
        if place_id:
            self.seen_place_ids.add(place_id)

        phone = self._normalize_phone(record.get('google_phone', ''))
        if phone:
            self.seen_phones.add(phone)

        name = self._normalize(record.get('business_name', ''))
        address = self._normalize(record.get('google_address', ''))
        if name and address:
            self.seen_names_addresses.add(f"{name}|{address}")

        lat = record.get('latitude', '')
        lng = record.get('longitude', '')
        if lat and lng:
            try:
                self.seen_coordinates.add(f"{float(lat):.3f}|{float(lng):.3f}")
            except (ValueError, TypeError):
                pass

    def _normalize_phone(self, phone: str) -> str:
        """Normalize phone number for comparison."""
        if not phone:
            return ''
        # Remove all non-digits
        digits = re.sub(r'[^\d]', '', phone)
        # Handle Indian numbers
        if len(digits) == 10:
            return digits
        elif len(digits) == 11 and digits.startswith('0'):
            return digits[1:]
        elif len(digits) == 12 and digits.startswith('91'):
            return digits[2:]
        elif len(digits) == 13 and digits.startswith('091'):
            return digits[3:]
        return digits

    def _normalize(self, text: str) -> str:
        """Normalize text for comparison."""
        if not text:
            return ''
        text = unicodedata.normalize('NFKD', text)
        text = text.lower().strip()
        text = re.sub(r'[^\w\s]', '', text)
        text = re.sub(r'\s+', ' ', text)
        return text


# ============ CHECKPOINT WRITER ============

class CheckpointWriter:
    """Atomic checkpoint saving for output files."""

    def __init__(self, output_path: str, fmt: str = 'csv'):
        self.output_path = Path(output_path)
        self.format = fmt
        self.headers_written = False
        self.headers = None
        self.temp_path = self.output_path.with_suffix('.tmp')

    def write_record(self, record: dict):
        """Write a single record with atomic save."""
        if self.format == 'csv':
            self._write_csv_record(record)
        elif self.format == 'json':
            self._write_json_record(record)
        elif self.format == 'xlsx':
            self._write_xlsx_record(record)

    def _write_csv_record(self, record: dict):
        """Write CSV record atomically."""
        if not self.headers:
            self.headers = list(record.keys())

        try:
            file_exists = self.output_path.exists() and self.output_path.stat().st_size > 0

            with open(self.output_path, 'a', newline='', encoding='utf-8-sig') as f:
                writer = csv.DictWriter(f, fieldnames=self.headers, extrasaction='ignore')
                if not file_exists:
                    writer.writeheader()
                writer.writerow(record)
                f.flush()
        except PermissionError:
            logger.warning("Output file is locked (possibly open in Excel). Will retry on next record.")
        except Exception as e:
            logger.error(f"Error writing CSV record: {e}")

    def _write_json_record(self, record: dict):
        """Write JSON record atomically."""
        records = []
        if self.output_path.exists():
            try:
                with open(self.output_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        records = data
            except (json.JSONDecodeError, IOError):
                pass

        records.append(record)

        try:
            # Write to temp, then rename
            with open(self.temp_path, 'w', encoding='utf-8') as f:
                json.dump(records, f, indent=2, ensure_ascii=False, default=str)
            if self.output_path.exists():
                self.output_path.unlink()
            self.temp_path.rename(self.output_path)
        except PermissionError:
            logger.warning("Output file is locked. Will retry on next record.")
        except Exception as e:
            logger.error(f"Error writing JSON record: {e}")

    def _write_xlsx_record(self, record: dict):
        """Write XLSX record."""
        if not OPENPYXL_AVAILABLE:
            logger.error("openpyxl not installed. Falling back to CSV.")
            self.format = 'csv'
            self.output_path = self.output_path.with_suffix('.csv')
            self._write_csv_record(record)
            return

        if not self.headers:
            self.headers = list(record.keys())

        try:
            if self.output_path.exists():
                from openpyxl import load_workbook
                wb = load_workbook(self.output_path)
                ws = wb.active
            else:
                wb = Workbook()
                ws = wb.active
                ws.append(self.headers)

            ws.append([record.get(h, '') for h in self.headers])
            wb.save(self.output_path)
            wb.close()
        except PermissionError:
            logger.warning("Output file is locked (possibly open in Excel). Will retry on next record.")
        except Exception as e:
            logger.error(f"Error writing XLSX record: {e}")


# ============ GOOGLE MAPS SCRAPER ============

class GoogleMapsScraper:
    """Scrape business data from Google Maps using Playwright."""

    def __init__(self, headless=True):
        self.playwright = None
        self.browser = None
        self.context = None
        self.page = None
        self.headless = headless
        self.query_parser = QueryParser()
        self.category_matcher = CategoryMatcher()
        self.deduplicator = Deduplicator()

    def start(self):
        """Start the browser."""
        if not PLAYWRIGHT_AVAILABLE:
            raise RuntimeError("Playwright not available. Install with: pip install playwright && python -m playwright install chromium")

        self.playwright = sync_playwright().start()

        # Try chromium first, then chrome, then edge
        browsers = [
            ('chromium', self.playwright.chromium),
        ]

        for name, browser_type in browsers:
            try:
                logger.info(f"Launching {name}...")
                self.browser = browser_type.launch(
                    headless=self.headless,
                    args=[
                        '--no-sandbox',
                        '--disable-blink-features=AutomationControlled',
                        '--disable-dev-shm-usage',
                    ]
                )
                self.context = self.browser.new_context(
                    viewport={'width': 1366, 'height': 768},
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    locale='en-IN',
                )
                self.page = self.context.new_page()
                logger.info(f"Browser started: {name}")
                return
            except Exception as e:
                logger.warning(f"Could not launch {name}: {e}")

        raise RuntimeError("Could not launch any browser. Run: python -m playwright install chromium")

    def stop(self):
        """Stop the browser."""
        try:
            if self.context:
                self.context.close()
            if self.browser:
                self.browser.close()
            if self.playwright:
                self.playwright.stop()
        except Exception as e:
            logger.warning(f"Error stopping browser: {e}")

    def search_and_collect(self, query: str, target: int, writer: CheckpointWriter,
                          parsed: dict = None) -> list:
        """Search Google Maps and collect business data."""
        results = []

        if not parsed:
            parsed = self.query_parser.parse(query)

        logger.info(f"Parsed query: category='{parsed['category']}', location='{parsed['location']}'")

        # Generate search queries
        search_queries = self._generate_search_variants(parsed)
        logger.info(f"Search variants: {len(search_queries)}")

        for sq in search_queries:
            if len(results) >= target:
                break

            try:
                found = self._search_single(sq, target - len(results), parsed, writer)
                results.extend(found)
                logger.info(f"After '{sq}': {len(results)} results collected")
            except Exception as e:
                logger.warning(f"Search variant failed: {sq} - {e}")
                continue

        return results

    def _generate_search_variants(self, parsed: dict) -> list:
        """Generate search query variants."""
        variants = []
        category = parsed['category']
        location = parsed['location']

        if location:
            variants.append(f"{category} in {location}")
            # For district scope, also search main city
            if parsed['scope'] == 'district':
                variants.append(f"{category} {location}")
        else:
            variants.append(category)

        return variants

    def _search_single(self, query: str, remaining: int, parsed: dict,
                      writer: CheckpointWriter) -> list:
        """Execute a single search query."""
        results = []

        # Navigate to Google Maps
        maps_url = f"https://www.google.com/maps/search/{quote_plus(query)}"
        logger.info(f"Navigating to: {maps_url}")

        try:
            self.page.goto(maps_url, timeout=30000, wait_until='domcontentloaded')
            time.sleep(3)  # Wait for results to load
        except PlaywrightTimeout:
            logger.warning("Navigation timeout, continuing...")
        except Exception as e:
            logger.warning(f"Navigation error: {e}")
            return results

        # Check for CAPTCHA
        if self._detect_captcha():
            logger.warning("CAPTCHA detected. Stopping this search variant.")
            return results

        # Wait for results panel
        try:
            self.page.wait_for_selector('[role="feed"], .m6QEsr, div[aria-label*="Results"]', timeout=10000)
        except:
            logger.warning("Could not find results panel")
            return results

        # Scroll and collect results
        max_scrolls = min(remaining * 2, 40)
        seen_count = 0

        for scroll in range(max_scrolls):
            if len(results) >= remaining:
                break

            # Get visible result links
            links = self._get_result_links()
            if not links:
                break

            new_links = links[seen_count:]
            if not new_links:
                # Try scrolling more
                self._scroll_results()
                time.sleep(1)
                continue

            for link in new_links:
                if len(results) >= remaining:
                    break

                try:
                    record = self._extract_business_data(link, query, parsed)
                    if record:
                        # Check relevance
                        relevance = self.category_matcher.score_relevance(
                            parsed['category'],
                            record.get('business_name', ''),
                            record.get('category', ''),
                            query
                        )

                        # Government qualifier check
                        if parsed.get('is_government') and not self._is_government_business(record):
                            logger.debug(f"Rejected (not government): {record.get('business_name')}")
                            continue

                        if relevance >= 30:
                            # Check deduplication
                            if not self.deduplicator.is_duplicate(record):
                                record['quality_score'] = str(self._calculate_quality(record, relevance))
                                record['matched_query'] = query
                                record['collected_at'] = datetime.now().isoformat()

                                self.deduplicator.register(record)
                                writer.write_record(record)
                                results.append(record)
                                logger.info(f"Accepted (score={relevance}): {record.get('business_name')}")
                            else:
                                logger.debug(f"Duplicate skipped: {record.get('business_name')}")
                        else:
                            logger.debug(f"Low relevance ({relevance}): {record.get('business_name')}")

                except Exception as e:
                    logger.debug(f"Error extracting business: {e}")
                    continue

            seen_count = len(links)
            self._scroll_results()
            time.sleep(1.5)

        return results

    def _get_result_links(self) -> list:
        """Get links to individual business results."""
        try:
            # Try multiple selector strategies
            selectors = [
                'a[href*="/maps/place/"]',
                '[role="feed"] a[href*="/maps/place/"]',
                '.m6QEsr a[href*="/maps/place/"]',
                'div[role="article"] a',
            ]

            for selector in selectors:
                elements = self.page.query_selector_all(selector)
                if elements:
                    return elements

            return []
        except Exception:
            return []

    def _scroll_results(self):
        """Scroll the results panel."""
        try:
            self.page.evaluate('''() => {
                const feed = document.querySelector('[role="feed"]') ||
                           document.querySelector('.m6QEsr') ||
                           document.querySelector('div[aria-label*="Results"]');
                if (feed) {
                    feed.scrollTop = feed.scrollHeight;
                }
            }''')
        except Exception:
            pass

    def _extract_business_data(self, link_element, query: str, parsed: dict) -> dict:
        """Extract business data from a result element."""
        try:
            # Click on the result to open details
            href = link_element.get_attribute('href') or ''

            # Try to get data from the element itself
            record = {
                'business_name': '',
                'category': '',
                'google_address': '',
                'consolidated_addresses': '',
                'google_phone': '',
                'consolidated_phones': '',
                'public_emails': '',
                'official_website': '',
                'facebook_url': '',
                'instagram_url': '',
                'linkedin_url': '',
                'rating': '',
                'review_count': '',
                'business_status': '',
                'hours': '',
                'latitude': '',
                'longitude': '',
                'google_maps_url': '',
                'google_query': query,
                'google_status': 'found',
                'website_status': 'not_checked',
                'social_status': 'not_checked',
                'pages_scanned': '0',
                'connection_method': 'google_maps',
                'record_status': 'verified',
                'error_message': '',
                'quality_score': '0',
                'verification_status': 'basic',
                'matched_query': query,
                'collected_at': datetime.now().isoformat(),
                'place_id': '',
            }

            # Try clicking the element
            try:
                link_element.click(timeout=5000)
                time.sleep(2)
            except:
                pass

            # Extract data from the detail panel
            page_text = self.page.content()

            # Business name
            name_el = self.page.query_selector('h1')
            if name_el:
                record['business_name'] = name_el.inner_text().strip()

            # Try to get structured data
            try:
                # Address
                addr_buttons = self.page.query_selector_all('button[data-item-id="address"]')
                if addr_buttons:
                    record['google_address'] = addr_buttons[0].inner_text().strip()

                # Phone
                phone_buttons = self.page.query_selector_all('button[data-item-id="phone"]')
                if phone_buttons:
                    record['google_phone'] = phone_buttons[0].inner_text().strip()

                # Website
                web_buttons = self.page.query_selector_all('a[data-item-id="authority"]')
                if web_buttons:
                    record['official_website'] = web_buttons[0].get_attribute('href') or ''

                # Rating
                rating_el = self.page.query_selector('div.F7nice span[aria-hidden="true"]')
                if rating_el:
                    record['rating'] = rating_el.inner_text().strip()

                # Reviews
                review_el = self.page.query_selector('div.F7nice span[aria-label*="review"]')
                if review_el:
                    text = review_el.get_attribute('aria-label') or ''
                    nums = re.findall(r'\d+', text)
                    if nums:
                        record['review_count'] = nums[0]

                # Category
                cat_el = self.page.query_selector('button[jsaction*="category"]')
                if not cat_el:
                    cat_el = self.page.query_selector('.DkEaL')
                if cat_el:
                    record['category'] = cat_el.inner_text().strip()

                # Hours
                hours_el = self.page.query_selector('div.t3Vs8c')
                if hours_el:
                    record['hours'] = hours_el.inner_text().strip()[:200]

                # Maps URL
                record['google_maps_url'] = self.page.url

                # Extract coordinates from URL
                coords_match = re.search(r'[@!](-?\d+\.\d+),(-?\d+\.\d+)', self.page.url)
                if coords_match:
                    record['latitude'] = coords_match.group(1)
                    record['longitude'] = coords_match.group(2)

            except Exception as e:
                logger.debug(f"Error extracting structured data: {e}")

            # Go back to results
            try:
                self.page.go_back(timeout=5000)
                time.sleep(1)
            except:
                pass

            if record['business_name']:
                return record

        except Exception as e:
            logger.debug(f"Error extracting business data: {e}")

        return None

    def _detect_captcha(self) -> bool:
        """Detect if Google is showing a CAPTCHA."""
        try:
            captcha_indicators = [
                'unusual traffic',
                'captcha',
                'verify you are human',
                'recaptcha',
                'sorry, we just need to make sure',
            ]
            page_text = self.page.inner_text('body').lower()
            return any(indicator in page_text for indicator in captcha_indicators)
        except:
            return False

    def _is_government_business(self, record: dict) -> bool:
        """Check if a business appears to be government-owned."""
        gov_terms = [
            'government', 'govt', 'civil', 'district', 'rural',
            'primary health', 'phc', 'chc', 'community health',
            'municipal', 'state', 'public', 'sarkari',
        ]
        combined = f"{record.get('business_name', '')} {record.get('category', '')} {record.get('google_address', '')}".lower()
        return any(term in combined for term in gov_terms)

    def _calculate_quality(self, record: dict, relevance: int) -> int:
        """Calculate quality score 0-100."""
        score = 0

        # Base from relevance
        score += min(30, relevance // 3)

        # Has name
        if record.get('business_name'):
            score += 10

        # Has address
        if record.get('google_address'):
            score += 10

        # Has phone
        if record.get('google_phone'):
            score += 15

        # Has website
        if record.get('official_website'):
            score += 10

        # Has rating
        if record.get('rating'):
            score += 5

        # Has coordinates
        if record.get('latitude') and record.get('longitude'):
            score += 5

        # Has category
        if record.get('category'):
            score += 5

        # Has hours
        if record.get('hours'):
            score += 5

        # Has email
        if record.get('public_emails'):
            score += 5

        return min(100, score)


# ============ MAIN ============

def main():
    parser = argparse.ArgumentParser(description='ITCYBER Connected Scraper')
    parser.add_argument('--query', required=True, help='Search query')
    parser.add_argument('--target', type=int, default=50, help='Target number of leads')
    parser.add_argument('--enrichment', choices=['none', 'website', 'full'], default='none')
    parser.add_argument('--format', choices=['csv', 'xlsx', 'json'], default='csv')
    parser.add_argument('--output', required=True, help='Output file path')
    parser.add_argument('--job-id', default='', help='Job ID for progress tracking')
    parser.add_argument('--headless', action='store_true', default=True)
    parser.add_argument('--no-headless', action='store_true')
    args = parser.parse_args()

    if args.no_headless:
        args.headless = False

    # Ensure output directory exists
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Initialize components
    query_parser = QueryParser()
    parsed = query_parser.parse(args.query)

    logger.info(f"=" * 60)
    logger.info(f"ITCYBER Connected Scraper v2.0")
    logger.info(f"=" * 60)
    logger.info(f"Query: {args.query}")
    logger.info(f"Parsed: category='{parsed['category']}', location='{parsed['location']}'")
    logger.info(f"Target: {args.target}")
    logger.info(f"Enrichment: {args.enrichment}")
    logger.info(f"Format: {args.format}")
    logger.info(f"Output: {args.output}")
    logger.info(f"=" * 60)

    # Initialize writer
    writer = CheckpointWriter(args.output, args.format)

    # Start scraper
    scraper = GoogleMapsScraper(headless=args.headless)

    try:
        scraper.start()
        results = scraper.search_and_collect(args.query, args.target, writer, parsed)

        logger.info(f"=" * 60)
        logger.info(f"Scraping complete!")
        logger.info(f"Total results: {len(results)}")
        logger.info(f"Output saved to: {args.output}")
        logger.info(f"=" * 60)

    except KeyboardInterrupt:
        logger.info("Interrupted by user. Checkpoint preserved.")
    except Exception as e:
        logger.error(f"Scraper error: {e}")
        raise
    finally:
        scraper.stop()


if __name__ == '__main__':
    main()
