"""
ITCYBER Location Planner
=========================
Generates location variants for broader discovery.
"""

import re
import logging

logger = logging.getLogger(__name__)

# Known district -> major cities mapping for Maharashtra
MAHARASHTRA_DISTRICTS = {
    'yavatmal': ['yavatmal', 'pusad', 'ner', 'darwha', 'digras', 'wani'],
    'amravati': ['amravati', 'achalpur', 'morshi', 'dhamangaon'],
    'pune': ['pune', 'pimpri-chinchwad', 'hinjewadi', 'wakad', 'hadapsar'],
    'mumbai': ['mumbai', 'andheri', 'borivali', 'thane', 'navi mumbai'],
    'nagpur': ['nagpur', 'kamptee', 'kalmeshwar'],
    'nashik': ['nashik', ' Sinnar', 'igatpuri'],
}


class LocationPlanner:
    """Plan location search variants for broader discovery."""

    def __init__(self):
        self.cache = {}

    def get_search_locations(self, location: str, scope: str = 'local') -> list:
        """
        Get list of locations to search.

        Args:
            location: Original location from query
            scope: 'local', 'taluka', 'district', or 'state'

        Returns:
            List of location strings to search
        """
        locations = [location]

        if scope == 'local':
            return locations

        # Check if it's a known district
        loc_lower = location.lower()
        for district, cities in MAHARASHTRA_DISTRICTS.items():
            if district in loc_lower:
                locations.extend(cities)
                logger.info(f"Expanded district '{district}' to {len(cities)} cities")
                return locations

        # For state scope, add major cities
        if scope == 'state':
            if 'maharashtra' in loc_lower:
                locations.extend(['pune', 'mumbai', 'nagpur', 'nashik'])
            return locations

        return locations

    def get_query_variants(self, category: str, locations: list) -> list:
        """
        Generate query variants for each location.

        Returns:
            List of search query strings
        """
        variants = []
        for loc in locations:
            variants.append(f"{category} in {loc}")
            variants.append(f"{category} {loc}")
            variants.append(f"best {category} {loc}")
        return variants


def plan_locations(location: str, scope: str = 'local') -> list:
    """Convenience function for location planning."""
    planner = LocationPlanner()
    return planner.get_search_locations(location, scope)


if __name__ == '__main__':
    planner = LocationPlanner()

    # Test cases
    tests = [
        ('Pusad', 'local'),
        ('Yavatmal district', 'district'),
        ('Maharashtra', 'state'),
        ('Pune', 'local'),
    ]

    for loc, scope in tests:
        results = planner.get_search_locations(loc, scope)
        print(f"\nLocation: {loc} (scope: {scope})")
        print(f"  Search locations: {results}")
