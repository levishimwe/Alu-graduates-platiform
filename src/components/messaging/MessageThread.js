import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Phone, Mail, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const MessageThread = ({ conversation, currentUser, onMessageSent }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (conversation && conversation.id && !conversation.isNew) {
      fetchMessages();
    } else if (conversation && conversation.isNew) {
      setMessages([]);
    }
  }, [conversation?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [newMessage]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/messages/conversation/${conversation.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/messages/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientId: conversation.otherUserId || conversation.otherUser?.id,
          content: messageContent,
          conversationId: conversation.isNew ? null : conversation.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        const newMsg = data.message;
        
        setMessages(prev => [...prev, newMsg]);
        
        if (onMessageSent) {
          onMessageSent(data.conversationId || conversation.id, newMsg);
        }
      } else {
        console.error('Failed to send message');
        setNewMessage(messageContent); // Restore message if failed
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent); // Restore message if failed
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      
      // If less than 24 hours, show relative time
      if (diff < 24 * 60 * 60 * 1000) {
        return formatDistanceToNow(date, { addSuffix: true });
      }
      
      // Otherwise show date and time
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      return '';
    }
  };

  if (!conversation) return null;

  const otherUser = conversation.otherUser;

  return (
    <div className="flex flex-col h-full">
      {/* Thread Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {otherUser?.profileImage ? (
              <img
                src={otherUser.profileImage}
                alt={`${otherUser.firstName} ${otherUser.lastName}`}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                <User size={20} className="text-gray-600" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900">
                {otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Unknown User'}
              </h3>
              <p className="text-sm text-gray-600">
                {otherUser?.userType === 'graduate' ? 'ALU Graduate' : 'Investor'}
                {otherUser?.company && ` • ${otherUser.company}`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {otherUser?.phone && (
              <button
                onClick={() => window.open(`tel:${otherUser.phone}`, '_blank')}
                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                title="Call"
              >
                <Phone size={16} />
              </button>
            )}
            {otherUser?.email && (
              <button
                onClick={() => window.open(`mailto:${otherUser.email}`, '_blank')}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title="Email"
              >
                <Mail size={16} />
              </button>
            )}
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors">
              <MoreVertical size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-gray-600 mb-2">No messages yet</p>
              <p className="text-sm text-gray-500">Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.senderId === currentUser.id;
            const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;
            
            return (
              <div
                key={message.id || index}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-1' : ''}`}>
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      isOwnMessage
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <p className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                    {formatMessageTime(message.createdAt)}
                  </p>
                </div>
                
                {!isOwnMessage && showAvatar && (
                  <div className="order-0 mr-3">
                    {otherUser?.profileImage ? (
                      <img
                        src={otherUser.profileImage}
                        alt={`${otherUser.firstName} ${otherUser.lastName}`}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <User size={16} className="text-gray-600" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 max-h-32"
              rows="1"
              disabled={sending}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className={`p-2 rounded-lg transition-colors ${
              newMessage.trim() && !sending
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageThread;