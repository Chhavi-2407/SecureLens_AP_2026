
import re


class TaintAnalyzer:
    """
    AST-based taint propagation for JavaScript.

    Tracks data originating from untrusted sources and
    recognizes simple early-return string validation guards.
    """

    def __init__(self, sources):
        self.sources = sources
        self.tainted_expressions = set()
        self.tainted_variables = set()
        self.validated_variables = set()

    def analyze(self, root_node):
        self._walk(root_node)
        return self.tainted_variables

    def _walk(self, node):

        # Process statements in order so validation guards
        # can affect subsequent statements in the same block.
        if node.type in ("program", "statement_block"):
            for child in node.named_children:
                self._walk(child)

                if child.type == "if_statement":
                    validated = self._get_validated_variables(child)

                    for variable in validated:
                        self.validated_variables.add(variable)
                        self.tainted_variables.discard(variable)
                        self.tainted_expressions.discard(variable)

            return

        # Variable declaration
        if node.type == "variable_declarator":
            name_node = node.child_by_field_name("name")
            value_node = node.child_by_field_name("value")

            if name_node and value_node:
                variable_name = self._node_text(name_node)

                if self._is_tainted(value_node):
                    if variable_name not in self.validated_variables:
                        self.tainted_variables.add(variable_name)
                        self.tainted_expressions.add(variable_name)

        # Assignment
        elif node.type == "assignment_expression":
            left_node = node.child_by_field_name("left")
            right_node = node.child_by_field_name("right")

            if left_node and right_node:
                variable_name = self._node_text(left_node)

                if self._is_tainted(right_node):
                    if variable_name not in self.validated_variables:
                        self.tainted_variables.add(variable_name)
                        self.tainted_expressions.add(variable_name)

                elif variable_name in self.validated_variables:
                    # A new assignment may invalidate previous validation.
                    self.validated_variables.discard(variable_name)
                    self.tainted_variables.discard(variable_name)

        # Continue recursively
        for child in node.named_children:
            self._walk(child)

    def _get_validated_variables(self, if_node):
        """
        Recognize an early-return guard of the form:

        if (typeof username !== "string") {
            return ...
        }

        This is a narrow heuristic, not general proof of safety.
        """

        condition = if_node.child_by_field_name("condition")
        consequence = if_node.child_by_field_name("consequence")

        if not condition or not consequence:
            return set()

        condition_text = self._node_text(condition)

        match = re.search(
            r"""typeof\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*!==?\s*(['"])string\2""",
            condition_text,
        )

        if not match:
            return set()

        variable = match.group(1)

        # Only accept guards whose rejected branch exits.
        if not self._contains_exit(consequence):
            return set()

        return {variable}

    def _contains_exit(self, node):
        """
        Check whether the guard's consequence contains
        a return or throw statement.
        """

        if node.type in ("return_statement", "throw_statement"):
            return True

        # Do not accept an exit that only occurs inside
        # a nested function.
        if node.type in (
            "function_declaration",
            "function_expression",
            "arrow_function",
        ):
            return False

        return any(
            self._contains_exit(child)
            for child in node.named_children
        )

    def _is_tainted(self, node):

        expression = self._node_text(node)

        # Direct source
        for source in self.sources:
            source_expression = source.get("expression", "")

            if self._contains_source(node, source_expression):
                return True

        # Existing tainted variable
        for variable in self.tainted_variables:
            if variable in self.validated_variables:
                continue

            if self._contains_identifier(node, variable):
                return True

        return False

    def _contains_source(self, node, source_expression):
        expression = self._node_text(node)
        return bool(source_expression) and source_expression in expression

    def _contains_identifier(self, node, variable):

        if node.type == "identifier":
            return self._node_text(node) == variable

        return any(
            self._contains_identifier(child, variable)
            for child in node.named_children
        )

    @staticmethod
    def _node_text(node):
        return node.text.decode("utf-8")
