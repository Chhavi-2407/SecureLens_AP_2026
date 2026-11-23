class ASTWalker:
    """
    Walk through a Tree-sitter AST recursively.
    """

    def walk(self, node, depth=0):
        """
        Recursively visit every named node in the AST.
        """

        yield node

        for child in node.named_children:
            yield from self.walk(child, depth + 1)