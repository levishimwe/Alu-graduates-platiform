import { useState } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

export const useSimpleAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAuthToken = () => {
    return localStorage.getItem('authToken') || localStorage.getItem('token');
  };

  const apiCall = async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return { success: true, ...data };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Authentication methods
  const login = async (credentials) => {
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  };

  const register = async (userData) => {
    return apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  };

  // Project methods
  const createProject = async (projectData) => {
    return apiCall('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  };

  const getProjects = async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return apiCall(`/projects${queryParams ? `?${queryParams}` : ''}`);
  };

  const getProject = async (id) => {
    return apiCall(`/projects/${id}`);
  };

  const updateProject = async (id, updateData) => {
    return apiCall(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  };

  const deleteProject = async (id) => {
    return apiCall(`/projects/${id}`, {
      method: 'DELETE',
    });
  };

  // User methods
  const getProfile = async () => {
    return apiCall('/users/profile');
  };

  const updateProfile = async (profileData) => {
    return apiCall('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  };

  // Bookmark functionality (simplified)
  const bookmarkProject = async (projectId) => {
    return apiCall('/bookmarks', {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    });
  };

  return {
    loading,
    error,
    // Auth
    login,
    register,
    // Projects
    createProject,
    getProjects,
    getProject,
    updateProject,
    deleteProject,
    // User
    getProfile,
    updateProfile,
    // Investor
    bookmarkProject,
  };
};

// Simple form hook
export const useForm = (initialValues = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (submitFunction, validationRules = {}) => {
    setIsSubmitting(true);
    setErrors({});

    try {
      // Basic validation
      const newErrors = {};
      Object.entries(validationRules).forEach(([field, rules]) => {
        const value = values[field];
        if (rules.required && (!value || value.trim() === '')) {
          newErrors[field] = `${field} is required`;
        }
        if (rules.minLength && value && value.length < rules.minLength) {
          newErrors[field] = `${field} must be at least ${rules.minLength} characters`;
        }
        if (rules.email && value && !/\S+@\S+\.\S+/.test(value)) {
          newErrors[field] = 'Please enter a valid email';
        }
      });

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return { success: false, errors: newErrors };
      }

      const result = await submitFunction(values);
      return { success: true, data: result };
    } catch (error) {
      setErrors({ general: error.message });
      return { success: false, error };
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
  };

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    reset
  };
};

// Simple investor portal hook
export const useInvestorPortal = () => {
  const { bookmarkProject } = useSimpleAPI();
  
  return {
    bookmarkProject,
  };
};