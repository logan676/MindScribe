import { useState } from 'react';
import { Bell, CheckCircle, AlertCircle, Info, Clock, Check, Trash2 } from 'lucide-react';

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
    message: 'Session with Amelia Chen has been successfully transcribed. Clinical notes are ready for review.',
    timestamp: '2 hours ago',
    read: false,
    actionUrl: '/notes/1',
  },
  {
    id: '2',
    type: 'warning',
    title: 'Note Signature Required',
    message: 'Session note for Benjamin Carter requires your signature before finalizing.',
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
  {
    id: '5',
    type: 'alert',
    title: 'System Maintenance',
    message: 'Scheduled maintenance will occur this Saturday from 2:00 AM - 4:00 AM EST.',
    timestamp: '3 days ago',
    read: true,
  },
  {
    id: '6',
    type: 'info',
    title: 'New Feature Available',
    message: 'You can now export clinical notes directly to PDF format. Check out the updated export options.',
    timestamp: '5 days ago',
    read: true,
  },
];

export function Notifications() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

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
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getBackgroundColor = (type: string, read: boolean) => {
    if (read) return 'bg-gray-50';

    switch (type) {
      case 'success':
        return 'bg-green-50 border-l-4 border-green-500';
      case 'warning':
        return 'bg-yellow-50 border-l-4 border-yellow-500';
      case 'alert':
        return 'bg-red-50 border-l-4 border-red-500';
      case 'info':
      default:
        return 'bg-blue-50 border-l-4 border-blue-500';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="mt-2 text-gray-600">
              {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Check className="w-4 h-4" />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <div className="flex gap-8 px-6">
            <button
              onClick={() => setFilter('all')}
              className={`py-4 px-1 font-medium transition-colors relative ${
                filter === 'all'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Notifications
              {filter === 'all' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`py-4 px-1 font-medium transition-colors relative ${
                filter === 'unread'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Unread
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-semibold text-white bg-blue-600 rounded-full">
                  {unreadCount}
                </span>
              )}
              {filter === 'unread' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No notifications
            </h3>
            <p className="text-gray-600">
              {filter === 'unread'
                ? "You're all caught up! No unread notifications."
                : "You don't have any notifications yet."}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg shadow-sm transition-all hover:shadow-md ${
                getBackgroundColor(notification.type, notification.read)
              }`}
            >
              <div className="p-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className={`font-semibold ${
                          notification.read ? 'text-gray-700' : 'text-gray-900'
                        }`}>
                          {notification.title}
                        </h3>
                        <p className={`mt-1 text-sm ${
                          notification.read ? 'text-gray-600' : 'text-gray-700'
                        }`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {notification.timestamp}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete notification"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Action Button */}
                    {notification.actionUrl && (
                      <a
                        href={notification.actionUrl}
                        className="inline-flex items-center mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        View Details →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
