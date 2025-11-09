from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Offer(models.Model):
    class JobStatus(models.TextChoices):
        OPEN = "OPEN", "Offen"
        IN_PROGRESS = "IN_PROGRESS", "In Arbeit"
        COMPLETED = "COMPLETED", "Abgeschlossen"

    craftsman = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="offers_created",
        verbose_name="Handwerker",
    )
    title = models.CharField(max_length=255, verbose_name="Titel")
    description = models.TextField(verbose_name="Beschreibung")
    trade = models.CharField(max_length=100, verbose_name="Gewerbe")
    zip_code = models.CharField(max_length=10, verbose_name="PLZ")
    status = models.CharField(max_length=20, choices=JobStatus.choices, default=JobStatus.OPEN, verbose_name="Status")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"'{self.title}'"


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
        verbose_name="Kunde",
    )
    status = models.CharField(max_length=20, choices=ApplicationStatus.choices, default=ApplicationStatus.SUBMITTED, verbose_name="Anfragenstatus")
    cover_letter = models.TextField(blank=True, verbose_name="Anschreiben")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['offer', 'customer'], name='unique_offer_inquiry')]
        ordering = ['-created_at']

    def __str__(self):
        return f"Anfrage für '{self.offer.title}'"


class Review(models.Model):
    offer = models.OneToOneField(Offer, on_delete=models.CASCADE, related_name="review", verbose_name="Angebot")
    rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], verbose_name="Bewertung (1-5 Sterne)")
    comment = models.TextField(blank=True, verbose_name="Kommentar")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.rating}-Sterne Bewertung für Angebot '{self.offer.title}'"