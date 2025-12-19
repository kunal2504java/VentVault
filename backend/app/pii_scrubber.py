import re
from typing import ClassVar


class PIIScrubber:
    """
    Fast in-memory PII scrubber - no DB, no logging.
    
    Removes:
    - Email addresses
    - Phone numbers (various formats)
    - URLs
    - Social Security Numbers
    - Credit card numbers
    - IP addresses
    - Names (common patterns)
    """
    
    # Pre-compiled regex patterns for performance
    PATTERNS: ClassVar[list[tuple[re.Pattern, str]]] = [
        # Email addresses
        (re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', re.IGNORECASE), '[EMAIL]'),
        
        # Phone numbers (various formats)
        (re.compile(r'\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b'), '[PHONE]'),
        (re.compile(r'\b\d{3}[-.\s]\d{4}\b'), '[PHONE]'),  # 7-digit
        
        # URLs
        (re.compile(r'https?://[^\s<>"{}|\\^`\[\]]+', re.IGNORECASE), '[URL]'),
        (re.compile(r'www\.[^\s<>"{}|\\^`\[\]]+', re.IGNORECASE), '[URL]'),
        
        # Social Security Numbers
        (re.compile(r'\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b'), '[SSN]'),
        
        # Credit card numbers (basic patterns)
        (re.compile(r'\b(?:\d{4}[-.\s]?){3}\d{4}\b'), '[CARD]'),
        (re.compile(r'\b\d{15,16}\b'), '[CARD]'),
        
        # IP addresses
        (re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b'), '[IP]'),
        
        # Dates of birth (common formats)
        (re.compile(r'\b(?:0?[1-9]|1[0-2])[/\-](?:0?[1-9]|[12]\d|3[01])[/\-](?:19|20)\d{2}\b'), '[DATE]'),
    ]
    
    @classmethod
    def scrub(cls, text: str) -> str:
        """
        Remove PII from text - runs in-memory only.
        
        Args:
            text: Input text that may contain PII
            
        Returns:
            Sanitized text with PII replaced by placeholders
        """
        if not text:
            return text
            
        result = text
        for pattern, replacement in cls.PATTERNS:
            result = pattern.sub(replacement, result)
        
        return result
    
    @classmethod
    def contains_pii(cls, text: str) -> bool:
        """
        Check if text contains any PII without modifying it.
        
        Args:
            text: Input text to check
            
        Returns:
            True if PII is detected, False otherwise
        """
        if not text:
            return False
            
        for pattern, _ in cls.PATTERNS:
            if pattern.search(text):
                return True
        return False
    
    @classmethod
    def get_pii_types(cls, text: str) -> list[str]:
        """
        Get list of PII types found in text.
        
        Args:
            text: Input text to analyze
            
        Returns:
            List of PII type names found
        """
        if not text:
            return []
            
        found = []
        type_names = ['EMAIL', 'PHONE', 'PHONE', 'URL', 'URL', 'SSN', 'CARD', 'CARD', 'IP', 'DATE']
        
        for i, (pattern, _) in enumerate(cls.PATTERNS):
            if pattern.search(text):
                pii_type = type_names[i] if i < len(type_names) else 'UNKNOWN'
                if pii_type not in found:
                    found.append(pii_type)
        
        return found
