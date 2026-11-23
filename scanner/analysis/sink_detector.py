
class JavaScriptSinkDetector:
    """
    Detect dangerous JavaScript operations used by security rules.
    """

    SQL_SINKS = {
        "db.query": "DATABASE_QUERY",
        "db.execute": "DATABASE_EXECUTE",
        "connection.query": "DATABASE_QUERY",
        "connection.execute": "DATABASE_EXECUTE",
        "pool.query": "DATABASE_QUERY",
        "pool.execute": "DATABASE_EXECUTE",
    }

    XSS_CALL_SINKS = {
        "document.write": "DOM_WRITE",
        "document.writeln": "DOM_WRITE",
        "insertAdjacentHTML": "DOM_INSERT_ADJACENT_HTML",
    }

    COMMAND_SINKS = {
        "exec": "COMMAND_EXECUTION",
        "execSync": "COMMAND_EXECUTION",
    }

    FILESYSTEM_SINKS = {
        "readFile": "FILE_READ",
        "readFileSync": "FILE_READ",
        "createReadStream": "FILE_READ",
        "open": "FILE_OPEN",
        "openSync": "FILE_OPEN",
        "access": "FILE_ACCESS",
        "accessSync": "FILE_ACCESS",
    }

    DESERIALIZATION_SINKS = {
        "unserialize": "UNSAFE_DESERIALIZATION",
    }

    SSRF_SINKS = {
        "get": "HTTP_REQUEST",
        "post": "HTTP_REQUEST",
        "request": "HTTP_REQUEST",
        "fetch": "HTTP_REQUEST",
    }

    REDIRECT_SINKS = {
        "redirect": "OPEN_REDIRECT",
    }

    # NoSQL Injection sinks
    NOSQL_SINKS = {
        "find": "NOSQL_QUERY",
        "findOne": "NOSQL_QUERY",
        "findOneAndUpdate": "NOSQL_QUERY",
        "updateOne": "NOSQL_QUERY",
        "updateMany": "NOSQL_QUERY",
        "deleteOne": "NOSQL_QUERY",
        "deleteMany": "NOSQL_QUERY",
    }

    # Weak Cryptography sinks
    CRYPTO_SINKS = {
        "createHash": "CRYPTO_HASH",
        "createHmac": "CRYPTO_HASH",
        "createCipher": "CRYPTO_CIPHER",
        "createCipheriv": "CRYPTO_CIPHER",
    }

    def detect(self, node):
        if node.type == "call_expression":
            return self._detect_call(node)

        if node.type == "assignment_expression":
            return self._detect_html_assignment(node)

        return None

    def _detect_call(self, node):
        function_node = node.child_by_field_name("function")

        if not function_node:
            return None

        function_name = function_node.text.decode("utf-8")
        short_name = function_name.split(".")[-1]

        arguments = self._get_arguments(node)
        line = node.start_point.row + 1

        # SQL Injection sinks
        sink_type = self.SQL_SINKS.get(function_name)

        if sink_type:
            return self._make_sink(
                sink_type, function_name, arguments, line
            )

        # XSS sinks
        xss_sink_type = self.XSS_CALL_SINKS.get(short_name)

        if xss_sink_type:
            return self._make_sink(
                xss_sink_type, function_name, arguments, line
            )

        # Command Injection sinks
        command_sink_type = self.COMMAND_SINKS.get(short_name)

        if command_sink_type:
            return self._make_sink(
                command_sink_type, function_name, arguments, line
            )

        # Path Traversal sinks
        filesystem_sink_type = self.FILESYSTEM_SINKS.get(short_name)

        if filesystem_sink_type:
            return self._make_sink(
                filesystem_sink_type, function_name, arguments, line
            )

        # Insecure Deserialization sinks
        deserialization_sink_type = (
            self.DESERIALIZATION_SINKS.get(short_name)
        )

        if deserialization_sink_type:
            return self._make_sink(
                deserialization_sink_type,
                function_name,
                arguments,
                line,
            )

        # Server-Side Request Forgery sinks
        ssrf_sink_type = self.SSRF_SINKS.get(short_name)

        if ssrf_sink_type:
            return self._make_sink(
                ssrf_sink_type,
                function_name,
                arguments,
                line,
            )

        # Open Redirect sinks
        redirect_sink_type = self.REDIRECT_SINKS.get(short_name)

        if redirect_sink_type:
            return self._make_sink(
                redirect_sink_type,
                function_name,
                arguments,
                line,
            )

        # NoSQL Injection sinks
        nosql_sink_type = self.NOSQL_SINKS.get(short_name)

        if nosql_sink_type:
            return self._make_sink(
                nosql_sink_type,
                function_name,
                arguments,
                line,
            )

        # Weak Cryptography sinks
        crypto_sink_type = self.CRYPTO_SINKS.get(short_name)

        if crypto_sink_type:
            return self._make_sink(
                crypto_sink_type,
                function_name,
                arguments,
                line,
            )

        return None

    @staticmethod
    def _make_sink(sink_type, function_name, arguments, line):
        return {
            "type": "SINK",
            "sink_type": sink_type,
            "function": function_name,
            "arguments": arguments,
            "line": line,
        }

    def _detect_html_assignment(self, node):
        left_node = node.child_by_field_name("left")
        right_node = node.child_by_field_name("right")

        if not left_node or not right_node:
            return None

        target = left_node.text.decode("utf-8")

        if not (
            target.endswith(".innerHTML")
            or target.endswith(".outerHTML")
        ):
            return None

        return {
            "type": "SINK",
            "sink_type": "DOM_HTML_ASSIGNMENT",
            "function": target,
            "arguments": [
                right_node.text.decode("utf-8")
            ],
            "line": node.start_point.row + 1,
        }

    @staticmethod
    def _get_arguments(node):
        arguments_node = node.child_by_field_name("arguments")

        if not arguments_node:
            return []

        return [
            argument.text.decode("utf-8")
            for argument in arguments_node.named_children
        ]
