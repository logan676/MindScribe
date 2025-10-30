import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, CheckCircle, AlertCircle, Info, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'alert';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: 'Transcription Complete',
    message: 'Session with Amelia Chen has been successfully transcribed.',
    timestamp: '2 hours ago',
    read: false,
    actionUrl: '/notes/1',
  },
  {
    id: '2',
    type: 'warning',
    title: 'Note Signature Required',
    message: 'Session note for Benjamin Carter requires your signature.',
    timestamp: '5 hours ago',
    read: false,
    actionUrl: '/notes/2',
  },
  {
    id: '3',
    type: 'info',
    title: 'Appointment Reminder',
    message: 'You have an upcoming session with Chloe Davis tomorrow at 2:00 PM.',
    timestamp: '1 day ago',
    read: true,
  },
  {
    id: '4',
    type: 'success',
    title: 'Session Uploaded',
    message: 'Recording for David Evans has been uploaded and is now processing.',
    timestamp: '2 days ago',
    read: true,
    actionUrl: '/sessions/4',
  },
];

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState(mockNotifications);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'alert':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] flex flex-col"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-700" />
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-semibold text-white bg-blue-600 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-4 py-3 hover:bg-gray-50 transition-colors ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${
                          notification.read ? 'text-gray-700' : 'text-gray-900'
                        }`}>
                          {notification.title}
                        </p>
                        <p className={`text-xs mt-0.5 line-clamp-2 ${
                          notification.read ? 'text-gray-600' : 'text-gray-700'
                        }`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {notification.timestamp}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Action Link */}
                    {notification.actionUrl && (
                      <Link
                        to={notification.actionUrl}
                        onClick={onClose}
                        className="inline-block mt-2 text-xs font-medium text-blue-600 hover:text-blue-700"
                      >
                        View Details →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <Link
          to="/notifications"
          onClick={onClose}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium block text-center"
        >
          View All Notifications
        </Link>
      </div>
    </div>
  );
}
