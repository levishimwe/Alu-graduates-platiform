import React, { useState, useEffect } from 'react';
import { Plus, FileText, Eye, Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ProjectCard from "../common/ProjectCard";
import ProjectUploadModal from "./ProjectUploadModal";
import ProjectDetails from "../projects/ProjectDetails"; // ✅ Add this import

const GraduateDashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // ✅ Add these states for ProjectDetails modal
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectDetails, setShowProjectDetails] = useState(false);

  // Fetch projects function - filter by current user's projects
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';
      const token = localStorage.getItem('token');
      
      // Add graduateId parameter to fetch only current user's projects
      const response = await fetch(`${API_BASE_URL}/projects?graduateId=${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      } else {
        console.error('Failed to fetch projects');
        setError('Failed to fetch projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Error fetching projects');
    } finally {
      setLoading(false);
    }
  };

  // Load projects on component mount (only when user is available)
  useEffect(() => {
    if (user?.id) {
      fetchProjects();
    }
  }, [user?.id]);

  // Handle successful project upload
  const handleProjectUploadSuccess = (newProject) => {
    console.log('Project uploaded successfully:', newProject);
    
    // Add the new project to the beginning of the projects array
    setProjects(prevProjects => [newProject, ...prevProjects]);
    
    // Close the modal
    setIsUploadModalOpen(false);
    
    // Show success message
    alert('Project uploaded successfully!');
  };

  // Handle opening upload modal
  const handleOpenUploadModal = () => {
    setIsUploadModalOpen(true);
  };

  // Handle closing upload modal
  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
  };

  // ✅ Update this function to open ProjectDetails modal
  const handleViewDetails = (project) => {
    console.log('📊 Opening project details for:', project);
    setSelectedProject(project);
    setShowProjectDetails(true);
  };

  // ✅ Add function to close ProjectDetails modal
  const handleCloseDetails = () => {
    setShowProjectDetails(false);
    setSelectedProject(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Graduate Dashboard</h1>
              <p className="text-gray-600">Manage your projects and profile</p>
            </div>
            <button
              onClick={handleOpenUploadModal}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Upload Project</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Projects Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">My Projects</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading projects...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
              <button 
                onClick={fetchProjects}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-600 mb-4">Start by uploading your first project</p>
              <button
                onClick={handleOpenUploadModal}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Upload Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard 
                  key={project.id} 
                  project={project}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-md">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-md">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">
                  {projects.reduce((total, project) => total + (project.views || 0), 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-md">
                <Heart className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Likes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {projects.reduce((total, project) => total + (project.likes || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <ProjectUploadModal
        isOpen={isUploadModalOpen}
        onClose={handleCloseUploadModal}
        onSuccess={handleProjectUploadSuccess}
      />

      {/* ✅ Add ProjectDetails Modal */}
      {showProjectDetails && selectedProject && (
        <ProjectDetails
          project={selectedProject}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
};

export default GraduateDashboard;
