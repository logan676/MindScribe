import { Plus, Upload, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock data - will be replaced with API calls
const needsAttention = [
  {
    id: '1',
    name: 'Patient C.D.',
    sessionDate: 'March 14, 2024',
    status: 'ready',
    statusText: 'Transcription Ready',
    statusColor: 'green',
    avatarUrl: undefined,
  },
  {
    id: '2',
    name: 'Patient E.F.',
    sessionDate: 'March 13, 2024',
    status: 'in_progress',
    statusText: 'Transcription in Progress',
    statusColor: 'orange',
    avatarUrl: undefined,
  },
  {
    id: '3',
    name: 'Patient G.H.',
    sessionDate: 'March 12, 2024',
    status: 'action_required',
    statusText: 'Action Required',
    statusColor: 'red',
    avatarUrl: undefined,
  },
];

const todayAppointments = [
  {
    id: '1',
    name: 'Patient A.B.',
    startTime: '9:00 AM',
    endTime: '9:50 AM',
    avatarUrl: undefined,
  },
  {
    id: '2',
    name: 'Patient I.J.',
    startTime: '11:00 AM',
    endTime: '11:50 AM',
    avatarUrl: undefined,
  },
  {
    id: '3',
    name: 'Patient K.L.',
    startTime: '2:00 PM',
    endTime: '2:50 PM',
    avatarUrl: undefined,
  },
];

export function Dashboard() {
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? 'Good morning'
      : currentHour < 18
      ? 'Good afternoon'
      : 'Good evening';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {greeting}, Dr. Smith
        </h1>
        <p className="mt-2 text-gray-600">
          Here's a summary of your practice activity.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Link
          to="/sessions/new"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Start New Session
        </Link>
        <button className="inline-flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors">
          <Upload className="w-5 h-5" />
          Upload a Recording
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Needs Your Attention */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Needs Your Attention
            </h2>
            <div className="space-y-4">
              {needsAttention.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-medium">
                        {item.name.split(' ')[1]?.charAt(0) || 'P'}
                      </span>
                    </div>

                    {/* Patient Info */}
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Session: {item.sessionDate}
                      </p>
                    </div>
                  </div>

                  {/* Status and Action */}
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                        item.statusColor === 'green'
                          ? 'bg-green-50 text-green-700'
                          : item.statusColor === 'orange'
                          ? 'bg-orange-50 text-orange-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {item.statusColor === 'green' ? (
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                      ) : item.statusColor === 'orange' ? (
                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      {item.statusText}
                    </div>
                    <Link
                      to={`/notes/${item.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      {item.status === 'ready'
                        ? 'Review Notes'
                        : item.status === 'in_progress'
                        ? 'Review Notes'
                        : 'Finalize Notes'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Today's Appointments */}
        <div>
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Today's Appointments
            </h2>
            <div className="space-y-4">
              {todayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 text-sm font-medium">
                        {appointment.name.split(' ')[1]?.charAt(0) || 'P'}
                      </span>
                    </div>

                    {/* Appointment Info */}
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {appointment.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                        <Clock className="w-3 h-3" />
                        {appointment.startTime} - {appointment.endTime}
                      </div>
                    </div>
                  </div>

                  <Link
                    to={`/patients/${appointment.id}`}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
