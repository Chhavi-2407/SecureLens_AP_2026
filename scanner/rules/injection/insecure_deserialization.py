
import re

from reporting.finding import Finding


class InsecureDeserializationRule:
    """
    Detects untrusted input reaching unsafe JavaScript deserialization.
    """

    DESERIALIZATION_SINK_TYPES = {
        "UNSAFE_DESERIALIZATION",
    }

    SOURCE_PATTERNS = (
        "req.query",
        "req.body",
        "req.params",
        "req.headers",
        "req.cookies",
        "process.argv",
    )

    def check(self, sink, tainted_variables, variables):

        if sink.get("sink_type") not in self.DESERIALIZATION_SINK_TYPES:
            return None

        arguments = sink.get("arguments", [])

        if not arguments:
            return None

        serialized_input = arguments[0]

        direct_source = any(
            source in serialized_input
            for source in self.SOURCE_PATTERNS
        )

        tainted_variable = None

        for variable in tainted_variables:

            if re.search(
                rf"\b{re.escape(variable)}\b",
                serialized_input,
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
            vulnerability_type="INSECURE_DESERIALIZATION",
            cwe="CWE-502",
            severity="HIGH",
            confidence=0.90,

            message=(
                f"Untrusted input '{source_name}' reaches an unsafe "
                "deserialization operation. Crafted serialized data "
                "may cause unintended object behavior or code execution, "
                "depending on the library."
            ),

            recommendation=(
                "Avoid deserializing untrusted data with unsafe "
                "deserialization libraries. Prefer JSON or another "
                "format with a safe parser, validate the resulting "
                "data against a strict schema, and avoid using "
                "node-serialize's unserialize() on untrusted input."
            ),

            line=sink.get("line"),
            source=source_name,
            sink=sink.get("function"),
            source_type="USER_INPUT",
            argument=serialized_input,
        )
