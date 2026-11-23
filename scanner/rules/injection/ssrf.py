
import re

from reporting.finding import Finding


class SSRFRule:
    """
    Detect user-controlled URLs reaching HTTP request operations.
    """

    SSRF_SINK_TYPES = {
        "HTTP_REQUEST",
    }

    SOURCE_PATTERNS = (
        "req.query",
        "req.body",
        "req.params",
        "req.headers",
        "req.cookies",
    )

    def check(self, sink, tainted_variables, variables):

        if sink.get("sink_type") not in self.SSRF_SINK_TYPES:
            return None

        arguments = sink.get("arguments", [])

        if not arguments:
            return None

        url_argument = arguments[0]

        direct_source = any(
            source in url_argument
            for source in self.SOURCE_PATTERNS
        )

        tainted_variable = None

        for variable in tainted_variables:
            if re.search(
                rf"\b{re.escape(variable)}\b",
                url_argument,
            ):
                tainted_variable = variable
                break

        if not direct_source and not tainted_variable:
            return None

        source_name = (
            tainted_variable
            if tainted_variable
            else "user-controlled URL"
        )

        return Finding(
            vulnerability_type="SERVER_SIDE_REQUEST_FORGERY",
            cwe="CWE-918",
            severity="HIGH",
            confidence=0.90,
            message=(
                f"User-controlled URL '{source_name}' reaches "
                f"HTTP request function '{sink.get('function')}'. "
                "An attacker may influence requests made by the "
                "server to unintended destinations."
            ),
            recommendation=(
                "Validate URLs against a strict allowlist of permitted "
                "hosts and protocols. Block requests to loopback, private "
                "and link-local network ranges, validate DNS resolution, "
                "and revalidate redirect destinations."
            ),
            line=sink.get("line"),
            source=source_name,
            sink=sink.get("function"),
            source_type="USER_INPUT",
            argument=url_argument,
        )
