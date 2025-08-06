from django import forms

class PublicKeyUploadForm(forms.Form):
    username = forms.CharField(label="Nom d'utilisateur", max_length=100)
    public_key_file = forms.FileField(label="Clé publique (PEM)")

class SignatureVerificationForm(forms.Form):
    username = forms.CharField(label="Nom d'utilisateur", max_length=100)
    document_file = forms.FileField(label="Fichier texte (.txt)")
    signature_file = forms.FileField(label="Fichier de signature (.json)")
