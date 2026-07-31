// filepath: /home/levy/Downloads/Alu-platform-frontend/src/components/profile/GraduateProfile.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Save, X } from 'lucide-react';

const GraduateProfile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    bio: '',
    university: '',
    graduationYear: '',
    major: '',
    skills: '',
    achievements: '',
    portfolio_url: '',
    linkedin_url: '',
    github_url: ''
  });

  // Validation state
  const [errors, setErrors] = useState({});

  // Accepted universities and majors
  const ACCEPTED_UNIVERSITY = 'African Leadership University';
  const ACCEPTED_MAJORS = [
    'BSE (Software Engineering)',
    'BEL (Entrepreneurial Leadership)', 
    'IBT (International Business Trade)'
  ];

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching profile with token:', token); // Debug log
      
      const response = await fetch(`/api/profiles/graduate/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Profile data received:', data); // Debug log
        setProfile(data);
      } else {
        console.error('Failed to fetch profile:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // University validation
    if (profile.university && profile.university !== ACCEPTED_UNIVERSITY) {
      newErrors.university = 'Only African Leadership University is accepted';
    }

    // Major validation
    if (profile.major && !ACCEPTED_MAJORS.includes(profile.major)) {
      newErrors.major = 'Please select a valid major from the dropdown';
    }

    // Graduation year validation
    const currentYear = new Date().getFullYear();
    if (profile.graduationYear) {
      const year = parseInt(profile.graduationYear);
      if (year < 2015 || year > currentYear + 6) {
        newErrors.graduationYear = 'Please enter a valid graduation year';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      console.log('Updating profile with token:', token); // Debug log
      console.log('Profile data being sent:', profile); // Debug log
      
      if (!token) {
        alert('No authentication token found. Please login again.');
        return;
      }

      const response = await fetch('/api/profiles/graduate', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      console.log('Response status:', response.status); // Debug log

      if (response.ok) {
        setIsEditing(false);
        alert('Profile updated successfully!');
        fetchProfile(); // Refresh the profile data
      } else {
        const errorData = await response.json();
        console.error('Update failed:', errorData); // Debug log
        alert(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    fetchProfile(); // Reset to original data
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile.firstName || profile.lastName ? 
                    `${profile.firstName} ${profile.lastName}` : 
                    'Graduate Profile'
                  }
                </h1>
                <p className="text-gray-600">{profile.email}</p>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center space-x-2"
            >
              {isEditing ? <X size={16} /> : <User size={16} />}
              <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
            </button>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={profile.firstName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={profile.lastName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={profile.bio}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>

            {/* Academic Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    University *
                  </label>
                  <input
                    type="text"
                    name="university"
                    value={profile.university}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="African Leadership University"
                    className={`w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 ${
                      errors.university ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.university && (
                    <p className="mt-1 text-sm text-red-600">{errors.university}</p>
                  )}
                  {isEditing && (
                    <p className="mt-1 text-xs text-gray-500">Only African Leadership University is accepted</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Major *
                  </label>
                  <select
                    name="major"
                    value={profile.major}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 ${
                      errors.major ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select your major</option>
                    {ACCEPTED_MAJORS.map(major => (
                      <option key={major} value={major}>{major}</option>
                    ))}
                  </select>
                  {errors.major && (
                    <p className="mt-1 text-sm text-red-600">{errors.major}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Graduation Year
                  </label>
                  <input
                    type="number"
                    name="graduationYear"
                    value={profile.graduationYear}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    min="2015"
                    max={new Date().getFullYear() + 6}
                    className={`w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 ${
                      errors.graduationYear ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.graduationYear && (
                    <p className="mt-1 text-sm text-red-600">{errors.graduationYear}</p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills
                </label>
                <textarea
                  name="skills"
                  value={profile.skills}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="List your technical and soft skills..."
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Achievements
                </label>
                <textarea
                  name="achievements"
                  value={profile.achievements}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="Describe your notable achievements..."
                />
              </div>
            </div>

            {/* Links */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Links</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Portfolio URL
                  </label>
                  <input
                    type="url"
                    name="portfolio_url"
                    value={profile.portfolio_url}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    placeholder="https://your-portfolio.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    name="linkedin_url"
                    value={profile.linkedin_url}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    placeholder="https://linkedin.com/in/your-profile"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    name="github_url"
                    value={profile.github_url}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    placeholder="https://github.com/your-username"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            {isEditing && (
              <div className="flex space-x-4 pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save size={16} />
                  <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-300 text-gray-700 px-6 py-3 rounded hover:bg-gray-400 flex items-center space-x-2"
                >
                  <X size={16} />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
  
};

export default GraduateProfile;