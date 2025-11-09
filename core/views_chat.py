from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models_chat import ChatRoom, Message
from .models import Job
from .serializers_chat import ChatRoomSerializer, MessageSerializer


class ChatRoomViewSet(viewsets.ModelViewSet):
    serializer_class = ChatRoomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Return chat rooms where user is either customer or craftsman
        """
        user = self.request.user
        return ChatRoom.objects.filter(
            Q(customer=user) | Q(craftsman=user)
        ).select_related('job', 'customer', 'craftsman').prefetch_related('messages')

    @action(detail=False, methods=['post'])
    def get_or_create(self, request):
        """
        Get or create a chat room for a specific job and craftsman
        POST /api/chat-rooms/get_or_create/
        Body: {"job_id": 1, "craftsman_id": 2}
        """
        job_id = request.data.get('job_id')
        craftsman_id = request.data.get('craftsman_id')

        if not job_id or not craftsman_id:
            return Response(
                {'error': 'job_id and craftsman_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)

        # Only job customer can initiate chat
        if job.customer != request.user:
            return Response(
                {'error': 'Only the job customer can initiate chat'},
                status=status.HTTP_403_FORBIDDEN
            )

        chat_room, created = ChatRoom.objects.get_or_create(
            job=job,
            customer=job.customer,
            craftsman_id=craftsman_id
        )

        serializer = self.get_serializer(chat_room)
        return Response(serializer.data, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Return messages from chat rooms where user is participant
        """
        user = self.request.user
        chat_room_id = self.request.query_params.get('chat_room')

        queryset = Message.objects.filter(
            Q(chat_room__customer=user) | Q(chat_room__craftsman=user)
        ).select_related('sender', 'chat_room')

        if chat_room_id:
            queryset = queryset.filter(chat_room_id=chat_room_id)

        return queryset

    def perform_create(self, serializer):
        """
        Set sender to current user
        """
        serializer.save(sender=self.request.user)

    @action(detail=False, methods=['post'])
    def mark_as_read(self, request):
        """
        Mark messages as read
        POST /api/messages/mark_as_read/
        Body: {"chat_room_id": 1}
        """
        chat_room_id = request.data.get('chat_room_id')

        if not chat_room_id:
            return Response(
                {'error': 'chat_room_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Mark all messages in this chat room as read (except user's own messages)
        Message.objects.filter(
            chat_room_id=chat_room_id,
            is_read=False
        ).exclude(sender=request.user).update(is_read=True)

        return Response({'status': 'Messages marked as read'}, status=status.HTTP_200_OK)
