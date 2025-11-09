from django.contrib.auth.models import AbstractUser, UserManager
from django.db import models
from django.conf import settings


class CustomUserManager(UserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True, verbose_name="E-Mail-Adresse")

    class Role(models.TextChoices):
        CUSTOMER = "CUSTOMER", "Kunde"
        CRAFTSMAN = "CRAFTSMAN", "Handwerker"
        ADMIN = "ADMIN", "Administrator"

    role = models.CharField(max_length=50, choices=Role.choices, default=Role.CUSTOMER, verbose_name="Benutzerrolle")

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = CustomUserManager()

    def __str__(self):
        return self.email


class CustomerProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, primary_key=True, related_name="customer_profile", verbose_name="Benutzer")
    phone_number = models.CharField(max_length=20, blank=True, verbose_name="Telefonnummer")
    address = models.TextField(blank=True, verbose_name="Adresse")

    def __str__(self):
        return f"Kundenprofil von {self.user.email}"


class CraftsmanProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, primary_key=True, related_name="craftsman_profile", verbose_name="Benutzer")
    company_name = models.CharField(max_length=255, blank=True, verbose_name="Firmenname")
    trade = models.CharField(max_length=100, blank=True, verbose_name="Gewerbe")
    service_area_zip = models.CharField(max_length=50, blank=True, verbose_name="PLZ-Einsatzgebiet")
    is_verified = models.BooleanField(default=False, verbose_name="Verifiziert")

    def __str__(self):
        return f"Handwerkerprofil von {self.user.email}"
