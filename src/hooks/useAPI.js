import { useState } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

export { useSimpleAPI, useForm, useInvestorPortal } from './useSimpleAPI';
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
  };
};