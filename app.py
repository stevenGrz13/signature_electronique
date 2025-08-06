from main.key_utils import generate_rsa_keys
from main.authority import register_user
from main.signer import sign_document
from main.verifier import verify_signature

generate_rsa_keys("user1")

with open("keys/user1_public.pem", "r") as f:
    register_user("user1", f.read())

with open("documents/document.txt", "w") as f:
    f.write("Ceci est un document à signer.")

sign_document("user1", "documents/document.txt")
verify_signature("user1", "documents/document.txt", "documents/document_signature.json")