from django import forms

class PublicKeyUploadForm(forms.Form):
    username = forms.CharField(label="Nom d'utilisateur", max_length=100)
    public_key_file = forms.FileField(label="Clé publique (PEM)")
