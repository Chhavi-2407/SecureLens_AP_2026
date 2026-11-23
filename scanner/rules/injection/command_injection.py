
import re

from reporting.finding import Finding


class CommandInjectionRule:
    """
    Detects untrusted input reaching shell command execution functions.
    """

    SOURCE_PATTERNS = (
        "req.query",
        "req.body",
        "req.params",
        "req.headers",
        "req.cookies",
        "process.argv",
    )

    COMMAND_SINK_TYPES = {
        "COMMAND_EXECUTION",
    }

    def check(self, sink, tainted_variables, variables):
        if sink.get("sink_type") not in self.COMMAND_SINK_TYPES:
            return None

        arguments = sink.get("arguments", [])
        if not arguments:
            return None

        # Join all arguments because shell command strings can be
        # assembled through concatenation or template literals.
        argument_text = " ".join(arguments)

        # Direct user-input source in the command.
        direct_source = any(
            source in argument_text
            for source in self.SOURCE_PATTERNS
        )

        # Tainted variable flowing into the command.
        tainted_variable = None

        for variable in tainted_variables:
            if re.search(
                rf"\b{re.escape(variable)}\b",
                argument_text,
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
            vulnerability_type="COMMAND_INJECTION",
            cwe="CWE-78",
            severity="HIGH",
            confidence=0.90,
            message=(
                f"Untrusted input '{source_name}' reaches command "
                f"execution function '{sink.get('function')}'. "
                "This may allow an attacker to execute unintended "
                "system commands."
            ),
            recommendation=(
                "Avoid constructing shell commands using user input. "
                "Prefer child_process.execFile() or spawn() with a "
                "fixed executable and separate validated arguments. "
                "Avoid enabling shell mode with untrusted input, "
                "and validate inputs against strict allowlists."
            ),
            line=sink.get("line"),
            source=source_name,
            sink=sink.get("function"),
            source_type="USER_INPUT",
            argument=argument_text,
        )
