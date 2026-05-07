import { useEffect } from 'react';
import { useUIStore } from '../../store';
import { FiX, FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi';
import './Notification.css';

export default function Notification() {
  const { notification, clearNotification } = useUIStore();

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        clearNotification();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification, clearNotification]);

  if (!notification) return null;

  const iconMap = {
    success: { icon: FiCheckCircle, className: 'notification-success' },
    error: { icon: FiAlertCircle, className: 'notification-error' },
    warning: { icon: FiAlertCircle, className: 'notification-warning' },
    info: { icon: FiInfo, className: 'notification-info' },
  };

  const { icon: Icon, className } = iconMap[notification.type] || iconMap.info;

  return (
    <div className={`notification ${className}`}>
      <div className="notification-content">
        <Icon size={20} />
        <p>{notification.message}</p>
      </div>
      <button className="notification-close" onClick={clearNotification}>
        <FiX size={18} />
      </button>
    </div>
  );
}
