from django.shortcuts import render, redirect
from .forms import PublicKeyUploadForm
import os
from .forms import SignatureVerificationForm
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
import base64

REGISTRY_PATH = os.path.join("..", "registry", "public_keys.json")
if not os.path.exists(REGISTRY_PATH):
    with open(REGISTRY_PATH, "w") as f:
        f.write("{}")

import json

def register_view(request):
    if request.method == 'POST':
        form = PublicKeyUploadForm(request.POST, request.FILES)
        if form.is_valid():
            username = form.cleaned_data['username']
            public_key_file = request.FILES['public_key_file']
            pem_data = public_key_file.read().decode()

            # Charger le registre
            with open(REGISTRY_PATH, "r") as f:
                registry = json.load(f)

            registry[username] = pem_data

            # Sauvegarder
            with open(REGISTRY_PATH, "w") as f:
                json.dump(registry, f, indent=4)

            return render(request, "register_success.html", {"username": username})
    else:
        form = PublicKeyUploadForm()
    return render(request, "register.html", {"form": form})

########################

def verify_view(request):
    result = None

    if request.method == 'POST':
        form = SignatureVerificationForm(request.POST, request.FILES)
        if form.is_valid():
            username = form.cleaned_data['username']
            document = request.FILES['document_file'].read()
            signature_json = json.load(request.FILES['signature_file'])

            # Charger le registre
            with open(REGISTRY_PATH, "r") as f:
                registry = json.load(f)

            if username not in registry:
                result = "Utilisateur introuvable."
            else:
                try:
                    public_key = serialization.load_pem_public_key(registry[username].encode())

                    digest = hashes.Hash(hashes.SHA256())
                    digest.update(document)
                    hash_value = digest.finalize()

                    signature = base64.b64decode(signature_json['signature'])

                    public_key.verify(
                        signature,
                        hash_value,
                        padding.PSS(
                            mgf=padding.MGF1(hashes.SHA256()),
                            salt_length=padding.PSS.MAX_LENGTH
                        ),
                        hashes.SHA256()
                    )
                    result = "✅ Signature VALIDE"
                except Exception as e:
                    result = f"❌ Signature INVALIDE ({str(e)})"
    else:
        form = SignatureVerificationForm()

    return render(request, "verify.html", {"form": form, "result": result})
