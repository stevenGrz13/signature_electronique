from cryptography.hazmat.primitives import hashes
import json
import base64
from authority import load_registry
from key_utils import generate_rsa_keys
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import serialization

def create_certificate(username):
    with open(f"keys/CA_private.pem", "rb") as f:
        private_key = serialization.load_pem_private_key(f.read(), password=None)

    registry = load_registry()
    public_key_pem = registry[username]

    to_sign = f"{username}{public_key_pem}".encode()

    digest = hashes.Hash(hashes.SHA256())
    digest.update(to_sign)
    hash_value = digest.finalize()

    signature = private_key.sign(
        hash_value,
        padding.PKCS1v15(),
        hashes.SHA256()
    )

    cert = {
        "username": username,
        "public_key": public_key_pem,
        "CA_signature": base64.b64encode(signature).decode()
    }

    with open(f"certs/{username}_cert.json", "w") as f:
        json.dump(cert, f, indent=4)

    print("Certificat généré.")

# À appeler après avoir créé CA_private.pem