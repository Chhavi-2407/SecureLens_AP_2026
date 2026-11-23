import json
import sys
from pathlib import Path

from languages.javascript.parser import JavaScriptParser
from code_ast.ast_walker import ASTWalker

from analysis.source_detector import JavaScriptSourceDetector
from analysis.data_flow import JavaScriptDataFlowAnalyzer
from analysis.taint_analysis import TaintAnalyzer
from analysis.sink_detector import JavaScriptSinkDetector

from rules.rule_engine import RuleEngine


class SecureLensScanner:
    """
    Main SecureLens static analysis engine.

    Current version supports:
        - JavaScript
        - SQL Injection detection

    The architecture is designed to support additional
    languages and security rules later.
    """

    def __init__(self):

        # ---------------------------------------------
        # Parser
        # ---------------------------------------------

        self.parser = JavaScriptParser()

        # ---------------------------------------------
        # AST
        # ---------------------------------------------

        self.walker = ASTWalker()

        # ---------------------------------------------
        # Analysis components
        # ---------------------------------------------

        self.source_detector = JavaScriptSourceDetector()

        self.data_flow = JavaScriptDataFlowAnalyzer()

        self.sink_detector = JavaScriptSinkDetector()

        # ---------------------------------------------
        # Rule engine
        # ---------------------------------------------

        self.rule_engine = RuleEngine()

    # =================================================
    # ANALYZE SOURCE CODE
    # =================================================

    def analyze(self, code, file_path=None):
        """
        Analyze JavaScript source code.

        Returns a list of Finding objects.
        """

        # ---------------------------------------------
        # STEP 1 — PARSE
        # ---------------------------------------------

        tree = self.parser.parse(code)

        # ---------------------------------------------
        # STEP 2 — SOURCE DETECTION
        # ---------------------------------------------

        sources = []

        for node in self.walker.walk(tree.root_node):

            result = self.source_detector.detect(node)

            if result:
                sources.append(result)

        # ---------------------------------------------
        # STEP 3 — DATA FLOW
        # ---------------------------------------------

        variables = self.data_flow.analyze(
            tree.root_node
        )

        # ---------------------------------------------
        # STEP 4 — TAINT ANALYSIS
        # ---------------------------------------------

        taint_analyzer = TaintAnalyzer(
            sources
        )

        tainted_variables = taint_analyzer.analyze(
            tree.root_node
        )

        # ---------------------------------------------
        # STEP 5 — SINK DETECTION
        # ---------------------------------------------

        sinks = []

        for node in self.walker.walk(tree.root_node):

            result = self.sink_detector.detect(node)

            if result:
                sinks.append(result)

        # ---------------------------------------------
        # STEP 6 — RULE ENGINE
        # ---------------------------------------------

        findings = self.rule_engine.run(
    sinks=sinks,
    tainted_variables=tainted_variables,
    variables=variables,
    code=code,
)

        # ---------------------------------------------
        # ADD FILE INFORMATION
        # ---------------------------------------------

        for finding in findings:

            if file_path is not None:
                finding.file_path = str(file_path)

        return findings

    # =================================================
    # ANALYZE FILE
    # =================================================

    def analyze_file(self, file_path):
        """
        Read a source file and analyze it.
        """

        path = Path(file_path)

        if not path.exists():

            raise FileNotFoundError(
                f"File not found: {file_path}"
            )

        if not path.is_file():

            raise ValueError(
                f"Path is not a file: {file_path}"
            )

        # ---------------------------------------------
        # Read source code
        # ---------------------------------------------

        code = path.read_text(
            encoding="utf-8"
        )

        # ---------------------------------------------
        # Analyze
        # ---------------------------------------------

        findings = self.analyze(
            code=code,
            file_path=path,
        )

        return findings

    # =================================================
    # CREATE JSON REPORT
    # =================================================

    def generate_report(self, findings, file_path=None):
        """
        Convert findings into a JSON-compatible report.
        """

        report = {
            "scanner": "SecureLens",
            "version": "0.1.0",
            "language": "javascript",
            "file": str(file_path) if file_path else None,
            "findings": [
                finding.to_dict()
                for finding in findings
            ],
            "summary": {
                "total_findings": len(findings),
                "high": 0,
                "medium": 0,
                "low": 0,
            },
        }

        # ---------------------------------------------
        # Calculate severity statistics
        # ---------------------------------------------

        for finding in findings:

            severity = finding.severity.upper()

            if severity == "HIGH":

                report["summary"]["high"] += 1

            elif severity == "MEDIUM":

                report["summary"]["medium"] += 1

            elif severity == "LOW":

                report["summary"]["low"] += 1

        return report


# =====================================================
# COMMAND LINE INTERFACE
# =====================================================

def main():

    # ---------------------------------------------
    # Validate arguments
    # ---------------------------------------------

    if len(sys.argv) < 2:

        print(
            "Usage: python scanner.py <file>"
        )

        sys.exit(1)

    file_path = sys.argv[1]

    # ---------------------------------------------
    # Initialize scanner
    # ---------------------------------------------

    scanner = SecureLensScanner()

    try:

        # -----------------------------------------
        # Analyze file
        # -----------------------------------------

        findings = scanner.analyze_file(
            file_path
        )

        # -----------------------------------------
        # Generate report
        # -----------------------------------------

        report = scanner.generate_report(
            findings,
            file_path
        )

        # -----------------------------------------
        # Output JSON
        # -----------------------------------------

        print(
            json.dumps(
                report,
                indent=2
            )
        )

    except Exception as error:

        error_report = {
            "scanner": "SecureLens",
            "success": False,
            "error": str(error),
        }

        print(
            json.dumps(
                error_report,
                indent=2
            )
        )

        sys.exit(1)


if __name__ == "__main__":
    main()