import { useState } from 'react';
import { Search, Plus, ChevronRight, Download, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock data
const mockClinician = {
  name: 'Dr. Eleanor Vance',
  title: 'Clinical Psychologist',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eleanor',
};

const mockPatients = [
  {
    id: '34592',
    firstName: 'Amelia',
    lastName: 'Chen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amelia',
  },
  {
    id: '34593',
    firstName: 'Benjamin',
    lastName: 'Carter',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Benjamin',
  },
  {
    id: '34594',
    firstName: 'Chloe',
    lastName: 'Davis',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chloe',
  },
  {
    id: '34595',
    firstName: 'David',
    lastName: 'Evans',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
  },
  {
    id: '34596',
    firstName: 'Emma',
    lastName: 'Foster',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
  },
  {
    id: '34597',
    firstName: 'Frank',
    lastName: 'Garcia',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Frank',
  },
  {
    id: '34598',
    firstName: 'Grace',
    lastName: 'Harper',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Grace',
  },
  {
    id: '34599',
    firstName: 'Henry',
    lastName: 'Irving',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Henry',
  },
  {
    id: '34600',
    firstName: 'Isabella',
    lastName: 'Johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Isabella',
  },
  {
    id: '34601',
    firstName: 'Jack',
    lastName: 'Kumar',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
  },
  {
    id: '34602',
    firstName: 'Katherine',
    lastName: 'Lee',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Katherine',
  },
  {
    id: '34603',
    firstName: 'Liam',
    lastName: 'Martinez',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Liam',
  },
  {
    id: '34604',
    firstName: 'Maya',
    lastName: 'Nelson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maya',
  },
  {
    id: '34605',
    firstName: 'Noah',
    lastName: 'O\'Brien',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Noah',
  },
  {
    id: '34606',
    firstName: 'Olivia',
    lastName: 'Patel',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia',
  },
  {
    id: '34607',
    firstName: 'Patrick',
    lastName: 'Quinn',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Patrick',
  },
  {
    id: '34608',
    firstName: 'Rachel',
    lastName: 'Robinson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rachel',
  },
  {
    id: '34609',
    firstName: 'Samuel',
    lastName: 'Smith',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Samuel',
  },
  {
    id: '34610',
    firstName: 'Taylor',
    lastName: 'Thompson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor',
  },
  {
    id: '34611',
    firstName: 'Victoria',
    lastName: 'Williams',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Victoria',
  },
];

// Function to generate mock sessions for a patient
const generateMockSessions = (patientId: string) => {
  const sessionCount = Math.floor(Math.random() * 5) + 2; // 2-6 sessions
  const sessions = [];
  const statuses = ['completed', 'notes-pending', 'processing'];

  for (let i = 0; i < sessionCount; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (i * 7)); // Weekly sessions
    sessions.push({
      id: `S2024-${String(20 - i).padStart(2, '0')}`,
      date: date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      status: statuses[Math.floor(Math.random() * statuses.length)],
    });
  }

  return sessions;
};

// Function to generate date of birth
const generateDateOfBirth = () => {
  const year = 1960 + Math.floor(Math.random() * 40); // Ages between ~25-65
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Expand patient data with full details
const mockPatientsWithDetails = mockPatients.map(patient => ({
  ...patient,
  dateOfBirth: generateDateOfBirth(),
  age: Math.floor(Math.random() * 40) + 25, // Ages between 25-65
  sessions: generateMockSessions(patient.id),
}));

type TabType = 'session-history' | 'profile-details' | 'documents';

export function Patients() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState(mockPatients[0].id);
  const [activeTab, setActiveTab] = useState<TabType>('session-history');

  const selectedPatient = mockPatientsWithDetails.find(p => p.id === selectedPatientId) || null;

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-green-100 text-green-700',
      'notes-pending': 'bg-yellow-100 text-yellow-700',
      processing: 'bg-blue-100 text-blue-700',
    };
    const labels = {
      completed: 'Completed',
      'notes-pending': 'Notes Pending',
      processing: 'Processing',
    };
    const style = styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700';
    const label = labels[status as keyof typeof labels] || status;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${style}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Left Sidebar */}
      <div className="w-80 bg-white rounded-lg shadow-sm p-6 flex flex-col">
        {/* Clinician Profile */}
        <div className="flex items-center gap-3 mb-6">
          <img
            src={mockClinician.avatar}
            alt={mockClinician.name}
            className="w-12 h-12 rounded-full"
          />
          <div>
            <h3 className="font-semibold text-gray-900">{mockClinician.name}</h3>
            <p className="text-sm text-gray-600">{mockClinician.title}</p>
          </div>
        </div>

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
          {mockPatients
            .filter((patient) =>
              `${patient.firstName} ${patient.lastName}`
                .toLowerCase()
                .includes(searchQuery.toLowerCase())
            )
            .map((patient) => (
              <button
                key={patient.id}
                onClick={() => setSelectedPatientId(patient.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  selectedPatientId === patient.id
                    ? 'bg-blue-50 border-2 border-blue-200'
                    : 'hover:bg-gray-50 border-2 border-transparent'
                }`}
              >
                <img
                  src={patient.avatar}
                  alt={`${patient.firstName} ${patient.lastName}`}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">
                    {patient.firstName} {patient.lastName}
                  </p>
                  <p className="text-sm text-gray-600">Client ID: #{patient.id}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white rounded-lg shadow-sm p-8 overflow-y-auto">
        {selectedPatient ? (
          <>
            {/* Patient Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <img
                  src={selectedPatient.avatar}
                  alt={`${selectedPatient.firstName} ${selectedPatient.lastName}`}
                  className="w-20 h-20 rounded-full"
                />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </h1>
                  <p className="text-gray-600">
                    Client ID: #{selectedPatient.id} • DOB: {selectedPatient.dateOfBirth} (
                    {selectedPatient.age} yrs)
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Download className="w-4 h-4" />
                  Download Report
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </button>
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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">All Sessions</h2>
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Plus className="w-4 h-4" />
                    Add New Session
                  </button>
                </div>

                {/* Sessions Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Session ID
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Status
                        </th>
                        <th className="px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedPatient.sessions.map((session) => (
                        <tr key={session.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            #{session.id}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{session.date}</td>
                          <td className="px-6 py-4">{getStatusBadge(session.status)}</td>
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
                      value={selectedPatient.firstName}
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
                      value={selectedPatient.lastName}
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
                      value={selectedPatient.dateOfBirth}
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
                      value={`${selectedPatient.age} years`}
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
                      value={`#${selectedPatient.id}`}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Sessions
                    </label>
                    <input
                      type="text"
                      value={selectedPatient.sessions.length}
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
