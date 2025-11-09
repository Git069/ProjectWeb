# Chat models for messaging between customers and craftsmen
from django.db import models
from django.conf import settings


class ChatRoom(models.Model):
    """
    Chat room between a customer and craftsman for a specific job
    """
    job = models.ForeignKey('Job', on_delete=models.CASCADE, related_name='chat_rooms')
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='customer_chats'
    )
    craftsman = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='craftsman_chats'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('job', 'customer', 'craftsman')
        ordering = ['-updated_at']

    def __str__(self):
        return f"Chat: {self.customer.username} <-> {self.craftsman.username} (Job #{self.job.id})"


class Message(models.Model):
    """
    Individual message in a chat room
    """
    chat_room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}"
