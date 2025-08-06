import json
import os

REGISTRY_PATH = "registry/public_keys.json"

def load_registry():
    if os.path.exists(REGISTRY_PATH):
        with open(REGISTRY_PATH, "r") as f:
            return json.load(f)
    return {}

def save_registry(registry):
    with open(REGISTRY_PATH, "w") as f:
        json.dump(registry, f, indent=4)

def register_user(username, public_key_pem):
    registry = load_registry()
    registry[username] = public_key_pem
    save_registry(registry)
    print(f"{username} enregistré avec succès.")

# Test d’enregistrement
if __name__ == "__main__":
    with open("keys/user1_public.pem", "r") as f:
        pem = f.read()
        register_user("user1", pem)
