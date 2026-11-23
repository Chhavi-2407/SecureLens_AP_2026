import re

from reporting.finding import Finding


class HardcodedSecretsRule:
    """
    Detects likely credentials embedded directly in JavaScript source code.

    This is a heuristic static-analysis rule. It does not validate whether a
    detected credential is active, and it intentionally ignores common
    placeholder values.
    """

    SECRET_NAME_PATTERN = re.compile(
        r"(?:api[_-]?key|access[_-]?token|auth[_-]?token|"
        r"refresh[_-]?token|client[_-]?secret|app[_-]?secret|"
        r"secret[_-]?key|password|passwd|pwd|private[_-]?key|"
        r"database[_-]?url|db[_-]?url)",
        re.IGNORECASE,
    )

    # Recognizable token formats. These are useful even when the variable
    # name is generic, e.g. const credential = "ghp_...".
    TOKEN_PATTERNS = [
        re.compile(r"\bAKIA[0-9A-Z]{16}\b"),                 # AWS access key ID
        re.compile(r"\bgh[pousr]_[A-Za-z0-9]{20,}\b"),       # GitHub token
        re.compile(r"\bsk_live_[A-Za-z0-9]{12,}\b"),         # Live secret key
        re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{10,}\b"),
    ]

    PLACEHOLDERS = {
        "", "your_api_key", "your-api-key", "api_key",
        "changeme", "change_me", "replace_me", "replace-this",
        "placeholder", "your_password", "password",
        "example", "test", "xxxxx", "********",
    }

    SECRET_VALUE_PATTERN = re.compile(
        r"""(?P<quote>['"`])(?P<value>[^'"`\r\n]{4,})(?P=quote)"""
    )

    def _is_placeholder(self, value):
        normalized = value.strip().lower()
        if normalized in self.PLACEHOLDERS:
            return True
        if normalized.startswith(("your_", "your-", "<", "${", "process.env")):
            return True
        if normalized in {"undefined", "null", "none"}:
            return True
        return False

    def _has_token_format(self, value):
        return any(pattern.search(value) for pattern in self.TOKEN_PATTERNS)

    def check_code(self, code):
        findings = []
        seen = set()

        for line_number, line in enumerate(code.splitlines(), start=1):
            # Avoid reporting environment-variable references as hardcoded
            # values. Also avoid comments being treated as code.
            stripped = line.strip()
            if not stripped or stripped.startswith(("//", "*")):
                continue

            matches = list(self.SECRET_VALUE_PATTERN.finditer(line))
            if not matches:
                continue

            name_match = self.SECRET_NAME_PATTERN.search(line)
            token_match = any(
                self._has_token_format(match.group("value"))
                for match in matches
            )

            if not name_match and not token_match:
                continue

            for match in matches:
                value = match.group("value").strip()
                if self._is_placeholder(value):
                    continue

                # Do not flag values that are clearly environment lookups.
                if "process.env" in line or "import.meta.env" in line:
                    continue

                key = (line_number, value)
                if key in seen:
                    continue
                seen.add(key)

                variable_name = (
                    name_match.group(0) if name_match else "credential"
                )
                findings.append(
                    Finding(
                        vulnerability_type="HARDCODED_SECRET",
                        cwe="CWE-798",
                        severity="HIGH",
                        confidence=0.90 if name_match else 0.85,
                        message=(
                            f"Potential hardcoded secret assigned to "
                            f"'{variable_name}'. Credentials embedded in "
                            f"source code can be exposed through repositories, "
                            f"build artifacts, or client-side bundles."
                        ),
                        recommendation=(
                            "Remove the credential from source code, rotate it "
                            "if it may have been exposed, and load secrets from "
                            "environment variables or a managed secret store. "
                            "Never expose private credentials in frontend code."
                        ),
                        line=line_number,
                        source=None,
                        sink="hardcoded credential assignment",
                        source_type="HARDCODED_SECRET",
                        argument=variable_name,
                    )
                )

        return findings
