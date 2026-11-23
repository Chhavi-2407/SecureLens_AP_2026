import re

from rules.base_rule import BaseRule
from reporting.finding import Finding


class XSSRule(BaseRule):
    """
    Detect untrusted data reaching common DOM HTML injection sinks.

    This is a targeted static-analysis rule, not a complete browser
    security analysis. It currently covers innerHTML/outerHTML,
    document.write/writeln and insertAdjacentHTML.
    """

    VULNERABILITY_TYPE = "CROSS_SITE_SCRIPTING"
    CWE = "CWE-79"
    SEVERITY = "HIGH"

    SOURCE_PATTERNS = (
        "req.query",
        "req.body",
        "req.params",
        "req.headers",
        "req.cookies",
        "location.search",
        "location.hash",
        "window.location",
        "URLSearchParams",
    )

    def check(self, sink, tainted_variables, variables):
        if sink.get("sink_type") not in {
            "DOM_HTML_ASSIGNMENT",
            "DOM_WRITE",
            "DOM_INSERT_ADJACENT_HTML",
        }:
            return None

        arguments = sink.get("arguments", [])
        if not arguments:
            return None

        # insertAdjacentHTML(position, html) uses the second argument.
        candidate_arguments = (
            arguments[1:]
            if sink.get("sink_type") == "DOM_INSERT_ADJACENT_HTML"
            and len(arguments) > 1
            else arguments
        )

        tainted_argument = None
        for argument in candidate_arguments:
            if self._is_tainted(argument, tainted_variables):
                tainted_argument = argument
                break

        if tainted_argument is None:
            return None

        return Finding(
            vulnerability_type=self.VULNERABILITY_TYPE,
            cwe=self.CWE,
            severity=self.SEVERITY,
            confidence=0.90,
            message=(
                f"Potentially untrusted input reaches the unsafe HTML "
                f"operation '{sink['function']}'. This may allow "
                f"attacker-controlled script injection."
            ),
            recommendation=(
                "Avoid inserting untrusted data with innerHTML, outerHTML, "
                "document.write or insertAdjacentHTML. Prefer textContent "
                "or safe DOM APIs. If HTML is required, sanitize it with a "
                "well-maintained HTML sanitizer and validate the input."
            ),
            line=sink.get("line"),
            source=None,
            sink=sink.get("function"),
            source_type="USER_CONTROLLED_INPUT",
            argument=tainted_argument,
        )

    def _is_tainted(self, expression, tainted_variables):
        expression = expression or ""

        # Directly used request/browser input.
        if any(pattern in expression for pattern in self.SOURCE_PATTERNS):
            return True

        # Variables previously marked tainted by TaintAnalyzer.
        for variable in tainted_variables:
            if re.search(rf"\b{re.escape(variable)}\b", expression):
                return True

        return False
