import { useState } from 'react';
import { Download, Edit, Plus } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';

// Mock patient data
const mockPatient = {
  id: '34592',
  name: 'Amelia Chen',
  dateOfBirth: '1995-08-15',
  age: 28,
  avatarUrl: undefined,
};

const mockSessions = [
  {
    id: 'S2024-08',
    date: 'July 15, 2024',
    status: 'completed' as const,
  },
  {
    id: 'S2024-07',
    date: 'July 08, 2024',
    status: 'pending' as const,
  },
  {
    id: 'S2024-06',
    date: 'July 01, 2024',
    status: 'completed' as const,
  },
  {
    id: 'S2024-05',
    date: 'June 24, 2024',
    status: 'completed' as const,
  },
];

const mockProvider = {
  name: 'Dr. Eleanor Vance',
  title: 'Clinical Psychologist',
  avatarUrl: undefined,
};

const mockClients = [
  { id: '34592', name: 'Amelia Chen', clientId: '#34592' },
  { id: '34593', name: 'Benjamin Carter', clientId: '#34593' },
  { id: '34594', name: 'Chloe Davis', clientId: '#34594' },
];

export function PatientProfile() {
  const { patientId } = useParams();
  const [activeTab, setActiveTab] = useState<'history' | 'profile' | 'documents'>('history');

  const age = new Date().getFullYear() - new Date(mockPatient.dateOfBirth).getFullYear();

  return (
    <div className="flex gap-6">
      {/* Left Sidebar */}
      <div className="w-80 flex-shrink-0 space-y-6">
        {/* Provider Card */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-medium">EV</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{mockProvider.name}</h3>
              <p className="text-sm text-gray-600">{mockProvider.title}</p>
            </div>
          </div>

          {/* Search Clients */}
          <div className="mb-4">
            <input
              type="search"
              placeholder="Search clients..."
              className="w-full input-field"
            />
          </div>

          {/* Add New Client */}
          <button className="w-full btn-primary mb-6">
            <Plus className="w-4 h-4 inline mr-2" />
            Add New Client
          </button>

          {/* Client List */}
          <div className="space-y-2">
            {mockClients.map((client) => (
              <Link
                key={client.id}
                to={`/patients/${client.id}`}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  client.id === patientId || client.id === mockPatient.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-medium">
                    {client.name.split(' ').map((n) => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{client.name}</h4>
                  <p className="text-xs text-gray-600">Client ID: {client.clientId}</p>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="card">
          {/* Patient Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-2xl text-gray-600 font-medium">
                    {mockPatient.name.split(' ').map((n) => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {mockPatient.name}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Client ID: #{mockPatient.id} • DOB: {mockPatient.dateOfBirth} ({age} yrs)
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="btn-secondary">
                  <Download className="w-4 h-4 inline mr-2" />
                  Download Report
                </button>
                <button className="btn-primary">
                  <Edit className="w-4 h-4 inline mr-2" />
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mt-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('history')}
                className={`pb-3 px-1 font-medium transition-colors relative ${
                  activeTab === 'history'
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Session History
                {activeTab === 'history' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`pb-3 px-1 font-medium transition-colors relative ${
                  activeTab === 'profile'
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Profile Details
                {activeTab === 'profile' && (
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
          <div className="p-6">
            {activeTab === 'history' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">All Sessions</h2>
                  <button className="btn-primary">
                    <Plus className="w-4 h-4 inline mr-2" />
                    Add New Session
                  </button>
                </div>

                {/* Sessions Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Session ID
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Date
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Status
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockSessions.map((session) => (
                        <tr
                          key={session.id}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <span className="font-medium text-gray-900">
                              {session.id}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-gray-600">
                            {session.date}
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                                session.status === 'completed'
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-orange-50 text-orange-700'
                              }`}
                            >
                              {session.status === 'completed'
                                ? 'Completed'
                                : 'Notes Pending'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
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

            {activeTab === 'profile' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Profile Details
                </h2>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value="Amelia"
                      className="input-field"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value="Chen"
                      className="input-field"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="text"
                      value={mockPatient.dateOfBirth}
                      className="input-field"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client ID
                    </label>
                    <input
                      type="text"
                      value={`#${mockPatient.id}`}
                      className="input-field"
                      readOnly
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Documents
                </h2>
                <div className="text-center py-12 text-gray-500">
                  No documents uploaded yet
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
