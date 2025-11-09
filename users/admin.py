from django.contrib import admin
from .models import User, CustomerProfile, CraftsmanProfile

admin.site.register(User)
admin.site.register(CustomerProfile)
admin.site.register(CraftsmanProfile)
