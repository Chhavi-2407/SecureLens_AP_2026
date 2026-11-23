import tree_sitter_javascript as ts_javascript
from tree_sitter import Language, Parser


class JavaScriptParser:
    def __init__(self):
        self.language = Language(ts_javascript.language())
        self.parser = Parser(self.language)

    def parse(self, code):
        """
        Parse JavaScript source code and return the AST.
        """
        return self.parser.parse(code.encode("utf-8"))

    def print_tree(self, node, depth=0):
        """
        Recursively print the AST structure.
        """

        indentation = "  " * depth

        print(f"{indentation}{node.type}")

        for child in node.named_children:
            self.print_tree(child, depth + 1)