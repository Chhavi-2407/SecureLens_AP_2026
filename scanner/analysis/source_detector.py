class JavaScriptSourceDetector:
    """
    Detect potentially untrusted input sources
    in JavaScript AST nodes.
    """

    SOURCE_PATTERNS = {
        "req.query": "HTTP_QUERY_PARAMETER",
        "req.body": "HTTP_REQUEST_BODY",
        "req.params": "HTTP_PATH_PARAMETER",
        "req.headers": "HTTP_HEADER",
        "req.cookies": "HTTP_COOKIE",
    }

    def detect(self, node):
        """
        Detect a complete source expression.

        Example:

            req.query.id

        Tree-sitter represents this as:

            req.query.id
                |
                └── req.query

        We only want the outermost expression.
        """

        if node.type != "member_expression":
            return None

        # If this member_expression is itself contained
        # inside another member_expression, it is a nested
        # part of a larger expression.
        #
        # Example:
        #
        # req.query.id
        # └── req.query
        #
        # We skip req.query and analyze req.query.id instead.

        if node.parent and node.parent.type == "member_expression":
            return None

        text = node.text.decode("utf-8")

        for pattern, source_type in self.SOURCE_PATTERNS.items():

            if text == pattern or text.startswith(pattern + "."):
                return {
                    "type": "SOURCE",
                    "source_type": source_type,
                    "expression": text,
                    "line": node.start_point.row + 1,
                }

        return None