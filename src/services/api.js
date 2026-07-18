// This file contains the API service configuration and endpoints for the application.
import axios from 'axios';

// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with proper configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token - Fix the key name
    const token = localStorage.getItem('token'); // ✅ Changed from 'authToken' to 'token'
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 (Unauthorized) errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token'); // ✅ Changed from 'authToken' to 'token'
      window.location.href = '/';
    }

    return Promise.reject(error);
  }
);

// === Authentication API ===
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),

  logout: () => api.post('/auth/logout'),

};

// === User Management API ===
export const userAPI = {
  getProfile: () => api.get('/auth/profile'), // ✅ Changed from '/users/profile' to '/auth/profile'
  updateProfile: (profileData) => api.put('/auth/profile', profileData), // ✅ Changed from '/users/profile' to '/auth/profile'
};

// === Users API (for finding other users) ===
export const usersAPI = {
  getAllUsers: () => api.get('/users'),
  getUser: (userId) => api.get(`/users/${userId}`),
};

// === Graduates API ===
export const graduatesAPI = {
  // Get all graduates (for graduates directory)
  getAllGraduates: () => api.get('/profiles/graduates'),
  
  // Get specific graduate profile
  getGraduateProfile: (graduateId) => api.get(`/profiles/graduate/${graduateId}`),
  
  // Update graduate profile
  updateGraduateProfile: (profileData) => api.put('/profiles/graduate', profileData),
  
  // Graduate dashboard
  getDashboard: () => api.get('/graduate/dashboard'),
  
  // Graduate projects
  getGraduateProjects: () => api.get('/graduate/projects'),
  
  // Project analytics
  getProjectAnalytics: (projectId) => api.get(`/graduate/analytics/${projectId}`),
  
  // Graduate messages
  getGraduateMessages: () => api.get('/graduate/messages'),
};

// === Projects API ===
export const projectAPI = {
  // Get all projects with optional filters
  getProjects: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return api.get(`/projects?${params.toString()}`);
  },

  // Get single project
  getProject: (projectId) => api.get(`/projects/${projectId}`),

  // Create new project
  createProject: (projectData) => {
    try {
      // Validate URLs before sending
      const validatedData = validateProjectUrls(projectData);
      
      // Ensure URLs are properly formatted
      const formattedData = {
        ...validatedData,
        imageUrls: JSON.stringify(validatedData.imageUrls || []),
        videoUrls: JSON.stringify(validatedData.videoUrls || []),
        documentUrls: JSON.stringify(validatedData.documentUrls || [])
      };
      
      return api.post('/projects', formattedData);
    } catch (error) {
      return Promise.reject(new Error(`Invalid project data: ${error.message}`));
    }
  },

  // Update existing project
  updateProject: (projectId, projectData) => {
    try {
      // Validate URLs before sending
      const validatedData = validateProjectUrls(projectData);
      
      // Ensure URLs are properly formatted
      const formattedData = {
        ...validatedData,
        imageUrls: JSON.stringify(validatedData.imageUrls || []),
        videoUrls: JSON.stringify(validatedData.videoUrls || []),
        documentUrls: JSON.stringify(validatedData.documentUrls || [])
      };
      
      return api.put(`/projects/${projectId}`, formattedData);
    } catch (error) {
      return Promise.reject(new Error(`Invalid project data: ${error.message}`));
    }
  },

  // Delete project
  deleteProject: (projectId) => api.delete(`/projects/${projectId}`),
};

// === Email API ===
export const emailAPI = {
  getGmailAuthUrl: () => api.get('/email/auth/gmail'),
  checkGmailStatus: () => api.get('/email/gmail/status'),
  sendEmail: (data) => api.post('/email/send', data),
  getSentEmails: () => api.get('/email/sent'),
};

// === Messages API ===
export const messagesAPI = {
  getConversations: () => api.get('/messages/conversations'),
  sendMessage: (data) => api.post('/messages', data),
  getMessages: (conversationId) => api.get(`/messages/${conversationId}`),
};

// === Admin API ===
export const adminAPI = {
  getAllUsers: () => api.get('/admin/users'),
  getAllProjects: () => api.get('/admin/projects'),
  updateUserStatus: (userId, data) => api.put(`/admin/users/${userId}/status`, data),
  updateProjectStatus: (projectId, data) => api.put(`/admin/projects/${projectId}/status`, data),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  deleteProject: (projectId) => api.delete(`/admin/projects/${projectId}`),
};

// Helper function to validate project URLs
const validateProjectUrls = (projectData) => {
  const validatedData = { ...projectData };

  // Validate Google Drive links for images
  if (validatedData.imageUrls && Array.isArray(validatedData.imageUrls)) {
    validatedData.imageUrls = validatedData.imageUrls.filter(url => {
      if (!url || url.trim() === '') return false;
      if (!url.includes('drive.google.com')) {
        console.warn(`Invalid image URL (must be Google Drive): ${url}`);
        return false;
      }
      return true;
    });
  }

  // Validate YouTube links for videos
  if (validatedData.videoUrls && Array.isArray(validatedData.videoUrls)) {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/;
    validatedData.videoUrls = validatedData.videoUrls.filter(url => {
      if (!url || url.trim() === '') return false;
      if (!youtubeRegex.test(url)) {
        console.warn(`Invalid video URL (must be YouTube): ${url}`);
        return false;
      }
      return true;
    });
  }

  // Validate Google Drive links for documents
  if (validatedData.documentUrls && Array.isArray(validatedData.documentUrls)) {
    validatedData.documentUrls = validatedData.documentUrls.filter(url => {
      if (!url || url.trim() === '') return false;
      if (!url.includes('drive.google.com')) {
        console.warn(`Invalid document URL (must be Google Drive): ${url}`);
        return false;
      }
      return true;
    });
  }

  return validatedData;
};

// === Enhanced Error Handling ===
export const handleAPIError = (error) => {
  if (error.response) {
    const errorData = {
      message: error.response.data?.error || error.response.data?.message || 'An error occurred',
      status: error.response.status,
      data: error.response.data,
    };
    
    switch (error.response.status) {
      case 400:
        errorData.message = error.response.data?.details 
          ? `Validation failed: ${error.response.data.details.map(d => d.message).join(', ')}`
          : error.response.data?.error || 'Bad request';
        break;
      case 401:
        errorData.message = 'Please login to continue';
        break;
      case 403:
        errorData.message = 'You do not have permission to perform this action';
        break;
      case 404:
        errorData.message = 'Resource not found';
        break;
      case 500:
        errorData.message = 'Server error. Please try again later';
        break;
      default:
        break;
    }
    
    return errorData;
  } else if (error.request) {
    return {
      message: 'Network error. Please check your connection',
      status: 0,
    };
  } else {
    return {
      message: error.message || 'An unexpected error occurred',
      status: -1,
    };
  }

};

export default api;
