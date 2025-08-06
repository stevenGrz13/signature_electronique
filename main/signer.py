from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
import json
import base64
from datetime import datetime

def sign_document(username, file_path):
    with open(f"keys/{username}_private.pem", "rb") as f:
        private_key = serialization.load_pem_private_key(f.read(), password=None)

    with open(file_path, "rb") as f:
        data = f.read()

    digest = hashes.Hash(hashes.SHA256())
    digest.update(data)
    hash_value = digest.finalize()

    signature = private_key.sign(
        hash_value,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256()
    )

    # Sauvegarde brute
    with open("documents/document.sig", "wb") as f:
        f.write(signature)

    # Sauvegarde avec métadonnées
    sig_metadata = {
        "user": username,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "signature": base64.b64encode(signature).decode()
    }

    with open("documents/document_signature.json", "w") as f:
        json.dump(sig_metadata, f, indent=4)

    print("Document signé avec succès.")

# Exemple d’usage
if __name__ == "__main__":
    sign_document("user1", "documents/document.txt")
