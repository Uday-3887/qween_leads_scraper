"""
ITCYBER Backend Tests
======================
Unit tests for query parser, category matcher, deduplication, and utilities.
"""

import csv
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from universal_query import UniversalQueryParser, parse_query
from contact_utils import (
    extract_emails, extract_phones, extract_social_links,
    normalize_phone, normalize_domain, calculate_quality_score,
    determine_verification_status,
)
from location_planner import LocationPlanner, plan_locations


class TestQueryParser(unittest.TestCase):
    """Test universal query parser."""

    def setUp(self):
        self.parser = UniversalQueryParser()

    def test_basic_english(self):
        result = self.parser.parse('hospitals in Pusad')
        self.assertEqual(result['category'], 'hospitals')
        self.assertEqual(result['location'], 'pusad')

    def test_near(self):
        result = self.parser.parse('restaurants near Pune')
        self.assertEqual(result['category'], 'restaurants')
        self.assertIn('pune', result['location'].lower())

    def test_around(self):
        result = self.parser.parse('schools around Mumbai')
        self.assertEqual(result['category'], 'schools')
        self.assertIn('mumbai', result['location'].lower())

    def test_marathi_mdhi(self):
        result = self.parser.parse('Pusad mdhi hospitals')
        # Should detect location and category
        self.assertTrue(
            ('pusad' in result['location'].lower() and 'hospital' in result['category'].lower()) or
            ('pusad' in result['category'].lower() and 'hospital' in result['location'].lower())
        )

    def test_marathi_madhe(self):
        result = self.parser.parse('Pusad madhe hospitals')
        self.assertTrue(result['category'] or result['location'])

    def test_count_query(self):
        result = self.parser.parse('Pusad mdhi hospitals kiti ahe')
        self.assertTrue(result['count_query'])

    def test_government_qualifier(self):
        result = self.parser.parse('government hospitals in Yavatmal district')
        self.assertTrue(result['is_government'])
        self.assertEqual(result['scope'], 'district')

    def test_govt_abbreviation(self):
        result = self.parser.parse('govt hospitals in Yavatmal')
        self.assertTrue(result['is_government'])

    def test_state_scope(self):
        result = self.parser.parse('solar panel dealers in Maharashtra')
        self.assertEqual(result['scope'], 'state')

    def test_no_location(self):
        result = self.parser.parse('hospitals')
        self.assertTrue(result['category'])

    def test_complex_query(self):
        result = self.parser.parse('interior designers in Nagpur')
        self.assertIn('interior', result['category'].lower())
        self.assertIn('nagpur', result['location'].lower())

    def test_hinglish(self):
        result = self.parser.parse('restaurants in Pune Maharashtra')
        self.assertIn('restaurant', result['category'].lower())

    def test_convenience_function(self):
        result = parse_query('hospitals in Pusad')
        self.assertIsInstance(result, dict)
        self.assertIn('category', result)
        self.assertIn('location', result)


class TestContactUtils(unittest.TestCase):
    """Test contact extraction utilities."""

    def test_extract_emails(self):
        text = "Contact us at info@business.com or sales@store.in"
        emails = extract_emails(text)
        self.assertIn('info@business.com', emails)
        self.assertIn('sales@store.in', emails)

    def test_extract_emails_empty(self):
        self.assertEqual(extract_emails(''), [])
        self.assertEqual(extract_emails(None), [])

    def test_extract_emails_excluded(self):
        text = "test@example.com real@business.com"
        emails = extract_emails(text)
        # example.com should be excluded
        self.assertNotIn('test@example.com', emails)

    def test_extract_phones(self):
        text = "Call +91 98765 43210 or 020-25671234"
        phones = extract_phones(text)
        self.assertTrue(len(phones) > 0)

    def test_extract_phones_empty(self):
        self.assertEqual(extract_phones(''), [])

    def test_normalize_phone_10digit(self):
        self.assertEqual(normalize_phone('9876543210'), '+919876543210')

    def test_normalize_phone_with_plus(self):
        result = normalize_phone('+91 98765 43210')
        self.assertIn('91', result)

    def test_normalize_phone_with_zero(self):
        result = normalize_phone('09876543210')
        self.assertIn('9876543210', result)

    def test_normalize_domain(self):
        self.assertEqual(normalize_domain('https://www.example.com/page'), 'example.com')
        self.assertEqual(normalize_domain('http://business.in'), 'business.in')

    def test_normalize_domain_empty(self):
        self.assertEqual(normalize_domain(''), '')

    def test_extract_social_links(self):
        text = "Visit https://facebook.com/mybusiness and https://instagram.com/mybiz"
        links = extract_social_links(text)
        self.assertIn('facebook', links)
        self.assertIn('instagram', links)

    def test_calculate_quality_score(self):
        record = {
            'business_name': 'Test Hospital',
            'category': 'Hospital',
            'google_address': 'Test Address',
            'google_phone': '+91 1234567890',
            'official_website': 'https://test.com',
            'rating': '4.5',
            'latitude': '19.0',
            'longitude': '77.0',
        }
        score = calculate_quality_score(record)
        self.assertGreater(score, 50)

    def test_calculate_quality_score_minimal(self):
        record = {'business_name': 'Test'}
        score = calculate_quality_score(record)
        self.assertLess(score, 30)

    def test_verification_status_high(self):
        record = {
            'business_name': 'Test',
            'google_phone': '123',
            'google_address': 'Addr',
            'official_website': 'https://test.com',
            'rating': '4.0',
        }
        self.assertEqual(determine_verification_status(record), 'high')

    def test_verification_status_medium(self):
        record = {
            'business_name': 'Test',
            'google_phone': '123',
            'google_address': 'Addr',
        }
        self.assertEqual(determine_verification_status(record), 'medium')

    def test_verification_status_basic(self):
        record = {'business_name': 'Test'}
        self.assertEqual(determine_verification_status(record), 'basic')


class TestLocationPlanner(unittest.TestCase):
    """Test location planner."""

    def setUp(self):
        self.planner = LocationPlanner()

    def test_local_scope(self):
        locations = self.planner.get_search_locations('Pusad', 'local')
        self.assertEqual(locations, ['Pusad'])

    def test_district_scope(self):
        locations = self.planner.get_search_locations('Yavatmal district', 'district')
        self.assertGreater(len(locations), 1)
        self.assertTrue(any('pusad' in loc.lower() for loc in locations))

    def test_state_scope(self):
        locations = self.planner.get_search_locations('Maharashtra', 'state')
        self.assertGreater(len(locations), 1)

    def test_query_variants(self):
        variants = self.planner.get_query_variants('hospitals', ['Pusad', 'Yavatmal'])
        self.assertGreater(len(variants), 2)
        self.assertTrue(any('Pusad' in v for v in variants))

    def test_convenience_function(self):
        result = plan_locations('Pusad', 'local')
        self.assertIsInstance(result, list)


class TestDeduplication(unittest.TestCase):
    """Test deduplication logic."""

    def test_duplicate_by_phone(self):
        from connected_scraper import Deduplicator
        dedup = Deduplicator()

        record1 = {'business_name': 'Hospital A', 'google_phone': '+91 9876543210', 'google_address': 'Addr 1'}
        record2 = {'business_name': 'Hospital B', 'google_phone': '9876543210', 'google_address': 'Addr 2'}

        dedup.register(record1)
        self.assertTrue(dedup.is_duplicate(record2))

    def test_not_duplicate_different_phone(self):
        from connected_scraper import Deduplicator
        dedup = Deduplicator()

        record1 = {'business_name': 'Hospital A', 'google_phone': '+91 9876543210', 'google_address': 'Addr 1'}
        record2 = {'business_name': 'Hospital B', 'google_phone': '+91 1234567890', 'google_address': 'Addr 2'}

        dedup.register(record1)
        self.assertFalse(dedup.is_duplicate(record2))

    def test_duplicate_by_name_address(self):
        from connected_scraper import Deduplicator
        dedup = Deduplicator()

        record1 = {'business_name': 'City Hospital', 'google_phone': '', 'google_address': 'Main Road, Pusad'}
        record2 = {'business_name': 'City Hospital', 'google_phone': '', 'google_address': 'Main Road, Pusad'}

        dedup.register(record1)
        self.assertTrue(dedup.is_duplicate(record2))


class TestCategoryMatcher(unittest.TestCase):
    """Test category matching and relevance scoring."""

    def setUp(self):
        from connected_scraper import CategoryMatcher
        self.matcher = CategoryMatcher()

    def test_hospital_match(self):
        score = self.matcher.score_relevance('hospitals', 'City Hospital', 'Hospital', 'hospitals in Pusad')
        self.assertGreater(score, 50)

    def test_hospital_rejects_pharmacy(self):
        score = self.matcher.score_relevance('hospitals', 'MedPlus Pharmacy', 'Pharmacy', 'hospitals in Pusad')
        self.assertEqual(score, 0)

    def test_medical_store_match(self):
        score = self.matcher.score_relevance('medical stores', 'MedPlus Pharmacy', 'Pharmacy', 'medical stores in Pusad')
        self.assertGreater(score, 30)

    def test_arbitrary_category(self):
        score = self.matcher.score_relevance('banquet halls', 'Grand Banquet Hall', 'Banquet Hall', 'banquet halls in Pusad')
        self.assertGreater(score, 30)

    def test_unknown_category_lenient(self):
        score = self.matcher.score_relevance('tile adhesive dealers', 'Tile World', 'Building Material Store', 'tile adhesive dealers')
        self.assertGreater(score, 0)


class TestCheckpointWriter(unittest.TestCase):
    """Test checkpoint file writing."""

    def test_csv_write(self):
        from connected_scraper import CheckpointWriter
        with tempfile.NamedTemporaryFile(suffix='.csv', delete=False) as f:
            tmppath = f.name

        try:
            writer = CheckpointWriter(tmppath, 'csv')
            record = {
                'business_name': 'Test Hospital',
                'category': 'Hospital',
                'google_address': 'Test Address',
                'google_phone': '+91 1234567890',
            }
            writer.write_record(record)

            # Verify file exists and has content
            self.assertTrue(Path(tmppath).exists())
            with open(tmppath, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                rows = list(reader)
                self.assertEqual(len(rows), 1)
                self.assertEqual(rows[0]['business_name'], 'Test Hospital')
        finally:
            os.unlink(tmppath)

    def test_json_write(self):
        from connected_scraper import CheckpointWriter
        with tempfile.NamedTemporaryFile(suffix='.json', delete=False) as f:
            tmppath = f.name

        try:
            writer = CheckpointWriter(tmppath, 'json')
            record = {
                'business_name': 'Test Restaurant',
                'category': 'Restaurant',
            }
            writer.write_record(record)

            with open(tmppath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.assertIsInstance(data, list)
                self.assertEqual(len(data), 1)
                self.assertEqual(data[0]['business_name'], 'Test Restaurant')
        finally:
            os.unlink(tmppath)

    def test_multiple_records(self):
        from connected_scraper import CheckpointWriter
        with tempfile.NamedTemporaryFile(suffix='.csv', delete=False) as f:
            tmppath = f.name

        try:
            writer = CheckpointWriter(tmppath, 'csv')
            for i in range(5):
                writer.write_record({
                    'business_name': f'Business {i}',
                    'category': 'Test',
                    'google_address': f'Address {i}',
                })

            with open(tmppath, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                rows = list(reader)
                self.assertEqual(len(rows), 5)
        finally:
            os.unlink(tmppath)


if __name__ == '__main__':
    unittest.main(verbosity=2)
