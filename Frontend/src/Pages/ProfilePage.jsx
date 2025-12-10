import React, { useEffect, useState } from 'react';
import '../Style/ProfilePage.css';
import { getUserProfile, updateUser, deleteUser } from '../apis/Userapi';
import { useToast } from '../components/ToastContext';

const splitName = (fullName = '') => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || ''
  };
};

const splitPhone = (phone = '') => {
  const match = phone.trim().match(/^\+?(\d{1,3})\s*(.*)$/);
  if (!match) return { countryCode: '+1', phoneNumber: '' };
  return {
    countryCode: `+${match[1]}`,
    phoneNumber: match[2]?.trim() || ''
  };
};

export default function ProfilePage({ user, onNavigate, onUserUpdate }) {
  const [profile, setProfile] = useState(user || null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    profileImage: '',
    password: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const { showSuccess, showError, showWarning } = useToast();
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user?.id) {
          setError('No user found. Please log in again.');
          setLoading(false);
          return;
        }

        const res = await getUserProfile(user.id);
        const data = res.result || res.user || res; // fallback just in case
        const { firstName, lastName } = splitName(data.name || '');
        setProfile(data);
        setFormData({
          firstName,
          lastName,
          email: data.email || '',
          phone: data.phone || '',
          profileImage: data.profileImage || '',
          password: ''
        });
        setUploadedFileName('');
      } catch (err) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, profileImage: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    setError('');
    setSuccess('');

    const fullName = `${formData.firstName} ${formData.lastName}`.trim();

    const payload = {
      name: fullName,
      email: formData.email,
      phone: formData.phone,
      profileImage: formData.profileImage,
    };

    if (formData.password) {
      payload.password = formData.password;
    }

    try {
      const res = await updateUser(user.id, payload);
      const updated = res.result || res.user || payload;
      setProfile(updated);
      setSuccess('Profile updated');
      const { firstName, lastName } = splitName(updated.name || fullName);
      setFormData((prev) => ({
        ...prev,
        firstName,
        lastName,
        phone: updated.phone || formData.phone,
        password: ''
      }));
      const newUser = { ...user, ...updated };
      localStorage.setItem('User', JSON.stringify(newUser));
      if (onUserUpdate) onUserUpdate(newUser);
    } catch (err) {
      setError(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      showWarning('Please enter your password');
      return;
    }

    if (deleteConfirm !== 'DELETE') {
      showWarning('Please type "DELETE" to confirm');
      return;
    }

    try {
      setDeleting(true);
      await deleteUser(user.id, deletePassword.trim());
      
      // Clear local storage and redirect to login
      localStorage.removeItem('User');
      localStorage.removeItem('cart');
      showSuccess('Account deleted successfully');
      onNavigate('login');
    } catch (err) {
      console.error('Delete account error:', err);
      const errorMessage = err.message || err.error || err.response?.data?.message || 'Failed to delete account';
      showError(`Error: ${errorMessage}`);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setDeletePassword('');
      setDeleteConfirm('');
    }
  };

  if (!user) {
    return (
      <div className="profile-guard">
        <h2>Login required</h2>
        <p>You need to sign in to view your profile.</p>
        <button className="btn-primary" onClick={() => onNavigate('login')}>Go to Login</button>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-shell">
        <div className="profile-header">
          <div className="profile-brand">
            <span className="brand-dot" aria-hidden="true"></span>
            <span className="brand-name">Marketplace</span>
            <span className="brand-pill">Profile</span>
          </div>
          <div>
            <p className="profile-kicker">Your personal details</p>
            <h1 className="profile-title">Account settings</h1>
          </div>
          <div className="profile-actions">
            <button className="ghost" onClick={() => onNavigate('home')}>Back home</button>
          </div>
        </div>

        {loading ? (
          <div className="profile-card">Loading profile…</div>
        ) : (
          <form className="profile-card" onSubmit={handleSave}>
            <div className="profile-top">
              <img
                src={formData.profileImage || 'https://png.pngtree.com/png-vector/20221130/ourmid/pngtree-user-profile-button-for-web-and-mobile-design-vector-png-image_41767880.jpg'}
                alt="Profile"
                className="profile-avatar"
              />
              <div className="profile-summary">
                <h3>{`${formData.firstName} ${formData.lastName}`.trim() || 'Your name'}</h3>
                <p>{formData.email || 'Email'}</p>
                {profile?.verified && <span className="chip">Verified</span>}
              </div>
            </div>

            <div className="field-grid">
              <label className="field">
                <span>First name</span>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="field">
                <span>Last name</span>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </label>
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="field">
                <span>Phone</span>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. +1 555 123 4567"
                />
              </label>
              <label className="field">
                <span>Profile image</span>
                <div className="upload-row">
                  <label htmlFor="profile-image-upload" className="upload-button">
                    {uploadedFileName ? `File: ${uploadedFileName}` : 'Choose Image File'}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    id="profile-image-upload"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <input
                    type="url"
                    name="profileImage"
                    value={formData.profileImage}
                    onChange={handleChange}
                    placeholder="Or paste image URL"
                    className="url-input"
                  />
                </div>
              </label>
              <label className="field">
                <span>New Password</span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Leave blank to keep current"
                  minLength={8}
                />
              </label>
            </div>

            <div className="profile-footer">
              {error && <div className="alert error">{error}</div>}
              {success && <div className="alert success">{success}</div>}
              <button className="primary" type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        )}

        {/* Danger Zone */}
        <div className="danger-zone">
          <h3 className="danger-title">Danger Zone</h3>
          <p className="danger-description">
            Once you delete your account, there is no going back. This action cannot be undone.
          </p>
          <button 
            className="delete-account-btn" 
            onClick={() => setShowDeleteModal(true)}
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Account</h3>
            <p className="warning-text">
              This action will permanently delete your account and all associated data including:
            </p>
            <ul className="delete-list">
              <li>Your profile information</li>
              <li>All your products</li>
              <li>All your posts</li>
              <li>All your orders (as buyer and seller)</li>
              <li>Your shopping cart</li>
            </ul>
            <p className="warning-text strong">
              This action cannot be undone.
            </p>

            <div className="delete-form">
              <label>
                <span>Enter your password:</span>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Your current password"
                />
              </label>

              <label>
                <span>Type "DELETE" to confirm:</span>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="Type DELETE"
                />
              </label>
            </div>

            <div className="modal-actions">
              <button 
                className="cancel-btn" 
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                className="confirm-delete-btn" 
                onClick={handleDeleteAccount}
                disabled={deleting || !deletePassword.trim() || deleteConfirm !== 'DELETE'}
              >
                {deleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
