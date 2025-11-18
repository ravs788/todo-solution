import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import ThemeContext from '../context/ThemeContext';
import usePushNotifications from '../hooks/usePushNotifications';

const Settings = () => {
  const { user } = useContext(AuthContext);
  const { isDarkMode } = useContext(ThemeContext);
  const {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    error,
    enableNotifications,
    disableNotifications
  } = usePushNotifications();

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleEnableNotifications = async () => {
    try {
      await enableNotifications();
      setSuccessMessage('Push notifications enabled successfully!');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleDisableNotifications = async () => {
    try {
      await disableNotifications();
      setSuccessMessage('Push notifications disabled successfully!');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  if (user && user.status === "PENDING") {
    return (
      <div className="container mt-5 theme-bg-primary theme-text-primary">
        <h2 style={{ color: "orange", transition: 'color 0.3s ease' }}>
          Account Pending Approval
        </h2>
        <p className="theme-text-secondary">
          Your registration is successful but your account is pending approval by an admin.
        </p>
      </div>
    );
  }

  return (
    <div className="container mt-5 theme-bg-primary theme-text-primary">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="theme-text-primary mb-0">Settings</h2>
        <Link to="/" className="btn btn-secondary">
          Back to Todos
        </Link>
      </div>

      {showSuccess && (
        <div className="alert alert-success mb-4" role="alert">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="alert alert-danger mb-4" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="row">
        <div className="col-md-8">
          {/* Push Notifications Section */}
          <div className="card mb-4 theme-bg-secondary">
            <div className="card-header theme-bg-secondary theme-text-primary">
              <h5 className="mb-0">Push Notifications</h5>
            </div>
            <div className="card-body">
              {!isSupported ? (
                <div className="alert alert-warning">
                  <strong>Not Supported:</strong> Push notifications are not supported in this browser.
                  Try using a modern browser like Chrome, Firefox, or Edge.
                </div>
              ) : (
                <>
                  <p className="mb-3">
                    Receive push notifications for todo reminders even when the app is closed.
                  </p>

                  <div className="mb-3">
                    <strong>Status:</strong>{' '}
                    {isSubscribed ? (
                      <span className="text-success">Enabled</span>
                    ) : (
                      <span className="text-muted">Disabled</span>
                    )}
                  </div>

                  <div className="mb-3">
                    <strong>Permission:</strong>{' '}
                    {permission === 'granted' && (
                      <span className="text-success">Granted</span>
                    )}
                    {permission === 'denied' && (
                      <span className="text-danger">Denied</span>
                    )}
                    {permission === 'default' && (
                      <span className="text-warning">Not requested</span>
                    )}
                  </div>

                  {permission === 'denied' && (
                    <div className="alert alert-info">
                      <strong>Permission Denied:</strong> You've denied notification permission.
                      You can re-enable it in your browser settings.
                    </div>
                  )}

                  <div className="d-flex gap-2">
                    {!isSubscribed ? (
                      <button
                        className="btn btn-primary"
                        onClick={handleEnableNotifications}
                        disabled={isLoading || permission === 'denied'}
                      >
                        {isLoading ? 'Enabling...' : 'Enable Notifications'}
                      </button>
                    ) : (
                      <button
                        className="btn btn-outline-danger"
                        onClick={handleDisableNotifications}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Disabling...' : 'Disable Notifications'}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Theme Settings */}
          <div className="card theme-bg-secondary">
            <div className="card-header theme-bg-secondary theme-text-primary">
              <h5 className="mb-0">Appearance</h5>
            </div>
            <div className="card-body">
              <p className="mb-3">
                Theme settings are managed in the navigation bar.
              </p>
              <Link to="/" className="btn btn-outline-primary">
                Go to Navigation
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          {/* Info Panel */}
          <div className="card theme-bg-secondary">
            <div className="card-header theme-bg-secondary theme-text-primary">
              <h6 className="mb-0">About Push Notifications</h6>
            </div>
            <div className="card-body">
              <small className="text-muted">
                <ul className="list-unstyled mb-0">
                  <li>• Get notified of todo reminders</li>
                  <li>• Works even when app is closed</li>
                  <li>• Customizable notification sounds</li>
                  <li>• Click to open todo details</li>
                </ul>
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
