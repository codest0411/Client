import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';

export default function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const messagesEndRef = useRef(null);

  // Check if user is already in a chat
  useEffect(() => {
    const checkExistingChat = async () => {
      const userEmail = localStorage.getItem('userEmail') || email;
      if (!userEmail) return;

      try {
        const { data, error } = await supabase
          .from('live_chats')
          .select('*')
          .eq('user_email', userEmail)
          .eq('status', 'active')
          .single();

        if (data && !error) {
          setChatId(data.id);
          setEmail(data.user_email);
          loadMessages(data.id);
        }
      } catch (err) {
        console.error('Error checking existing chat:', err);
      }
    };

    checkExistingChat();
  }, [email]);

  const startChat = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // First, check if tables exist by trying to query them
      const { error: tableCheckError } = await supabase
        .from('live_chats')
        .select('id')
        .limit(1);

      if (tableCheckError) {
        console.error('Table check error:', tableCheckError);
        setError('Live chat system is not set up yet. Please contact support.');
        return;
      }

      // Create new chat
      const { data: chatData, error: chatError } = await supabase
        .from('live_chats')
        .insert([
          {
            user_email: email,
            status: 'active',
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (chatError) {
        console.error('Chat creation error:', chatError);
        throw chatError;
      }

      setChatId(chatData.id);
      localStorage.setItem('userEmail', email);
      
      // Add welcome message
      const welcomeMessage = {
        chat_id: chatData.id,
        sender_type: 'admin',
        message: 'Hello! Welcome to our support chat. How can I help you today?',
        created_at: new Date().toISOString()
      };

      const { error: msgError } = await supabase
        .from('chat_messages')
        .insert([welcomeMessage]);

      if (msgError) {
        console.error('Welcome message error:', msgError);
        throw msgError;
      }

      setMessages([welcomeMessage]);
      setIsOpen(true);
      setNewMessageCount(0);
    } catch (err) {
      console.error('Error starting chat:', err);
      if (err.message.includes('relation') || err.message.includes('table')) {
        setError('Live chat system is not set up yet. Please contact support.');
        // Offer demo mode
        if (confirm('Would you like to try the demo mode instead?')) {
          setIsDemoMode(true);
          setChatId('demo-chat');
          setMessages([{
            id: 'demo-1',
            chat_id: 'demo-chat',
            sender_type: 'admin',
            message: 'Hello! Welcome to our support chat. How can I help you today?',
            created_at: new Date().toISOString()
          }]);
          setIsOpen(true);
        }
      } else {
        setError('Failed to start chat. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (chatId) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatId) return;

    const messageData = {
      chat_id: chatId,
      sender_type: 'user',
      message: newMessage.trim(),
      created_at: new Date().toISOString()
    };

    if (isDemoMode) {
      // Demo mode - just add to local state
      setMessages(prev => [...prev, messageData]);
      setNewMessage('');
      
      // Simulate admin response after 2 seconds
      setTimeout(() => {
        const adminResponse = {
          chat_id: chatId,
          sender_type: 'admin',
          message: 'Thank you for your message! This is a demo mode. In the real system, an admin would respond to your inquiry.',
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, adminResponse]);
      }, 2000);
      return;
    }

    try {
      setSendingMessage(true);
      console.log('Sending message:', messageData);
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([messageData])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Message sent successfully:', data);
      setMessages(prev => [...prev, data[0]]);
      setNewMessage('');
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const closeChat = async () => {
    if (chatId) {
      try {
        await supabase
          .from('live_chats')
          .update({ status: 'closed' })
          .eq('id', chatId);
      } catch (err) {
        console.error('Error closing chat:', err);
      }
    }
    
    setIsOpen(false);
    setChatId(null);
    setMessages([]);
    setNewMessage('');
    localStorage.removeItem('userEmail');
  };

  // Real-time subscription for new messages
  useEffect(() => {
    if (!chatId || isDemoMode) return;

    console.log('Setting up real-time subscription for chat:', chatId);
    
    const subscription = supabase
      .channel(`chat_messages:${chatId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `chat_id=eq.${chatId}`
        }, 
        (payload) => {
          console.log('New message received:', payload.new);
          setMessages(prev => {
            // Check if message already exists to avoid duplicates
            const exists = prev.some(msg => msg.id === payload.new.id);
            if (!exists) {
              // If it's an admin message, increment notification count
              if (payload.new.sender_type === 'admin') {
                setNewMessageCount(prev => prev + 1);
                // Play notification sound (optional)
                try {
                  const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
                  audio.play();
                } catch (e) {
                  // Ignore audio errors
                }
              }
              return [...prev, payload.new];
            }
            return prev;
          });
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Cleaning up subscription for chat:', chatId);
      subscription.unsubscribe();
    };
  }, [chatId, isDemoMode]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
          <span>Live Chat</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-96 bg-white rounded-lg shadow-xl border z-50 flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-3 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold">Live Chat Support</h3>
          {newMessageCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
              {newMessageCount} new
            </span>
          )}
        </div>
        <button
          onClick={closeChat}
          className="text-white hover:text-gray-200"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-4 overflow-y-auto">
        {!chatId ? (
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="font-semibold text-gray-800 mb-2">Start a Chat</h4>
              <p className="text-sm text-gray-600 mb-4">Enter your email to begin chatting with our support team</p>
            </div>
            
            <div>
              <input
                type="email"
                placeholder="Enter your email to start chat"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm font-medium">
                {error}
              </div>
            )}

            <button
              onClick={startChat}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Starting...' : 'Start Chat'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    msg.sender_type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      {chatId && (
        <div className="p-4 border-t">
          <div className="flex space-x-2">
                            <input
                  type="text"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newMessage.trim()) {
                      sendMessage();
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                            <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {sendingMessage ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Send</span>
                  )}
                </button>
          </div>
        </div>
      )}
    </div>
  );
} 