from rest_framework import serializers
from .models_notification import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id',
            'notification_type',
            'title',
            'message',
            'is_read',
            'created_at',
            'job_id',
            'application_id',
            'chat_room_id',
            'review_id'
        ]
        read_only_fields = ['created_at']
