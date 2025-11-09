from rest_framework import serializers
from .models_chat import ChatRoom, Message
from .serializers import UserSerializer


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'chat_room', 'sender', 'sender_username', 'content', 'is_read', 'created_at']
        read_only_fields = ['sender', 'created_at']


class ChatRoomSerializer(serializers.ModelSerializer):
    customer_username = serializers.CharField(source='customer.username', read_only=True)
    craftsman_username = serializers.CharField(source='craftsman.username', read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = [
            'id', 'job', 'customer', 'customer_username',
            'craftsman', 'craftsman_username', 'job_title',
            'last_message', 'unread_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['customer', 'craftsman', 'created_at', 'updated_at']

    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        if last_msg:
            return {
                'content': last_msg.content,
                'sender': last_msg.sender.username,
                'created_at': last_msg.created_at
            }
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0
