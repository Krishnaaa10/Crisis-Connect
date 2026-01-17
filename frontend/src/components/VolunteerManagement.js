import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axiosConfig';
import { toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import './VolunteerManagement.css';

const VolunteerManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  /* Skills functionality removed as per user request */

  // Fetch all volunteers
  const { data: volunteers = [], isLoading: volunteersLoading } = useQuery({
    queryKey: ['allVolunteers'],
    queryFn: async () => {
      const response = await api.get('/api/admin/volunteers');
      return response.data?.data || response.data || [];
    },
    enabled: !!user && user.role === 'admin'
  });

  // Update application status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ volunteerId, applicationStatus }) => {
      // Map frontend status (1=Accepted) to backend isVerified=true
      const isVerified = applicationStatus === 1;
      return api.put(`/api/admin/volunteers/${volunteerId}/verify`, { isVerified });
    },
    onSuccess: () => {
      toast.success('Volunteer status updated');
      queryClient.invalidateQueries(['allVolunteers']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  });

  const handleAccept = (volunteerId) => {
    if (window.confirm('Verify this volunteer?')) {
      updateStatusMutation.mutate({ volunteerId, applicationStatus: 1 });
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      0: 'Pending',
      1: 'Accepted',
      2: 'Rejected'
    };
    return statusMap[status] || 'Unknown';
  };

  const getStatusColor = (status) => {
    const colorMap = {
      0: '#ffc107',
      1: '#28a745',
      2: '#dc3545'
    };
    return colorMap[status] || '#6c757d';
  };

  const getTaskStatusText = (status) => {
    const statusMap = {
      0: 'Available',
      1: 'Assigned',
      2: 'Accepted',
      3: 'Rejected',
      4: 'Completed'
    };
    return statusMap[status] || 'Unknown';
  };

  if (volunteersLoading) {
    return <div className="volunteer-management-container"><p>Loading volunteers...</p></div>;
  }

  return (
    <div
      className="volunteer-management-container"
      style={{
        backgroundImage: `linear-gradient(rgba(5, 10, 20, 0.85), rgba(5, 10, 20, 0.85)), url(${process.env.PUBLIC_URL}/assets/admin_bg.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        minHeight: '100vh'
      }}
    >
      <div className="volunteer-management-header">
        <h2>👥 Volunteer Management <span style={{ fontSize: '0.6em', background: '#333', padding: '2px 8px', borderRadius: '10px', verticalAlign: 'middle' }}>{volunteers.length} Total</span></h2>
        <p>Manage volunteer applications, accept/reject volunteers, and assign skills</p>
      </div>

      {volunteers.length === 0 ? (
        <div className="no-volunteers">
          <p>No volunteers registered yet</p>
        </div>
      ) : (
        <div className="volunteer-list">
          {volunteers.map(volunteer => (
            <div key={volunteer._id} className="volunteer-card">
              <div className="volunteer-header">
                <div style={{ flex: 1 }}>
                  <h3>{volunteer.name || 'Unknown'}</h3>
                  <p className="volunteer-email">{volunteer.email || ''}</p>
                </div>

                <div className="volunteer-stats-mini" style={{ marginRight: '20px', textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#aaa' }}>TASKS</div>
                  <div>
                    <span className="badge" style={{ background: '#007bff', marginRight: '5px' }}>
                      {volunteer.tasksAccepted || 0} Accepted
                    </span>
                    <span className="badge" style={{ background: '#28a745' }}>
                      {volunteer.tasksCompleted || 0} Resolved
                    </span>
                  </div>
                </div>

                <div className="status-badges">
                  <span
                    className="status-badge"
                    style={{ backgroundColor: volunteer.isVerified ? '#28a745' : '#ffc107' }}
                  >
                    {volunteer.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>

              <div className="volunteer-actions">
                {!volunteer.isVerified && (
                  <>
                    <button
                      className="btn btn-success"
                      onClick={() => handleAccept(volunteer._id)}
                      disabled={updateStatusMutation.isPending}
                    >
                      ✓ Verify
                    </button>
                    {/* Rejection not explicitly supported in simple boolean model, maybe just delete? or leave pending */}
                    {/* <button
                      className="btn btn-danger"
                      onClick={() => handleReject(volunteer._id)}
                      disabled={updateStatusMutation.isPending}
                    >
                      ✗ Reject
                    </button> */}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VolunteerManagement;


