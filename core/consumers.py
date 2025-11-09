import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models_chat import ChatRoom, Message

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.chat_room_id = self.scope['url_route']['kwargs']['chat_room_id']
        self.room_group_name = f'chat_{self.chat_room_id}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type', 'chat_message')

        if message_type == 'chat_message':
            message_content = text_data_json['message']
            sender_id = text_data_json.get('sender_id')

            # Save message to database
            message = await self.save_message(sender_id, message_content)

            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message_content,
                    'sender_id': sender_id,
                    'sender_username': message['sender_username'],
                    'timestamp': message['timestamp'],
                    'message_id': message['id']
                }
            )
        elif message_type == 'mark_read':
            # Mark messages as read
            await self.mark_messages_as_read()

    # Receive message from room group
    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message'],
            'sender_id': event['sender_id'],
            'sender_username': event['sender_username'],
            'timestamp': event['timestamp'],
            'message_id': event['message_id']
        }))

    @database_sync_to_async
    def save_message(self, sender_id, content):
        try:
            chat_room = ChatRoom.objects.get(id=self.chat_room_id)
            sender = User.objects.get(id=sender_id)
            message = Message.objects.create(
                chat_room=chat_room,
                sender=sender,
                content=content
            )
            return {
                'id': message.id,
                'sender_username': sender.username,
                'timestamp': message.timestamp.isoformat()
            }
        except Exception as e:
            print(f"Error saving message: {e}")
            return None

    @database_sync_to_async
    def mark_messages_as_read(self):
        try:
            chat_room = ChatRoom.objects.get(id=self.chat_room_id)
            user = self.scope['user']
            Message.objects.filter(
                chat_room=chat_room,
                is_read=False
            ).exclude(sender=user).update(is_read=True)
        except Exception as e:
            print(f"Error marking messages as read: {e}")
