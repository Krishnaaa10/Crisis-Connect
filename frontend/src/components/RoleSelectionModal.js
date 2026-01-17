import React, { useState } from 'react';
import './RoleSelectionModal.css';

const RoleSelectionModal = ({ isOpen, onClose, onConfirm }) => {
    const [selectedRole, setSelectedRole] = useState(null);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (selectedRole) {
            onConfirm(selectedRole);
        }
    };

    return (
        <div className="role-modal-overlay">
            <div className="role-modal-content">
                <h2>Select Your Role</h2>
                <p>How would you like to participate in Crisis Connect?</p>

                <div className="role-options">
                    <button
                        className={`role-option-btn ${selectedRole === 'civilian' ? 'selected' : ''}`}
                        onClick={() => setSelectedRole('civilian')}
                    >
                        <span className="role-icon">🆘</span>
                        <div className="role-info">
                            <h3>Civilian</h3>
                            <p>I want to report incidents and request help.</p>
                        </div>
                    </button>

                    <button
                        className={`role-option-btn ${selectedRole === 'volunteer' ? 'selected' : ''}`}
                        onClick={() => setSelectedRole('volunteer')}
                    >
                        <span className="role-icon">🤝</span>
                        <div className="role-info">
                            <h3>Volunteer</h3>
                            <p>I want to help others and respond to alerts.</p>
                        </div>
                    </button>

                    <button
                        className={`role-option-btn ${selectedRole === 'admin' ? 'selected' : ''}`}
                        onClick={() => setSelectedRole('admin')}
                    >
                        <span className="role-icon">🛡️</span>
                        <div className="role-info">
                            <h3>Admin</h3>
                            <p>System Administrator access.</p>
                        </div>
                    </button>
                </div>

                <div className="modal-actions">
                    <button className="cancel-btn" onClick={onClose}>Cancel</button>
                    <button
                        className="confirm-btn"
                        onClick={handleConfirm}
                        disabled={!selectedRole}
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoleSelectionModal;
