import { useState, useEffect } from 'react';
import { Search, ChevronRight, Plus, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  client_id: string;
  date_of_birth?: string;
  email?: string;
  phone?: string;
  created_at?: string;
}

interface Session {
  id: string;
  patient_id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration: number;
  status: string;
  transcription_status: string;
  created_at: string;
}

// Function to calculate age from date of birth
const calculateAge = (dateOfBirth: string) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Function to generate avatar URL from name
const getAvatarUrl = (firstName: string, lastName: string) => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}${lastName}`;
};

type TabType = 'session-history' | 'profile-details' | 'documents';

export function Patients() {
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>('session-history');
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  // Fetch patients on mount
  useEffect(() => {
    async function loadPatients() {
      try {
        const response = await api.getPatients();
        const patientList = response.patients || [];
        setPatients(patientList);
        if (patientList.length > 0) {
          setSelectedPatientId(patientList[0].id);
        }
      } catch (err) {
        console.error('Failed to load patients:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPatients();
  }, []);

  // Fetch sessions for selected patient
  useEffect(() => {
    async function loadSessions() {
      if (!selectedPatientId) return;

      try {
        setIsLoadingSessions(true);
        const response = await api.getSessions({ patientId: selectedPatientId });
        setSessions(response.sessions || []);
      } catch (err) {
        console.error('Failed to load sessions:', err);
        setSessions([]);
      } finally {
        setIsLoadingSessions(false);
      }
    }
    loadSessions();
  }, [selectedPatientId]);

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || null;

  const getStatusBadge = (status: string, transcriptionStatus: string) => {
    // Determine the badge based on both status and transcription status
    let color = 'bg-gray-100 text-gray-700';
    let label = 'Unknown';

    if (status === 'completed') {
      if (transcriptionStatus === 'completed') {
        color = 'bg-green-100 text-green-700';
        label = 'Completed';
      } else if (transcriptionStatus === 'in_progress') {
        color = 'bg-blue-100 text-blue-700';
        label = 'Transcribing';
      } else if (transcriptionStatus === 'pending') {
        color = 'bg-yellow-100 text-yellow-700';
        label = 'Pending';
      } else if (transcriptionStatus === 'failed') {
        color = 'bg-red-100 text-red-700';
        label = 'Failed';
      }
    } else if (status === 'in_progress') {
      color = 'bg-orange-100 text-orange-700';
      label = 'In Progress';
    } else if (status === 'processing') {
      color = 'bg-blue-100 text-blue-700';
      label = 'Processing';
    }

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${color}`}>
        {label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 h-auto md:h-[calc(100vh-8rem)]">
      {/* Left Sidebar */}
      <div className={`w-full md:w-80 bg-white rounded-lg shadow-sm p-4 md:p-6 flex flex-col ${showMobileDetail ? 'hidden md:flex' : 'flex'}`}>
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Add New Client Button */}
        <Link
          to="/patients/new"
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mb-6"
        >
          <Plus className="w-5 h-5" />
          Add New Client
        </Link>

        {/* Patient List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading patients...</div>
          ) : patients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">No patients found</p>
              <Link
                to="/patients/new"
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Add your first patient
              </Link>
            </div>
          ) : (
            patients
              .filter((patient) =>
                `${patient.first_name} ${patient.last_name}`
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase())
              )
              .map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => {
                    setSelectedPatientId(patient.id);
                    setShowMobileDetail(true);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    selectedPatientId === patient.id
                      ? 'bg-blue-50 border-2 border-blue-200'
                      : 'hover:bg-gray-50 border-2 border-transparent'
                  }`}
                >
                  <img
                    src={getAvatarUrl(patient.first_name, patient.last_name)}
                    alt={`${patient.first_name} ${patient.last_name}`}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">
                      {patient.first_name} {patient.last_name}
                    </p>
                    <p className="text-sm text-gray-600">Client ID: {patient.client_id}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 bg-white rounded-lg shadow-sm p-4 md:p-8 overflow-y-auto ${!showMobileDetail ? 'hidden md:block' : 'block'}`}>
        {selectedPatient ? (
          <>
            {/* Mobile back button */}
            <button
              onClick={() => setShowMobileDetail(false)}
              className="md:hidden flex items-center gap-2 text-gray-600 mb-4 hover:text-gray-900"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Patients</span>
            </button>

            {/* Patient Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <img
                  src={getAvatarUrl(selectedPatient.first_name, selectedPatient.last_name)}
                  alt={`${selectedPatient.first_name} ${selectedPatient.last_name}`}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full"
                />
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600">
                    Client ID: {selectedPatient.client_id}
                    {selectedPatient.date_of_birth && (
                      <span className="hidden sm:inline"> • DOB: {selectedPatient.date_of_birth} ({calculateAge(selectedPatient.date_of_birth)} yrs)</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <div className="flex gap-8">
                <button
                  onClick={() => setActiveTab('session-history')}
                  className={`pb-3 px-1 font-medium transition-colors relative ${
                    activeTab === 'session-history'
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Session History
                  {activeTab === 'session-history' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('profile-details')}
                  className={`pb-3 px-1 font-medium transition-colors relative ${
                    activeTab === 'profile-details'
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Profile Details
                  {activeTab === 'profile-details' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`pb-3 px-1 font-medium transition-colors relative ${
                    activeTab === 'documents'
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Documents
                  {activeTab === 'documents' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'session-history' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">All Sessions</h2>

                {isLoadingSessions ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading sessions...</p>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="mt-4 text-gray-600">No sessions found</p>
                    <p className="mt-2 text-sm text-gray-500">
                      This patient has no recorded sessions yet
                    </p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                            Time
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                            Duration
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                            Status
                          </th>
                          <th className="px-6 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {sessions.map((session) => (
                          <tr key={session.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {formatDate(session.date)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {session.start_time ? formatTime(session.start_time) : 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {session.duration ? `${Math.round(session.duration / 60)} min` : 'N/A'}
                            </td>
                            <td className="px-6 py-4">
                              {getStatusBadge(session.status, session.transcription_status)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Link
                                to={`/notes/${session.id}`}
                                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                              >
                                View Details
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile-details' && selectedPatient && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={selectedPatient.first_name}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={selectedPatient.last_name}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="text"
                      value={selectedPatient.date_of_birth || 'Not provided'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age
                    </label>
                    <input
                      type="text"
                      value={selectedPatient.date_of_birth ? `${calculateAge(selectedPatient.date_of_birth)} years` : 'N/A'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client ID
                    </label>
                    <input
                      type="text"
                      value={selectedPatient.client_id}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="text"
                      value={selectedPatient.email || 'Not provided'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={selectedPatient.phone || 'Not provided'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      readOnly
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Documents</h2>
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Plus className="w-4 h-4" />
                    Upload Document
                  </button>
                </div>
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="mt-4 text-gray-600">No documents uploaded yet</p>
                  <p className="mt-2 text-sm text-gray-500">
                    Upload consent forms, assessments, or other patient documents
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600">Select a patient to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
