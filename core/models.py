from django.contrib.auth.models import AbstractUser, UserManager
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

# Import chat models
from .models_chat import ChatRoom, Message
# Import notification models
from .models_notification import Notification

class CustomUserManager(UserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        extra_fields.setdefault('username', None)
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

class Offer(models.Model):
    class JobStatus(models.TextChoices):
        OPEN = "OPEN", "Offen"
        IN_PROGRESS = "IN_PROGRESS", "In Arbeit"
        COMPLETED = "COMPLETED", "Abgeschlossen"
    craftsman = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="offers_created",
        limit_choices_to={'role': User.Role.CRAFTSMAN},
        verbose_name="Handwerker"
    )
    title = models.CharField(max_length=255, verbose_name="Titel")
    description = models.TextField(verbose_name="Beschreibung")
    trade = models.CharField(max_length=100, verbose_name="Gewerbe")
    zip_code = models.CharField(max_length=10, verbose_name="PLZ")
    status = models.CharField(max_length=20, choices=JobStatus.choices, default=JobStatus.OPEN, verbose_name="Status")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"'{self.title}' von {self.craftsman.email}"

class Inquiry(models.Model):
    class ApplicationStatus(models.TextChoices):
        SUBMITTED = "SUBMITTED", "Eingereicht"
        ACCEPTED = "ACCEPTED", "Angenommen"
        REJECTED = "REJECTED", "Abgelehnt"
    offer = models.ForeignKey(Offer, on_delete=models.CASCADE, related_name="inquiries", verbose_name="Angebot")
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="inquiries",
        limit_choices_to={'role': User.Role.CUSTOMER},
        verbose_name="Kunde"
    )
    status = models.CharField(max_length=20, choices=ApplicationStatus.choices, default=ApplicationStatus.SUBMITTED, verbose_name="Anfragenstatus")
    cover_letter = models.TextField(blank=True, verbose_name="Anschreiben")
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        constraints = [models.UniqueConstraint(fields=['offer', 'customer'], name='unique_offer_inquiry')]
        ordering = ['-created_at']
    def __str__(self):
        return f"Anfrage von {self.customer.email} für '{self.offer.title}'"

# Punkt 5: Das Review-Modell
# ===========================
class Review(models.Model):
    """
    Modell für eine Bewertung, die ein Kunde für ein abgeschlossenes Angebot abgibt.
    """
    offer = models.OneToOneField(Offer, on_delete=models.CASCADE, related_name="review", verbose_name="Angebot")
    rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], verbose_name="Bewertung (1-5 Sterne)")
    comment = models.TextField(blank=True, verbose_name="Kommentar")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.rating}-Sterne Bewertung für Angebot '{self.offer.title}'"
