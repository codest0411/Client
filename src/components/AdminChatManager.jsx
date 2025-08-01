import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';

export default function AdminChatManager() {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Load all active chats
  useEffect(() => {
    loadChats();
    
    // Set up real-time subscription for new chats
    const subscription = supabase
      .channel('live_chats')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'live_chats'
        }, 
        (payload) => {
          console.log('Live chat change detected:', payload);
          loadChats();
        }
      )
      .subscribe((status) => {
        console.log('Live chats subscription status:', status);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load messages for selected chat
  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id);
      
      // Set up real-time subscription for messages
      const subscription = supabase
        .channel(`chat_messages:${selectedChat.id}`)
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'chat_messages',
            filter: `chat_id=eq.${selectedChat.id}`
          }, 
          (payload) => {
            console.log('New message received:', payload.new);
            setMessages(prev => {
              // Check if message already exists to avoid duplicates
              const exists = prev.some(msg => msg.id === payload.new.id);
              if (!exists) {
                return [...prev, payload.new];
              }
              return prev;
            });
            // Mark as read if it's from user
            if (payload.new.sender_type === 'user') {
              markChatAsRead(selectedChat.id);
            }
          }
        )
        .subscribe((status) => {
          console.log(`Chat messages subscription status for ${selectedChat.id}:`, status);
        });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectedChat]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChats = async () => {
    try {
      setError(null);
      console.log('Loading chats...');
      
      const { data, error } = await supabase
        .from('live_chats')
        .select(`
          *,
          chat_messages (
            id,
            message,
            sender_type,
            created_at,
            read_by_admin
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading chats:', error);
        setError('Failed to load chats. Please try again.');
        throw error;
      }

      console.log('Chats loaded:', data);

      const chatsWithUnread = data.map(chat => {
        const unreadMessages = chat.chat_messages.filter(
          msg => msg.sender_type === 'user' && !msg.read_by_admin
        ).length;
        return { ...chat, unreadCount: unreadMessages };
      });

      setChats(chatsWithUnread);
      setUnreadCount(chatsWithUnread.reduce((total, chat) => total + chat.unreadCount, 0));
      
      // Restore selected chat if it exists in the loaded chats
      if (selectedChat && !chatsWithUnread.find(chat => chat.id === selectedChat.id)) {
        setSelectedChat(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error loading chats:', err);
      setError('Failed to load chats. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId) => {
    try {
      console.log('Loading messages for chat:', chatId);
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        setError('Failed to load messages. Please try again.');
        throw error;
      }

      console.log('Messages loaded:', data);
      setMessages(data || []);
      setError(null);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages. Please check your connection and try again.');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const messageData = {
        chat_id: selectedChat.id,
        sender_type: 'admin',
        message: newMessage.trim(),
        read_by_admin: true
      };

      console.log('Sending admin message:', messageData);
      
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([messageData])
        .select();

      if (error) {
        console.error('Admin send error:', error);
        setError('Failed to send message. Please try again.');
        throw error;
      }

      console.log('Admin message sent successfully:', data);
      // Don't add to local state - let the real-time subscription handle it
      setNewMessage('');
      setError(null);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please check your connection and try again.');
    }
  };

  const markChatAsRead = async (chatId) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ read_by_admin: true })
        .eq('chat_id', chatId)
        .eq('sender_type', 'user')
        .eq('read_by_admin', false);

      if (error) {
        console.error('Error marking chat as read:', error);
      } else {
        // Update local state
        setChats(prev => prev.map(chat => 
          chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking chat as read:', err);
    }
  };

  const closeChat = async (chatId) => {
    try {
      const { error } = await supabase
        .from('live_chats')
        .update({ status: 'closed' })
        .eq('id', chatId);

      if (error) {
        console.error('Error closing chat:', error);
        setError('Failed to close chat. Please try again.');
        throw error;
      }

      // Remove from local state
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      if (selectedChat?.id === chatId) {
        setSelectedChat(null);
        setMessages([]);
      }
      setError(null);
    } catch (err) {
      console.error('Error closing chat:', err);
      setError('Failed to close chat. Please check your connection and try again.');
    }
  };

  const getLastMessage = (chat) => {
    if (!chat.chat_messages || chat.chat_messages.length === 0) {
      return 'No messages yet';
    }
    const lastMessage = chat.chat_messages[chat.chat_messages.length - 1];
    return lastMessage.message.length > 50 
      ? lastMessage.message.substring(0, 50) + '...' 
      : lastMessage.message;
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Live Chat Support</h2>
            <p className="text-sm text-gray-600 mt-1">
              {chats.length} active conversation{chats.length !== 1 ? 's' : ''}
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {unreadCount} unread
                </span>
              )}
            </p>
          </div>
          <button
            onClick={loadChats}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 px-4 py-3 mx-6 mt-4 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Chat List */}
        <div className="w-1/3 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            {chats.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No active chats</h3>
                <p className="mt-1 text-sm text-gray-500">When users start conversations, they'll appear here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {chats.map(chat => (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedChat?.id === chat.id 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{chat.user_email}</span>
                      {chat.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">{getLastMessage(chat)}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTime(chat.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{selectedChat.user_email}</h3>
                    <p className="text-sm text-gray-500">
                      Started {new Date(selectedChat.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => closeChat(selectedChat.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Close Chat
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender_type === 'admin'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender_type === 'admin' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Select a chat</h3>
                <p className="mt-1 text-sm text-gray-500">Choose a conversation from the list to start messaging.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 