import { useState, useEffect } from 'react';
import { Plus, Upload, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UploadModal } from '../components/UploadModal';
import { api } from '../services/api';

interface Session {
  id: string;
  patient_id: string;
  first_name: string;
  last_name: string;
  client_id: string;
  date: string;
  status: string;
  transcription_status: string;
}

interface Appointment {
  id: string;
  patient_id: string;
  first_name: string;
  last_name: string;
  start_time: string;
  end_time: string;
}

export function Dashboard() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [_appointments, _setAppointments] = useState<Appointment[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [_isLoadingAppointments, _setIsLoadingAppointments] = useState(true);

  // Fetch sessions on mount
  useEffect(() => {
    async function loadSessions() {
      try {
        const response = await api.getSessions();
        setSessions(response.sessions || []);
      } catch (err) {
        console.error('Failed to load sessions:', err);
      } finally {
        setIsLoadingSessions(false);
      }
    }
    loadSessions();
  }, []);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get sessions that need attention
  const needsAttention = sessions
    .filter(s => s.transcription_status === 'completed' || s.transcription_status === 'in_progress')
    .slice(0, 5)
    .map(s => ({
      id: s.id,
      patientId: s.patient_id,
      firstName: s.first_name,
      lastName: s.last_name,
      name: `${s.first_name} ${s.last_name}`,
      sessionDate: formatDate(s.date),
      status: s.transcription_status,
      statusText: s.transcription_status === 'completed'
        ? 'Transcription Ready'
        : 'Transcription in Progress',
      statusColor: s.transcription_status === 'completed' ? 'green' : 'orange',
    }));

  // Get today's appointments from real patient data
  // Using recent sessions to populate today's schedule
  const todayAppointments = sessions
    .filter((_, index) => index < 3) // Take first 3 patients
    .reduce((acc, session) => {
      // Check if we already have this patient
      const exists = acc.find(apt => apt.patient_id === session.patient_id);
      if (!exists) {
        acc.push({
          id: session.patient_id,
          patient_id: session.patient_id,
          first_name: session.first_name,
          last_name: session.last_name,
          name: `${session.first_name} ${session.last_name}`,
          startTime: acc.length === 0 ? '9:00 AM' : acc.length === 1 ? '11:00 AM' : '2:00 PM',
          endTime: acc.length === 0 ? '9:50 AM' : acc.length === 1 ? '11:50 AM' : '2:50 PM',
        });
      }
      return acc;
    }, [] as Array<{ id: string; patient_id: string; first_name: string; last_name: string; name: string; startTime: string; endTime: string }>);

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
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="inline-flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
        >
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
              {isLoadingSessions ? (
                <div className="text-center py-8 text-gray-500">
                  Loading sessions...
                </div>
              ) : needsAttention.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No sessions need your attention right now.
                </div>
              ) : (
                needsAttention.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <Link to={`/patients/${item.patientId}`}>
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.firstName}`}
                          alt={item.name}
                          className="w-12 h-12 rounded-full hover:ring-2 hover:ring-blue-300 transition-all cursor-pointer"
                        />
                      </Link>

                      {/* Patient Info */}
                      <div>
                        <Link to={`/patients/${item.patientId}`}>
                          <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                            {item.name}
                          </h3>
                        </Link>
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
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                        ) : (
                          <AlertCircle className="w-4 h-4" />
                        )}
                        {item.statusText}
                      </div>
                      <Link
                        to={`/notes/${item.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        {item.status === 'completed'
                          ? 'Review Notes'
                          : 'View Progress'}
                      </Link>
                    </div>
                  </div>
                ))
              )}
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
              {isLoadingSessions ? (
                <div className="text-center py-8 text-gray-500">
                  Loading appointments...
                </div>
              ) : todayAppointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No appointments scheduled for today.
                </div>
              ) : (
                todayAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <Link to={`/patients/${appointment.patient_id}`}>
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${appointment.first_name}`}
                          alt={appointment.name}
                          className="w-10 h-10 rounded-full hover:ring-2 hover:ring-blue-300 transition-all cursor-pointer"
                        />
                      </Link>

                      {/* Appointment Info */}
                      <div>
                        <Link to={`/patients/${appointment.patient_id}`}>
                          <h3 className="font-semibold text-gray-900 text-sm hover:text-blue-600 transition-colors">
                            {appointment.name}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                          <Clock className="w-3 h-3" />
                          {appointment.startTime} - {appointment.endTime}
                        </div>
                      </div>
                    </div>

                    <Link
                      to={`/patients/${appointment.patient_id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
}
