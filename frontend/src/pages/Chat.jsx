import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Badge,
  Divider,
  Avatar,
  Grid,
} from '@mui/material';
import { Send as SendIcon, Chat as ChatIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { chatAPI } from '../services/api';

function Chat() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const ws = useRef(null);

  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  };

  useEffect(() => {
    loadChatRooms();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom.id);
      // Mark messages as read
      chatAPI.markAsRead(selectedRoom.id);
      // Connect to WebSocket
      connectWebSocket(selectedRoom.id);
    }

    return () => {
      // Clean up WebSocket connection
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [selectedRoom]);

  const connectWebSocket = (chatRoomId) => {
    // Close existing connection if any
    if (ws.current) {
      ws.current.close();
    }

    const token = localStorage.getItem('token');
    const wsUrl = `ws://localhost:8000/ws/chat/${chatRoomId}/?token=${token}`;

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'chat_message') {
        const newMsg = {
          id: data.message_id,
          content: data.message,
          sender: data.sender_id,
          sender_username: data.sender_username,
          created_at: data.timestamp,
        };
        setMessages(prev => [...prev, newMsg]);
        // Refresh chat rooms to update last message
        loadChatRooms();
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
    };
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatRooms = async () => {
    try {
      const response = await chatAPI.getChatRooms();
      setChatRooms(response.data);
      if (response.data.length > 0 && !selectedRoom) {
        setSelectedRoom(response.data[0]);
      }
    } catch (err) {
      console.error('Failed to load chat rooms:', err);
      setError('Fehler beim Laden der Chats');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatRoomId) => {
    try {
      const response = await chatAPI.getMessages(chatRoomId);
      setMessages(response.data);
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError('Fehler beim Laden der Nachrichten');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoom) return;

    setSending(true);
    try {
      // Send message via WebSocket instead of REST API
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          type: 'chat_message',
          message: newMessage,
          sender_id: user.id
        }));
        setNewMessage('');
      } else {
        // Fallback to REST API if WebSocket is not connected
        await chatAPI.sendMessage(selectedRoom.id, newMessage);
        setNewMessage('');
        await loadMessages(selectedRoom.id);
        await loadChatRooms();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Fehler beim Senden der Nachricht');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 2, sm: 3, md: 4, lg: 6 }, maxWidth: '100%', height: 'calc(100vh - 100px)' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#1a1a1a' }}>
          💬 Nachrichten
        </Typography>
        <Typography variant="body1" sx={{ color: '#4a4a4a' }}>
          Kommuniziere mit Kunden oder Handwerkern
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {chatRooms.length === 0 ? (
        <Paper sx={{ ...cardStyle, p: 6, textAlign: 'center' }}>
          <ChatIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Noch keine Chats
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Chats werden erstellt, wenn du mit Handwerkern oder Kunden kommunizierst.
          </Typography>
          <Button
            variant="contained"
            sx={{ mt: 3 }}
            onClick={() => navigate('/jobs')}
          >
            Aufträge anzeigen
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2} sx={{ height: '70vh' }}>
          {/* Chat List */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ ...cardStyle, height: '100%', overflow: 'auto' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                <Typography variant="h6" fontWeight={600}>
                  Chats ({chatRooms.length})
                </Typography>
              </Box>
              <List>
                {chatRooms.map((room) => (
                  <ListItem key={room.id} disablePadding>
                    <ListItemButton
                      selected={selectedRoom?.id === room.id}
                      onClick={() => setSelectedRoom(room)}
                      sx={{
                        '&.Mui-selected': {
                          backgroundColor: 'primary.light',
                          '&:hover': {
                            backgroundColor: 'primary.light',
                          },
                        },
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {user.id === room.customer ? room.craftsman_username : room.customer_username}
                            </Typography>
                            {room.unread_count > 0 && (
                              <Badge badgeContent={room.unread_count} color="error" />
                            )}
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="caption" color="text.secondary">
                              {room.job_title}
                            </Typography>
                            {room.last_message && (
                              <Typography variant="body2" noWrap sx={{ mt: 0.5 }}>
                                {room.last_message.content}
                              </Typography>
                            )}
                          </>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Chat Window */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ ...cardStyle, height: '100%', display: 'flex', flexDirection: 'column' }}>
              {selectedRoom ? (
                <>
                  {/* Chat Header */}
                  <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                    <Typography variant="h6" fontWeight={600}>
                      {user.id === selectedRoom.customer
                        ? selectedRoom.craftsman_username
                        : selectedRoom.customer_username}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Auftrag: {selectedRoom.job_title}
                    </Typography>
                  </Box>

                  {/* Messages */}
                  <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                    {messages.map((message) => (
                      <Box
                        key={message.id}
                        sx={{
                          display: 'flex',
                          justifyContent: message.sender === user.id ? 'flex-end' : 'flex-start',
                          mb: 2,
                        }}
                      >
                        <Box
                          sx={{
                            maxWidth: '70%',
                            bgcolor: message.sender === user.id ? 'primary.main' : '#f0f0f0',
                            color: message.sender === user.id ? 'white' : 'text.primary',
                            borderRadius: 2,
                            p: 1.5,
                          }}
                        >
                          <Typography variant="body1">{message.content}</Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              opacity: 0.7,
                              display: 'block',
                              textAlign: 'right',
                              mt: 0.5,
                            }}
                          >
                            {formatTime(message.created_at)}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                    <div ref={messagesEndRef} />
                  </Box>

                  {/* Message Input */}
                  <Box component="form" onSubmit={handleSendMessage} sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        fullWidth
                        placeholder="Nachricht schreiben..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={sending}
                        size="small"
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={!newMessage.trim() || sending}
                        endIcon={<SendIcon />}
                      >
                        Senden
                      </Button>
                    </Box>
                  </Box>
                </>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Typography variant="h6" color="text.secondary">
                    Wähle einen Chat aus
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

export default Chat;
