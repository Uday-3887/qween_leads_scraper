"""
ITCYBER Universal Query Parser
===============================
Parses natural language queries in English, Marathi transliteration, and Hindi/Hinglish.
"""

import re
import unicodedata


class UniversalQueryParser:
    """Parse natural language queries into structured components."""

    LOCATION_PREPOSITIONS = [
        'in', 'near', 'around', 'at', 'of', 'within',
        'mdhi', 'madhe', 'madhye', 'me',  # Marathi
        'mein', 'me', 'ke', 'ka', 'se',   # Hindi/Hinglish
    ]

    GOV_QUALIFIERS = [
        'government', 'govt', 'sarkari', 'public',
        'municipal', 'state', 'district', 'civil',
    ]

    COUNT_INDICATORS = [
        'kiti', 'how many', 'count', 'total', 'number of',
        'संख्या', 'किती',
    ]

    SCOPE_PATTERNS = {
        'district': re.compile(r'\bdistrict\b|\bजिल्हा\b', re.I),
        'taluka': re.compile(r'\btaluka\b|\btaluk\b|\btahsil\b', re.I),
        'state': re.compile(r'\bstate\b|\bmaharashtra\b|\bgujarat\b|\bkarnataka\b|\bतळ\b', re.I),
    }

    KNOWN_PLACES = {
        # Maharashtra
        'pusad', 'yavatmal', 'pune', 'mumbai', 'nagpur', 'amravati',
        'nashik', 'aurangabad', 'kolhapur', 'solapur', 'sangli',
        'satara', 'ratnagiri', 'sindhudurg', 'osmanabad', 'latur',
        'nanded', 'hingoli', 'parbhani', 'jalna', 'buldhana',
        'akola', 'wardha', 'chandrapur', 'gadchiroli', 'bhandara',
        'gonia', 'dhule', 'nandurbar', 'jalgaon', 'ahmednagar',
        # Other states
        'maharashtra', 'gujarat', 'karnataka', 'tamil nadu', 'kerala',
        'delhi', 'hyderabad', 'bangalore', 'chennai', 'kolkata',
        'rajasthan', 'madhya pradesh', 'uttar pradesh',
    }

    def parse(self, query: str) -> dict:
        """
        Parse a natural language query.

        Returns:
            dict with keys: original, category, location, qualifiers, scope,
                           is_government, count_query
        """
        original = query.strip()
        # Normalize unicode
        original = unicodedata.normalize('NFKC', original)

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
        for indicator in self.COUNT_INDICATORS:
            if indicator in original.lower():
                result['count_query'] = True
                break

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
        category, location = self._extract_parts(original)
        result['category'] = category
        result['location'] = location

        return result

    def _extract_parts(self, query: str) -> tuple:
        """Extract category and location from query."""
        query_lower = query.lower().strip()

        # Pattern 1: "X in/near/around Y"
        for prep in self.LOCATION_PREPOSITIONS:
            pattern = rf'^(.+?)\s+{prep}\s+(.+)$'
            match = re.match(pattern, query_lower, re.I)
            if match:
                return match.group(1).strip(), match.group(2).strip()

        # Pattern 2: "Y mdhi/madhe X" (Marathi reversed)
        for prep in ['mdhi', 'madhe', 'madhye']:
            pattern = rf'^(.+?)\s+{prep}\s+(.+?)$'
            match = re.match(pattern, query_lower, re.I)
            if match:
                part_a = match.group(1).strip()
                part_b = match.group(2).strip()
                # In this pattern, part_a is location, part_b is category
                if self._looks_like_location(part_a):
                    return part_b, part_a
                else:
                    return part_a, part_b

        # Pattern 3: "X Y" where Y is a known place
        words = query_lower.split()
        for i in range(len(words) - 1, 0, -1):
            potential_loc = ' '.join(words[i:])
            if self._looks_like_location(potential_loc):
                potential_cat = ' '.join(words[:i])
                return potential_cat, potential_loc

        # Pattern 4: Check for known places anywhere in query
        for place in sorted(self.KNOWN_PLACES, key=len, reverse=True):
            if place in query_lower:
                idx = query_lower.index(place)
                before = query_lower[:idx].strip().rstrip(' ,.-')
                after = query_lower[idx:].strip()
                if before:
                    return before, after
                return query, ''

        # Fallback
        return query, ''

    def _looks_like_location(self, text: str) -> bool:
        """Check if text looks like a location name."""
        text_lower = text.lower().strip()
        words = text_lower.split()

        # Check against known places
        for place in self.KNOWN_PLACES:
            if place in text_lower:
                return True

        # Check for geographic terms
        geo_terms = ['district', 'taluka', 'tehsil', 'city', 'town', 'village',
                    'जिल्हा', 'तालुका']
        if any(term in text_lower for term in geo_terms):
            return True

        # Short text without business terms
        if len(words) <= 3:
            business_terms = {'hospital', 'school', 'restaurant', 'shop', 'store',
                            'dealer', 'service', 'clinic', 'office', 'institute',
                            'hotel', 'gym', 'bank', 'market'}
            if not any(t in text_lower for t in business_terms):
                return True

        return False


# Convenience function
def parse_query(query: str) -> dict:
    """Parse a query string into structured components."""
    parser = UniversalQueryParser()
    return parser.parse(query)


if __name__ == '__main__':
    # Test examples
    test_queries = [
        'hospitals in Pusad',
        'government hospitals in Yavatmal district',
        'restaurants in Pune',
        'Pusad mdhi hospitals',
        'Pusad mdhi hospitals kiti ahe',
        'hospitals kiti ahe Pusad mdhi',
        'interior designers in Nagpur',
        'solar panel dealers in Maharashtra',
        'medical stores in Pusad',
        'gyms near Pune',
    ]

    parser = UniversalQueryParser()
    for q in test_queries:
        result = parser.parse(q)
        print(f"\nQuery: {q}")
        print(f"  Category: {result['category']}")
        print(f"  Location: {result['location']}")
        print(f"  Government: {result['is_government']}")
        print(f"  Scope: {result['scope']}")
