from django.shortcuts import render, redirect
from .forms import PublicKeyUploadForm
import os

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
