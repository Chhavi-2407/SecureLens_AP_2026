
from rules.injection.sql_injection import SQLInjectionRule
from rules.xss.xss_rule import XSSRule
from rules.injection.command_injection import CommandInjectionRule
from rules.hardcoded_secrets import HardcodedSecretsRule
from rules.injection.path_traversal import PathTraversalRule

from rules.injection.insecure_deserialization import (
    InsecureDeserializationRule,
)
from rules.injection.ssrf import SSRFRule
from rules.injection.open_redirect import OpenRedirectRule
from rules.injection.nosql_injection import NoSQLInjectionRule
from rules.injection.weak_cryptography import WeakCryptographyRule
class RuleEngine:
    """
    Executes all registered SecureLens security rules.
    """

    def __init__(self):
        # Rules that inspect detected sinks
        self.rules = [
    SQLInjectionRule(),
    XSSRule(),
    CommandInjectionRule(),
    PathTraversalRule(),
    InsecureDeserializationRule(),
    SSRFRule(),
    OpenRedirectRule(),
    NoSQLInjectionRule(),
    WeakCryptographyRule(),
]

        # Rules that inspect the complete source code
        self.code_rules = [
            HardcodedSecretsRule(),
        ]

    def run(self, sinks, tainted_variables, variables, code=None):
        findings = []

        # Execute sink-based rules
        for rule in self.rules:
            for sink in sinks:
                finding = rule.check(
                    sink=sink,
                    tainted_variables=tainted_variables,
                    variables=variables,
                )

                if finding is not None:
                    findings.append(finding)

        # Execute whole-source rules
        if code is not None:
            for rule in self.code_rules:
                findings.extend(rule.check_code(code))

        return findings
