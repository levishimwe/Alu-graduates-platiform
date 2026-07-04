import React, { useState } from 'react';
import { X, Eye, EyeOff, User, Mail, Lock, Camera, FileText, Building, Globe, MapPin, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AuthModal = ({ isOpen, onClose, mode, onSwitchMode }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'graduate',
    profileImage: '',
    bio: '',
    // Graduate fields
    university: '',
    graduationYear: '',
    degreeCertificate: '',
    // Investor fields
    companyName: '',
    companyWebsite: '',
    // Location fields
    country: '',
    city: '',
    // Admin field
    adminSecretKey: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const { login, register } = useAuth();

  const countries = [
    'Afghanistan', 'Albania', 'Algeria', 'Angola', 'Argentina', 'Australia', 'Austria',
    'Bangladesh', 'Belgium', 'Botswana', 'Brazil', 'Burkina Faso', 'Burundi',
    'Cameroon', 'Canada', 'Chad', 'China', 'Congo', 'Democratic Republic of Congo',
    'Egypt', 'Ethiopia', 'France', 'Germany', 'Ghana', 'India', 'Kenya', 'Libya',
    'Madagascar', 'Mali', 'Morocco', 'Mozambique', 'Niger', 'Nigeria', 'Rwanda',
    'South Africa', 'Tanzania', 'Tunisia', 'Uganda', 'United Kingdom', 'United States',
    'Zambia', 'Zimbabwe', 'Other'
  ];

  const validateGoogleEmail = (email) => {
    const googleDomains = ['@gmail.com', '@googlemail.com'];
    return googleDomains.some(domain => email.toLowerCase().endsWith(domain));
  };

  const validateGoogleDriveLink = (url) => {
    if (!url) return true; // Optional field
    return url.includes('drive.google.com');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Real-time validation
    if (name === 'email' && value && !validateGoogleEmail(value)) {
      setErrors(prev => ({ ...prev, email: 'This email is not accepted. Please use a Google email address (@gmail.com or @googlemail.com)' }));
    }

    if ((name === 'profileImage' || name === 'degreeCertificate') && value && !validateGoogleDriveLink(value)) {
      setErrors(prev => ({ ...prev, [name]: `${name === 'profileImage' ? 'Profile image' : 'Degree certificate'} must be a Google Drive link` }));
    }
  };

 const validateForm = () => {
    const newErrors = {};

    if (mode === 'register') {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      
      // Email validation - skip Google check for admin
      if (formData.userType !== 'admin' && !validateGoogleEmail(formData.email)) {
        newErrors.email = 'This email is not accepted. Please use a Google email address (@gmail.com or @googlemail.com)';
      }
      
      if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      if (formData.profileImage && !validateGoogleDriveLink(formData.profileImage)) {
        newErrors.profileImage = 'Profile image must be a Google Drive link';
      }
      if (formData.degreeCertificate && !validateGoogleDriveLink(formData.degreeCertificate)) {
        newErrors.degreeCertificate = 'Degree certificate must be a Google Drive link';
      }
      
     // Admin validation
if (formData.userType === 'admin') {
  if (!formData.adminSecretKey) {
    newErrors.adminSecretKey = 'Admin secret key is required';
  }
}
    }

    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    console.log('📝 Form data being submitted:', formData);

    setIsLoading(true);
    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
      } else {
        await register(formData);
      }
      onClose();
    } catch (error) {
      console.error('❌ Submit error:', error);
      setErrors({ submit: error.message || 'An error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'login' ? 'Welcome Back' : 'Join ALU Platform'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.firstName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="John"
                      />
                    </div>
                    {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.lastName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Doe"
                      />
                    </div>
                    {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                  </div>
                </div>

                {/* User Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    I am a *
                  </label>
                  <select
                    name="userType"
                    value={formData.userType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="graduate">ALU Graduate</option>
                    <option value="investor">Investor</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                {/* Admin Secret Key - Only show for admin */}
                {formData.userType === 'admin' && (
                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-1">
                      Admin Secret Key *
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-400" size={20} />
                      <input
                        type={showAdminKey ? 'text' : 'password'}
                        name="adminSecretKey"
                        value={formData.adminSecretKey}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-12 py-2 border rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                          errors.adminSecretKey ? 'border-red-500' : 'border-red-300'
                        }`}
                        placeholder="Enter admin secret key"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminKey(!showAdminKey)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-400 hover:text-red-600"
                      >
                        {showAdminKey ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {errors.adminSecretKey && <p className="text-red-500 text-xs mt-1">{errors.adminSecretKey}</p>}
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ Only authorized personnel should have access to this key.
                    </p>
                  </div>
                )}

                {/* Location Fields - Only for non-admin users */}
                {formData.userType !== 'admin' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <select
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Country</option>
                          {countries.map(country => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter city"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Graduate-specific fields */}
                {formData.userType === 'graduate' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          University
                        </label>
                        <input
                          type="text"
                          name="university"
                          value={formData.university}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="African Leadership University"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Graduation Year
                        </label>
                        <input
                          type="number"
                          name="graduationYear"
                          value={formData.graduationYear}
                          onChange={handleInputChange}
                          min="1950"
                          max={new Date().getFullYear() + 10}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="2024"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Degree Certificate (Google Drive Link)
                      </label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="url"
                          name="degreeCertificate"
                          value={formData.degreeCertificate}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.degreeCertificate ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="https://drive.google.com/file/d/your-certificate-id/view"
                        />
                      </div>
                      {errors.degreeCertificate && <p className="text-red-500 text-xs mt-1">{errors.degreeCertificate}</p>}
                    </div>
                  </>
                )}

                {/* Investor-specific fields */}
                {formData.userType === 'investor' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company Name
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Your Company Name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company Website URL
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="url"
                          name="companyWebsite"
                          value={formData.companyWebsite}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://yourcompany.com"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Profile Image - Only for non-admin users */}
                {formData.userType !== 'admin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Profile Image (Google Drive Link)
                    </label>
                    <div className="relative">
                      <Camera className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="url"
                        name="profileImage"
                        value={formData.profileImage}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.profileImage ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="https://drive.google.com/file/d/your-image-id/view"
                      />
                    </div>
                    {errors.profileImage && <p className="text-red-500 text-xs mt-1">{errors.profileImage}</p>}
                  </div>
                )}

                {/* Bio - Only for non-admin users */}
                {formData.userType !== 'admin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Tell us a bit about yourself..."
                    />
                  </div>
                )}
              </>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {mode === 'register' && formData.userType !== 'admin' ? 'Google Email Address *' : 'Email Address *'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={mode === 'register' && formData.userType !== 'admin' ? 'your.email@gmail.com' : 'your.email@domain.com'}
                />
              </div>
              {mode === 'register' && formData.userType !== 'admin' && (
                <p className="text-xs text-gray-500 mt-1">
                  Only Google email addresses (@gmail.com, @googlemail.com) are accepted
                </p>
              )}
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-12 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 px-4 rounded-md focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                formData.userType === 'admin' 
                  ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
              }`}
            >
              {isLoading ? 'Please wait...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          {/* Switch Mode */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => onSwitchMode(mode === 'login' ? 'register' : 'login')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          {/* Google Drive Instructions - Only for non-admin registration */}
          {mode === 'register' && formData.userType !== 'admin' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="text-sm font-medium text-blue-800 mb-2">How to get Google Drive links:</h4>
              <ol className="text-xs text-blue-700 space-y-1">
                <li>1. Upload your files to Google Drive</li>
                <li>2. Right-click the file and select "Get link"</li>
                <li>3. Set permission to "Anyone with the link can view"</li>
                <li>4. Copy and paste the link in the fields above</li>
              </ol>
            </div>
          )}

          {/* Admin Warning */}
          {mode === 'register' && formData.userType === 'admin' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <h4 className="text-sm font-medium text-red-800 mb-2">⚠️ Administrator Registration</h4>
              <p className="text-xs text-red-700">
                This will create an administrator account with full system access. 
                Only authorized personnel should proceed with admin registration.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
