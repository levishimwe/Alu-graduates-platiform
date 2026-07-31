import React, { useState, useEffect } from 'react';
import { X, Search, Mail, User, Building, MapPin, GraduationCap, Calendar, AlertCircle } from 'lucide-react';

const ContactModal = ({ isOpen, onClose, onSendEmail }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'graduate', 'investor'
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterType]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching users with token:', token ? 'Present' : 'Missing'); // Debug log
      
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status); // Debug log

      if (response.ok) {
        const data = await response.json();
        console.log('Users data received:', data); // Debug log
        setUsers(data.users || []);
        setError(null);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch users' }));
        console.error('Failed to fetch users:', response.status, errorData);
        setError(errorData.error || `HTTP ${response.status}: Failed to fetch users`);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by user type
    if (filterType !== 'all') {
      filtered = filtered.filter(user => user.userType === filterType);
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.firstName?.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.university?.toLowerCase().includes(searchLower) ||
        user.companyName?.toLowerCase().includes(searchLower) ||
        user.city?.toLowerCase().includes(searchLower) ||
        user.country?.toLowerCase().includes(searchLower) ||
        user.major?.toLowerCase().includes(searchLower) ||
        user.company?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleSendEmail = (user) => {
    console.log('Sending email to user:', user); // Debug log
    onSendEmail(user);
    onClose();
  };

  const handleRetry = () => {
    fetchUsers();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Find Users</h2>
            <p className="text-gray-600">Connect with graduates and investors</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, email, university, company, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>

            {/* User Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <option value="all">All Users</option>
              <option value="graduate">Graduates</option>
              <option value="investor">Investors</option>
            </select>
          </div>

          {/* Results Count & Status */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {loading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Loading users...
                </span>
              ) : error ? (
                <span className="text-red-600 flex items-center">
                  <AlertCircle size={16} className="mr-1" />
                  {error}
                </span>
              ) : (
                `${filteredUsers.length} users found`
              )}
            </div>
            
            {error && (
              <button
                onClick={handleRetry}
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading users...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle size={64} className="mx-auto mb-4 text-red-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Users</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <User size={64} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {users.length === 0 ? 'No users available' : 'No users found'}
              </h3>
              <p className="text-gray-600">
                {users.length === 0 
                  ? 'There are no other users in the system yet' 
                  : 'Try adjusting your search or filters'
                }
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* User Info */}
                      <div className="flex items-start space-x-4">
                        {/* Profile Picture */}
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                          {user.profileImage ? (
                            <img
                              src={user.profileImage}
                              alt={`${user.firstName} ${user.lastName}`}
                              className="w-full h-full rounded-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <User size={24} className="text-gray-500" style={{ display: user.profileImage ? 'none' : 'block' }} />
                        </div>

                        {/* User Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {user.firstName} {user.lastName}
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                              user.userType === 'graduate' 
                                ? 'bg-blue-100 text-blue-800' 
                                : user.userType === 'investor'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.userType}
                            </span>
                          </div>

                          <p className="text-sm text-gray-600 mb-2 truncate">{user.email}</p>

                          {/* Additional Info */}
                          <div className="space-y-1">
                            {user.userType === 'graduate' && (
                              <>
                                {(user.university || user.graduationYear) && (
                                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <GraduationCap size={14} className="flex-shrink-0" />
                                    <span className="truncate">
                                      {[user.university, user.graduationYear].filter(Boolean).join(' • ')}
                                    </span>
                                  </div>
                                )}
                                {user.major && (
                                  <div className="text-sm text-gray-600 ml-6 truncate">
                                    Major: {user.major}
                                  </div>
                                )}
                              </>
                            )}

                            {user.userType === 'investor' && (
                              <>
                                {(user.companyName || user.company) && (
                                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <Building size={14} className="flex-shrink-0" />
                                    <span className="truncate">{user.companyName || user.company}</span>
                                  </div>
                                )}
                                {user.position && (
                                  <div className="text-sm text-gray-600 ml-6 truncate">
                                    {user.position}
                                  </div>
                                )}
                              </>
                            )}

                            {(user.city || user.country) && (
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <MapPin size={14} className="flex-shrink-0" />
                                <span className="truncate">{[user.city, user.country].filter(Boolean).join(', ')}</span>
                              </div>
                            )}

                            {user.bio && (
                              <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                                {user.bio}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleSendEmail(user)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex-shrink-0 ml-4"
                    >
                      <Mail size={16} />
                      <span className="hidden sm:inline">Send Email</span>
                      <span className="sm:hidden">Email</span>
                    </button>
                    
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {!loading && !error && users.length > 0 && (
                `Total: ${users.length} users • Showing: ${filteredUsers.length}`
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactModal;
