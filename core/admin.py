from django.contrib import admin
from .models import User, CustomerProfile, CraftsmanProfile, Job

# Wir registrieren unsere Modelle hier, damit sie im Django Admin-Interface erscheinen.

# Eine einfache Registrierung ist ausreichend, um die Daten zu sehen.
admin.site.register(User)
admin.site.register(CustomerProfile)
admin.site.register(CraftsmanProfile)
admin.site.register(Job)
