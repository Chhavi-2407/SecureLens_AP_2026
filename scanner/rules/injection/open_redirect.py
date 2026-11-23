
import re

from reporting.finding import Finding


class OpenRedirectRule:
    """
    Detects user-controlled URLs reaching redirect operations.

    Recognizes simple fixed route allowlists to reduce false positives.
    """

    REDIRECT_SINK_TYPES = {
        "OPEN_REDIRECT",
    }

    SOURCE_PATTERNS = (
        "req.query",
        "req.body",
        "req.params",
        "req.headers",
        "req.cookies",
    )

    VARIABLE_PATTERN = re.compile(r"^[A-Za-z_$][A-Za-z0-9_$]*$")

    def _is_allowlisted_redirect(self, argument, variables):
        """
        Recognize patterns such as:

        const safePath = ALLOWED_DESTINATIONS[destination] || "/";
        """

        argument = argument.strip()

        if not self.VARIABLE_PATTERN.fullmatch(argument):
            return False

        variable_info = variables.get(argument)

        if not isinstance(variable_info, dict):
            return False

        expression = variable_info.get("expression", "").strip()

        # Require a lookup from a fixed mapping, with a safe fallback.
        match = re.fullmatch(
            r"([A-Za-z_$][A-Za-z0-9_$]*)"
            r"\s*\[[^\]]+\]\s*\|\|\s*(['\"])/\2",
            expression,
        )

        if not match:
            return False

        mapping_name = match.group(1)
        mapping_info = variables.get(mapping_name)

        if not isinstance(mapping_info, dict):
            return False

        mapping_expression = mapping_info.get(
            "expression", ""
        ).strip()

        if not (
            mapping_expression.startswith("{")
            and mapping_expression.endswith("}")
        ):
            return False

        # Only accept a simple object containing fixed local paths.
        values = re.findall(
            r":\s*(['\"])(.*?)\1",
            mapping_expression,
        )

        if not values:
            return False

        # Every mapping value must be a local absolute route.
        for _, value in values:
            if (
                not value.startswith("/")
                or value.startswith("//")
                or "\\" in value
            ):
                return False

        return True

    def check(self, sink, tainted_variables, variables):

        if sink.get("sink_type") not in self.REDIRECT_SINK_TYPES:
            return None

        arguments = sink.get("arguments", [])

        if not arguments:
            return None

        redirect_argument = arguments[0].strip()

        # Ignore simple allowlisted local redirect destinations.
        if self._is_allowlisted_redirect(
            redirect_argument,
            variables,
        ):
            return None

        direct_source = any(
            source in redirect_argument
            for source in self.SOURCE_PATTERNS
        )

        tainted_variable = None

        for variable in tainted_variables:

            if re.search(
                rf"\b{re.escape(variable)}\b",
                redirect_argument,
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
            vulnerability_type="OPEN_REDIRECT",
            cwe="CWE-601",
            severity="MEDIUM",
            confidence=0.90,

            message=(
                f"User-controlled URL '{source_name}' reaches "
                f"redirect function '{sink.get('function')}'. "
                "An attacker may redirect users to an untrusted "
                "or malicious destination."
            ),

            recommendation=(
                "Avoid redirecting directly to user-provided URLs. "
                "Use an allowlist of permitted destinations or "
                "accept validated internal route identifiers instead "
                "of arbitrary URLs."
            ),

            line=sink.get("line"),
            source=source_name,
            sink=sink.get("function"),
            source_type="USER_INPUT",
            argument=redirect_argument,
        )
