import React, { useState, useEffect } from 'react';
import { X, Mail, AlertCircle, CheckCircle, Send } from 'lucide-react';

const EmailModal = ({ isOpen, onClose, recipient, onEmailSent }) => {
  const [formData, setFormData] = useState({
    subject: '',
    content: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({ subject: '', content: '' });
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form fields
    if (!formData.subject || !formData.content) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      // Use simple email method (with app password)
      const response = await fetch('/api/email/send-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientEmail: recipient.email,
          subject: formData.subject,
          content: formData.content,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Email sent:', data);
        
        // Reset form
        setFormData({ subject: '', content: '' });
        setError('');
        setSuccess(true);
        
        // Call success callback
        if (onEmailSent) {
          onEmailSent();
        }
        
        // Show success message briefly then close
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2000);
        
      } else {
        const errorData = await response.json();
        setError(errorData.userMessage || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setError('Failed to send email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Mail className="mr-2 text-blue-600" size={24} />
            Send Email
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="mb-4">
              <CheckCircle className="mx-auto text-green-600" size={48} />
            </div>
            <h3 className="text-lg font-medium text-green-800 mb-2">Email Sent Successfully!</h3>
            <p className="text-green-600">Your message has been delivered via ALU Platform.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Platform Email Info */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center mb-1">
                <Mail className="text-blue-600 mr-2" size={16} />
                <span className="font-medium text-blue-800 text-sm">ALU Platform Email</span>
              </div>
              <p className="text-blue-700 text-xs">
                Email will be sent via ALU Platform. Recipients can reply directly to you.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="text-red-600 mr-2" size={16} />
                  <span className="text-red-800 text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Recipient */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To:
              </label>
              <div className="flex items-center p-3 bg-gray-50 border border-gray-200 rounded-md">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-xs font-medium text-blue-600">
                    {recipient.firstName?.[0]}{recipient.lastName?.[0]}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {recipient.firstName} {recipient.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{recipient.email}</p>
                  <span className={`inline-block text-xs px-2 py-1 rounded-full mt-1 ${
                    recipient.userType === 'graduate' 
                      ? 'bg-green-100 text-green-800' 
                      : recipient.userType === 'investor'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {recipient.userType === 'graduate' ? 'Graduate' : 
                     recipient.userType === 'investor' ? 'Investor' : 'Admin'}
                  </span>
                </div>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter email subject..."
                required
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Type your message here..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Your message will be professionally formatted in the email.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.subject || !formData.content}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} className="mr-2" />
                    Send Email
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Footer Info */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Emails are sent securely through ALU Platform's email service
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailModal;