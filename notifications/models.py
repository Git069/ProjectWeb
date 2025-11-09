from django.db import models
from django.conf import settings


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('APPLICATION', 'Neue Bewerbung'),
        ('APPLICATION_ACCEPTED', 'Bewerbung angenommen'),
        ('APPLICATION_REJECTED', 'Bewerbung abgelehnt'),
        ('MESSAGE', 'Neue Nachricht'),
        ('JOB_COMPLETED', 'Auftrag abgeschlossen'),
        ('REVIEW', 'Neue Bewertung'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    # Optional links to related objects
    job_id = models.IntegerField(null=True, blank=True)
    application_id = models.IntegerField(null=True, blank=True)
    chat_room_id = models.IntegerField(null=True, blank=True)
    review_id = models.IntegerField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.title}"