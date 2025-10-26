from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

# Import chat models
from .models_chat import ChatRoom, Message
# Import notification models
from .models_notification import Notification

# ... (User, CustomerProfile, CraftsmanProfile Modelle bleiben unverändert) ...
class User(AbstractUser):
    class Role(models.TextChoices):
        CUSTOMER = "CUSTOMER", "Kunde"
        CRAFTSMAN = "CRAFTSMAN", "Handwerker"
    role = models.CharField(max_length=50, choices=Role.choices, default=Role.CUSTOMER, verbose_name="Benutzerrolle")
    def __str__(self):
        return self.username

class CustomerProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, primary_key=True, related_name="customer_profile", verbose_name="Benutzer")
    phone_number = models.CharField(max_length=20, blank=True, verbose_name="Telefonnummer")
    address = models.TextField(blank=True, verbose_name="Adresse")
    def __str__(self):
        return f"Kundenprofil von {self.user.username}"

class CraftsmanProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, primary_key=True, related_name="craftsman_profile", verbose_name="Benutzer")
    company_name = models.CharField(max_length=255, blank=True, verbose_name="Firmenname")
    trade = models.CharField(max_length=100, blank=True, verbose_name="Gewerbe")
    service_area_zip = models.CharField(max_length=50, blank=True, verbose_name="PLZ-Einsatzgebiet")
    is_verified = models.BooleanField(default=False, verbose_name="Verifiziert")
    def __str__(self):
        return f"Handwerkerprofil von {self.user.username}"

class Job(models.Model):
    class JobStatus(models.TextChoices):
        OPEN = "OPEN", "Offen"
        IN_PROGRESS = "IN_PROGRESS", "In Arbeit"
        COMPLETED = "COMPLETED", "Abgeschlossen"
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="jobs_created", limit_choices_to={'role': User.Role.CUSTOMER}, verbose_name="Kunde")
    title = models.CharField(max_length=255, verbose_name="Titel")
    description = models.TextField(verbose_name="Beschreibung")
    trade = models.CharField(max_length=100, verbose_name="Gewerbe")
    zip_code = models.CharField(max_length=10, verbose_name="PLZ")
    status = models.CharField(max_length=20, choices=JobStatus.choices, default=JobStatus.OPEN, verbose_name="Status")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # NEUES FELD: Speichert, welcher Handwerker den Auftrag bekommen hat.
    assigned_craftsman = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        related_name="jobs_assigned", 
        limit_choices_to={'role': User.Role.CRAFTSMAN}, 
        null=True, 
        blank=True, 
        verbose_name="Zugewiesener Handwerker"
    )
    def __str__(self):
        return f"'{self.title}' von {self.customer.username}"

class JobApplication(models.Model):
    class ApplicationStatus(models.TextChoices):
        SUBMITTED = "SUBMITTED", "Eingereicht"
        ACCEPTED = "ACCEPTED", "Angenommen"
        REJECTED = "REJECTED", "Abgelehnt"
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="applications", verbose_name="Auftrag")
    craftsman = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="applications", limit_choices_to={'role': User.Role.CRAFTSMAN}, verbose_name="Handwerker")
    status = models.CharField(max_length=20, choices=ApplicationStatus.choices, default=ApplicationStatus.SUBMITTED, verbose_name="Bewerbungsstatus")
    cover_letter = models.TextField(blank=True, verbose_name="Anschreiben")
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        constraints = [models.UniqueConstraint(fields=['job', 'craftsman'], name='unique_job_application')]
        ordering = ['-created_at']
    def __str__(self):
        return f"Bewerbung von {self.craftsman.username} für '{self.job.title}'"

# Punkt 5: Das Review-Modell
# ===========================
class Review(models.Model):
    """
    Modell für eine Bewertung, die ein Kunde für einen abgeschlossenen Job abgibt.
    """
    job = models.OneToOneField(Job, on_delete=models.CASCADE, related_name="review", verbose_name="Auftrag")
    rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], verbose_name="Bewertung (1-5 Sterne)")
    comment = models.TextField(blank=True, verbose_name="Kommentar")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.rating}-Sterne Bewertung für Job '{self.job.title}'"
