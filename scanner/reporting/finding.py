class Finding:
    """
    Represents a security vulnerability detected by SecureLens.
    """

    def __init__(
        self,
        vulnerability_type,
        cwe,
        severity,
        confidence,
        message,
        recommendation,
        line=None,
        source=None,
        sink=None,
        file_path=None,
        source_type=None,
        argument=None,
    ):
        self.vulnerability_type = vulnerability_type
        self.cwe = cwe
        self.severity = severity
        self.confidence = confidence
        self.message = message
        self.recommendation = recommendation

        self.line = line
        self.source = source
        self.sink = sink
        self.file_path = file_path

        self.source_type = source_type
        self.argument = argument

    def to_dict(self):
        """
        Convert the finding into a JSON-serializable dictionary.
        """

        return {
            "type": self.vulnerability_type,
            "cwe": self.cwe,
            "severity": self.severity,
            "confidence": self.confidence,
            "message": self.message,
            "recommendation": self.recommendation,
            "line": self.line,
            "source": self.source,
            "sink": self.sink,
            "file": self.file_path,
            "source_type": self.source_type,
            "argument": self.argument,
        }

    def __repr__(self):
        return (
            f"Finding("
            f"type={self.vulnerability_type!r}, "
            f"severity={self.severity!r}, "
            f"cwe={self.cwe!r}, "
            f"line={self.line!r}"
            f")"
        )