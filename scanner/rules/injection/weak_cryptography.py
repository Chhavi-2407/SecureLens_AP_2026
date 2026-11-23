
from reporting.finding import Finding


class WeakCryptographyRule:
    """
    Detects the use of weak or deprecated cryptographic algorithms.
    """

    CRYPTO_SINK_TYPES = {
        "CRYPTO_HASH",
        "CRYPTO_CIPHER",
    }

    WEAK_HASHES = {
        "md5",
        "sha1",
    }

    WEAK_CIPHERS = {
        "des",
        "des-ede",
        "des-ede3",
        "rc4",
        "rc2",
    }

    def check(self, sink, tainted_variables, variables):

        sink_type = sink.get("sink_type")

        if sink_type not in self.CRYPTO_SINK_TYPES:
            return None

        arguments = sink.get("arguments", [])

        if not arguments:
            return None

        algorithm = arguments[0].strip().strip("\"'").lower()

        if sink_type == "CRYPTO_HASH":
            if algorithm not in self.WEAK_HASHES:
                return None

            category = "weak hash algorithm"

        elif sink_type == "CRYPTO_CIPHER":
            if algorithm not in self.WEAK_CIPHERS:
                return None

            category = "weak encryption algorithm"

        else:
            return None

        return Finding(
            vulnerability_type="WEAK_CRYPTOGRAPHY",
            cwe="CWE-327",
            severity="HIGH",
            confidence=0.95,

            message=(
                f"The application uses the {algorithm.upper()} "
                f"{category}. This algorithm is considered "
                "insecure for modern security-sensitive operations."
            ),

            recommendation=(
                "Replace MD5 or SHA-1 with SHA-256 or SHA-512 "
                "for general-purpose hashing. For password storage, "
                "use Argon2id, scrypt, or bcrypt. Replace DES, RC4, "
                "and other weak ciphers with authenticated encryption "
                "such as AES-256-GCM."
            ),

            line=sink.get("line"),
            source=algorithm,
            sink=sink.get("function"),
            source_type="CRYPTO_ALGORITHM",
            argument=algorithm,
        )
