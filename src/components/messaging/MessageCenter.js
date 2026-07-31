import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessageCircle, Search, Users, Mail, Send, Clock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import ContactModal from './ContactModal';
import EmailModal from './EmailModal';
import MessageList from './MessageList';
import ChatWindow from './ChatWindow';

const MessageCenter = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [sentEmails, setSentEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [activeTab, setActiveTab] = useState('conversations');


  // Fetch conversations and emails when component mounts
  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchSentEmails();

    }
  }, [user]);

  const fetchConversations = async () => {
    try {
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/messages/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Conversations fetched:', data.conversations);
        setConversations(data.conversations || []);
      } else {
        console.error('Failed to fetch conversations');
      }
    } catch (error) {
      console.error('Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchSentEmails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/email/sent', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Sent emails fetched:', data.emails);
        setSentEmails(data.emails || []);
      }
    } catch (error) {
      console.error('Failed to fetch sent emails');
    }
  };

// Function to handle sending an email
  const handleSendEmail = (recipient) => {
    setSelectedRecipient(recipient);
    setShowEmailModal(true);
  };

  const handleEmailSent = () => {
    fetchSentEmails();
    setShowEmailModal(false);
  };

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return <div>Please log in to access messages.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <MessageCircle className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Message Center</h1>
                <p className="text-gray-600">Connect and communicate with other users</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowContactModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center space-x-2"
            >
              <Users size={16} />
              <span>Find Users</span>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('conversations')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'conversations'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MessageCircle size={16} className="inline mr-2" />
                Conversations ({conversations.length})
              </button>
              <button
                onClick={() => setActiveTab('emails')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'emails'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Mail size={16} className="inline mr-2" />
                Sent Emails ({sentEmails.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {activeTab === 'conversations' ? (
            <div className="flex h-96">
              {/* Conversations List */}
              <div className={`${selectedConversation ? 'hidden md:block' : ''} w-full md:w-1/3 border-r border-gray-200`}>
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900">Conversations</h3>
                </div>
                <MessageList
                  conversations={conversations}
                  selectedConversation={selectedConversation}
                  onConversationSelect={handleConversationSelect}
                  loading={loading}
                  currentUser={user}
                />
              </div>

              {/* Chat Window or Empty State */}
              <div className={`${selectedConversation ? '' : 'hidden md:block'} flex-1`}>
                {selectedConversation ? (
                  <ChatWindow
                    conversation={selectedConversation}
                    currentUser={user}
                    onBack={handleBackToList}
                    onSendMessage={() => {
                      // Refresh conversations when a new message is sent
                      fetchConversations();
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <MessageCircle size={64} className="mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                      <p className="text-gray-600">Choose a conversation from the list to start messaging</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Emails Tab Content */
            <div className="p-6">
              {sentEmails.length === 0 ? (
                <div className="text-center py-12">
                  <Mail size={64} className="mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No emails sent yet</h3>
                  <p className="text-gray-600 mb-6">
                    Start sending emails to connect with other users
                  </p>
                  <button
                    onClick={() => setShowContactModal(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 flex items-center space-x-2 mx-auto"
                  >
                    <Send size={16} />
                    <span>Send Your First Email</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {sentEmails.map((email) => (
                    <div key={email.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Mail size={16} className="text-blue-600" />
                            <span className="font-medium text-gray-900">{email.subject}</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              email.status === 'sent' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {email.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            To: {email.recipientEmail}
                          </p>
                          <p className="text-sm text-gray-800 line-clamp-2">
                            {email.content}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Clock size={14} />
                          <span>{formatDate(email.sentAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Contact Modal */}
      <ContactModal 
        isOpen={showContactModal} 
        onClose={() => setShowContactModal(false)}
        onSendEmail={handleSendEmail}
      />

      {/* Email Modal */}
      {showEmailModal && selectedRecipient && (
        <EmailModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          recipient={selectedRecipient}
          onEmailSent={handleEmailSent}
        />
      )}
    </div>
  );
};

export default MessageCenter;