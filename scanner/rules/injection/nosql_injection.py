
import re

from reporting.finding import Finding


class NoSQLInjectionRule:
    """
    Detects user-controlled input reaching NoSQL query operations.
    """

    NOSQL_SINK_TYPES = {
        "NOSQL_QUERY",
    }

    SOURCE_PATTERNS = (
        "req.query",
        "req.body",
        "req.params",
        "req.headers",
        "req.cookies",
    )

    def check(self, sink, tainted_variables, variables):

        if sink.get("sink_type") not in self.NOSQL_SINK_TYPES:
            return None

        arguments = sink.get("arguments", [])

        if not arguments:
            return None

        query_argument = arguments[0]

        direct_source = any(
            source in query_argument
            for source in self.SOURCE_PATTERNS
        )

        tainted_variable = None

        for variable in tainted_variables:
            if re.search(
                rf"\b{re.escape(variable)}\b",
                query_argument,
            ):
                tainted_variable = variable
                break

        if not direct_source and not tainted_variable:
            return None

        source_name = (
            tainted_variable
            if tainted_variable
            else "user-controlled input"
        )

        return Finding(
            vulnerability_type="NOSQL_INJECTION",
            cwe="CWE-943",
            severity="HIGH",
            confidence=0.90,

            message=(
                f"Untrusted input '{source_name}' reaches a NoSQL "
                f"query operation '{sink.get('function')}'. "
                "An attacker may manipulate database query logic."
            ),

            recommendation=(
                "Validate input types and schemas before database "
                "operations. Reject unexpected query operators, "
                "construct database filters from trusted fields, "
                "and avoid passing raw user-controlled objects "
                "directly into database queries."
            ),

            line=sink.get("line"),
            source=source_name,
            sink=sink.get("function"),
            source_type="USER_INPUT",
            argument=query_argument,
        )
