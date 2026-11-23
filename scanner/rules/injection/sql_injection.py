from rules.base_rule import BaseRule
from reporting.finding import Finding


class SQLInjectionRule(BaseRule):

    VULNERABILITY_TYPE = "SQL_INJECTION"
    CWE = "CWE-89"
    SEVERITY = "HIGH"

    SQL_PLACEHOLDERS = (
        "?",
        "$1",
        "$2",
        "$3",
        "%s",
    )

    def check(
        self,
        sink,
        tainted_variables,
        variables,
    ):
        if sink["sink_type"] not in {
            "DATABASE_QUERY",
            "DATABASE_EXECUTE",
        }:
            return None

        arguments = sink["arguments"]

        if not arguments:
            return None

        query_argument = arguments[0]

        if query_argument not in tainted_variables:
            return None

        query_expression = variables.get(
            query_argument,
            {}
        ).get("expression", "")

        has_parameters = len(arguments) >= 2

        if (
            has_parameters
            and self._contains_placeholder(
                query_expression
            )
        ):
            return None

        return Finding(
            vulnerability_type=self.VULNERABILITY_TYPE,
            cwe=self.CWE,
            severity=self.SEVERITY,
            confidence=0.96,
            message=(
                f"Tainted user input reaches SQL sink "
                f"{sink['function']} through variable "
                f"'{query_argument}' without safe "
                f"parameterization."
            ),
            recommendation=(
                "Use parameterized queries or prepared "
                "statements. Do not concatenate untrusted "
                "input directly into SQL statements."
            ),
            line=sink["line"],
            source=None,
            sink=sink["function"],
        )

    def _contains_placeholder(self, expression):

        return any(
            placeholder in expression
            for placeholder in self.SQL_PLACEHOLDERS
        )