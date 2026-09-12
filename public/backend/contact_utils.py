"""
ITCYBER Contact Utilities
==========================
Utilities for extracting and normalizing contact information.
"""

import re
import logging
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

# Email regex
EMAIL_REGEX = re.compile(
    r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
)

# Phone patterns (Indian focus)
PHONE_PATTERNS = [
    re.compile(r'(\+91[\s-]?\d{5}[\s-]?\d{5})'),
    re.compile(r'(0\d{2,4}[\s-]?\d{6,8})'),
    re.compile(r'(\d{10})'),
    re.compile(r'(\+?\d{1,3}[\s-]?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4})'),
]

# Social media URL patterns
SOCIAL_PATTERNS = {
    'facebook': re.compile(r'https?://(?:www\.)?facebook\.com/[\w.]+/?'),
    'instagram': re.compile(r'https?://(?:www\.)?instagram\.com/[\w.]+/?'),
    'linkedin': re.compile(r'https?://(?:www\.)?linkedin\.com/(?:company|in)/[\w-]+/?'),
    'twitter': re.compile(r'https?://(?:www\.)?(?:twitter|x)\.com/[\w]+/?'),
    'youtube': re.compile(r'https?://(?:www\.)?youtube\.com/(?:c/|channel/|@)[\w]+/?'),
}

# Common non-business emails to exclude
EXCLUDED_EMAILS = {
    'example.com', 'test.com', 'domain.com', 'email.com',
    'sentry.io', 'wixpress.com', 'googleapis.com',
}


def extract_emails(text: str) -> list:
    """Extract valid email addresses from text."""
    if not text:
        return []

    emails = EMAIL_REGEX.findall(text)
    valid = []
    for email in emails:
        email = email.lower().strip()
        domain = email.split('@')[1] if '@' in email else ''
        if domain not in EXCLUDED_EMAILS and not domain.endswith('.invalid'):
            if email not in valid:
                valid.append(email)

    return valid


def extract_phones(text: str) -> list:
    """Extract phone numbers from text."""
    if not text:
        return []

    phones = set()
    for pattern in PHONE_PATTERNS:
        matches = pattern.findall(text)
        for match in matches:
            # Clean up the phone number
            cleaned = re.sub(r'[^\d+]', '', match)
            if len(cleaned) >= 10:
                phones.add(cleaned)

    return list(phones)


def extract_social_links(text: str) -> dict:
    """Extract social media links from text."""
    if not text:
        return {}

    links = {}
    for platform, pattern in SOCIAL_PATTERNS.items():
        matches = pattern.findall(text)
        if matches:
            links[platform] = matches[0]

    return links


def normalize_phone(phone: str) -> str:
    """Normalize a phone number to a standard format."""
    if not phone:
        return ''

    # Remove all non-digits except leading +
    digits = re.sub(r'[^\d]', '', phone)

    # Indian number normalization
    if len(digits) == 10:
        return f"+91{digits}"
    elif len(digits) == 11 and digits.startswith('0'):
        return f"+91{digits[1:]}"
    elif len(digits) == 12 and digits.startswith('91'):
        return f"+{digits}"
    elif len(digits) == 13 and digits.startswith('091'):
        return f"+{digits[1:]}"

    return phone


def normalize_domain(url: str) -> str:
    """Extract and normalize domain from URL."""
    if not url:
        return ''

    try:
        parsed = urlparse(url)
        domain = parsed.netloc or parsed.path
        domain = domain.lower().strip()
        if domain.startswith('www.'):
            domain = domain[4:]
        return domain
    except Exception:
        return url


def calculate_quality_score(record: dict) -> int:
    """
    Calculate quality score 0-100 for a business record.

    Factors:
    - Business name: 10
    - Category match: 15
    - Address: 10
    - Phone: 15
    - Website: 10
    - Rating: 5
    - Coordinates: 5
    - Email: 10
    - Social links: 10
    - Hours: 5
    - Review count: 5
    """
    score = 0

    if record.get('business_name'):
        score += 10
    if record.get('category'):
        score += 15
    if record.get('google_address'):
        score += 10
    if record.get('google_phone'):
        score += 15
    if record.get('official_website'):
        score += 10
    if record.get('rating'):
        score += 5
    if record.get('latitude') and record.get('longitude'):
        score += 5
    if record.get('public_emails'):
        score += 10
    if record.get('facebook_url') or record.get('instagram_url') or record.get('linkedin_url'):
        score += 10
    if record.get('hours'):
        score += 5
    if record.get('review_count'):
        score += 5

    return min(100, score)


def determine_verification_status(record: dict) -> str:
    """
    Determine verification status based on available data.

    Returns: 'high', 'medium', or 'basic'
    """
    has_name = bool(record.get('business_name'))
    has_phone = bool(record.get('google_phone'))
    has_address = bool(record.get('google_address'))
    has_website = bool(record.get('official_website'))
    has_email = bool(record.get('public_emails'))
    has_rating = bool(record.get('rating'))
    has_social = bool(record.get('facebook_url') or record.get('instagram_url'))

    # High: name + phone + address + (website or email) + rating
    if has_name and has_phone and has_address and (has_website or has_email) and has_rating:
        return 'high'

    # Medium: name + phone + address
    if has_name and has_phone and has_address:
        return 'medium'

    # Basic: at least name
    if has_name:
        return 'basic'

    return 'basic'


if __name__ == '__main__':
    # Test cases
    test_text = """
    Contact us at info@example.com or sales@business.in
    Phone: +91 98765 43210 or 020-25671234
    Visit: https://facebook.com/mybusiness
    Instagram: https://instagram.com/mybusiness_official
    """

    print("Emails:", extract_emails(test_text))
    print("Phones:", extract_phones(test_text))
    print("Social:", extract_social_links(test_text))
    print("Normalized phone:", normalize_phone("+91 98765 43210"))
