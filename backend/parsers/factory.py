from .dkb import DKBParser
from .sparkasse import SparkasseParser

class ParserFactory:
    @staticmethod
    def get_parser(content: str):
        if "Gläubiger-ID" in content or "Zahlungsempfänger*in" in content:
            return DKBParser()
        if "Auftragskonto" in content or "Buchungstag" in content:
            return SparkasseParser()
        
        raise ValueError("Bankformat konnte nicht identifiziert werden.")

    @staticmethod
    def parse(content: str):
        parser = ParserFactory.get_parser(content)
        return parser.parse(content)
