
import re

from reporting.finding import Finding


class PathTraversalRule:
    """
    Detects user-controlled paths reaching filesystem operations.
    """

    FILESYSTEM_SINK_TYPES = {
        "FILE_READ",
        "FILE_OPEN",
        "FILE_ACCESS",
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
        if sink.get("sink_type") not in self.FILESYSTEM_SINK_TYPES:
            return None

        arguments = sink.get("arguments", [])
        if not arguments:
            return None

        # The first argument is the file path for these APIs.
        path_argument = arguments[0]

        direct_source = any(
            source in path_argument
            for source in self.SOURCE_PATTERNS
        )

        tainted_variable = None

        for variable in tainted_variables:
            if re.search(
                rf"\b{re.escape(variable)}\b",
                path_argument,
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
            vulnerability_type="PATH_TRAVERSAL",
            cwe="CWE-22",
            severity="HIGH",
            confidence=0.90,
            message=(
                f"User-controlled path '{source_name}' reaches "
                f"filesystem operation '{sink.get('function')}'. "
                "An attacker may be able to access files outside "
                "the intended directory."
            ),
            recommendation=(
                "Resolve the requested path against a fixed base "
                "directory using path.resolve(), then verify that "
                "the resolved path remains inside that directory. "
                "Use an allowlist of permitted filenames and avoid "
                "trusting raw user-supplied paths."
            ),
            line=sink.get("line"),
            source=source_name,
            sink=sink.get("function"),
            source_type="USER_INPUT",
            argument=path_argument,
        )
