from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
import base64
import json

from .authority import load_registry

def verify_signature(username, file_path, signature_path):
    registry = load_registry()

    if username not in registry:
        print("Utilisateur non trouvé dans le registre.")
        return

    public_key = serialization.load_pem_public_key(registry[username].encode())

    with open(file_path, "rb") as f:
        data = f.read()

    digest = hashes.Hash(hashes.SHA256())
    digest.update(data)
    hash_value = digest.finalize()

    with open(signature_path, "r") as f:
        sig_data = json.load(f)

    signature = base64.b64decode(sig_data["signature"])

    try:
        public_key.verify(
            signature,
            hash_value,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        print("✅ Signature VALIDE")
    except Exception as e:
        print("❌ Signature INVALIDE")

# Exemple d’usage
if __name__ == "__main__":
    verify_signature("user1", "documents/document.txt", "documents/document_signature.json")
