class BaseRule:
    """
    Base class for all SecureLens security rules.
    """

    VULNERABILITY_TYPE = None
    CWE = None
    SEVERITY = None

    def check(self, context):
        """
        Every security rule must implement this method.
        """
        raise NotImplementedError(
            "Security rules must implement check()"
        )