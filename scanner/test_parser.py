from languages.javascript.parser import JavaScriptParser
from code_ast.ast_walker import ASTWalker

from analysis.source_detector import JavaScriptSourceDetector
from analysis.data_flow import JavaScriptDataFlowAnalyzer
from analysis.taint_analysis import TaintAnalyzer
from analysis.sink_detector import JavaScriptSinkDetector

from rules.rule_engine import RuleEngine


# ==================================================
# INITIALIZE ANALYSIS COMPONENTS
# ==================================================

parser = JavaScriptParser()
walker = ASTWalker()

source_detector = JavaScriptSourceDetector()
data_flow = JavaScriptDataFlowAnalyzer()
sink_detector = JavaScriptSinkDetector()

rule_engine = RuleEngine()


# ==================================================
# COMPLETE ANALYSIS PIPELINE
# ==================================================

def analyze_code(code):
    """
    Run the complete SecureLens static analysis pipeline.

    Pipeline:

    Source Code
        ↓
    AST Parsing
        ↓
    Source Detection
        ↓
    Data Flow Analysis
        ↓
    Taint Analysis
        ↓
    Sink Detection
        ↓
    Rule Engine
        ↓
    Security Findings
    """

    # ------------------------------------------------
    # STEP 1 — PARSE CODE
    # ------------------------------------------------

    tree = parser.parse(code)

    # ------------------------------------------------
    # STEP 2 — SOURCE DETECTION
    # ------------------------------------------------

    sources = []

    for node in walker.walk(tree.root_node):

        result = source_detector.detect(node)

        if result:
            sources.append(result)

    # ------------------------------------------------
    # STEP 3 — DATA FLOW ANALYSIS
    # ------------------------------------------------

    variables = data_flow.analyze(
        tree.root_node
    )

    # ------------------------------------------------
    # STEP 4 — TAINT ANALYSIS
    # ------------------------------------------------

    taint_analyzer = TaintAnalyzer(
        sources
    )

    tainted_variables = taint_analyzer.analyze(
        tree.root_node
    )

    # ------------------------------------------------
    # STEP 5 — SINK DETECTION
    # ------------------------------------------------

    sinks = []

    for node in walker.walk(tree.root_node):

        result = sink_detector.detect(node)

        if result:
            sinks.append(result)

    # ------------------------------------------------
    # STEP 6 — RULE ENGINE
    # ------------------------------------------------

    findings = rule_engine.run(
        sinks=sinks,
        tainted_variables=tainted_variables,
        variables=variables,
    )

    # ------------------------------------------------
    # RETURN FINDINGS
    # ------------------------------------------------

    return findings


# ==================================================
# TEST 1 — VULNERABLE CODE
# ==================================================

vulnerable_code = """
const userInput = req.query.id;

const id = userInput;

const query = "SELECT * FROM users WHERE id=" + id;

db.query(query);
"""


# ==================================================
# TEST 2 — SAFE PARAMETERIZED QUERY
# ==================================================

safe_code = """
const userInput = req.query.id;

db.query(
    "SELECT * FROM users WHERE id = ?",
    [userInput]
);
"""


# ==================================================
# RUN TEST 1
# ==================================================

print("\n========================================")
print("TEST 1 — VULNERABLE CODE")
print("========================================\n")

findings = analyze_code(
    vulnerable_code
)

if findings:

    for finding in findings:
        print(finding.to_dict())

else:

    print("No vulnerabilities detected.")


# ==================================================
# RUN TEST 2
# ==================================================

print("\n========================================")
print("TEST 2 — PARAMETERIZED QUERY")
print("========================================\n")

findings = analyze_code(
    safe_code
)

if findings:

    for finding in findings:
        print(finding.to_dict())

else:

    print("No vulnerabilities detected.")