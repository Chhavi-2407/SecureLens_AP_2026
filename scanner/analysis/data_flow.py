class JavaScriptDataFlowAnalyzer:
    """
    Basic JavaScript data-flow analyzer.

    Tracks relationships such as:

        const userInput = req.query.id;

    resulting in:

        userInput -> req.query.id
    """

    def __init__(self):
        self.variables = {}

    def analyze(self, root_node):
        """
        Walk through the AST and build a variable map.
        """

        self.variables = {}

        self._visit(root_node)

        return self.variables

    def _visit(self, node):
        """
        Recursively inspect AST nodes.
        """

        if node.type == "variable_declarator":
            self._handle_variable_declaration(node)

        for child in node.named_children:
            self._visit(child)

    def _handle_variable_declaration(self, node):
        """
        Handle:

            const variable = value;
        """

        name_node = node.child_by_field_name("name")
        value_node = node.child_by_field_name("value")

        if not name_node or not value_node:
            return

        variable_name = name_node.text.decode("utf-8")
        value = value_node.text.decode("utf-8")

        self.variables[variable_name] = {
            "expression": value,
            "line": node.start_point.row + 1,
        }