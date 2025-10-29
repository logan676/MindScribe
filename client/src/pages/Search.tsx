import { useState } from 'react';
import { Search as SearchIcon, X, Settings as SettingsIcon, LogOut } from 'lucide-react';

// Mock search results
const mockResults = [
  {
    id: '1',
    patientName: 'Jane D.',
    date: 'September 12, 2023',
    sessionType: 'Follow-up',
    excerpt:
      'Patient reported feeling more anxious this week, citing work-related stress as a primary trigger. We explored several CBT techniques for managing intrusive thoughts during high...',
    tags: ['Anxiety', 'CBT', 'Work Stress'],
    daysAgo: 3,
  },
  {
    id: '2',
    patientName: 'John S.',
    date: 'September 10, 2023',
    sessionType: 'Initial Assessment',
    excerpt:
      'Initial session focused on gathering patient history and establishing therapeutic goals. Patient presents with symptoms of depression and social withdrawal following a recent lif...',
    tags: ['Depression', 'Family History'],
    daysAgo: 5,
  },
];

export function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Anxiety', 'CBT']);
  const [sessionType, setSessionType] = useState('initial');
  const [sortBy, setSortBy] = useState('date_newest');

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedPatient('all');
    setStartDate('');
    setEndDate('');
    setSelectedTags([]);
    setSessionType('initial');
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Left Sidebar - Navigation */}
      <div className="w-64 flex-shrink-0">
        <div className="card h-full flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                </svg>
              </div>
              <span className="font-bold text-lg">TheraNotes AI</span>
            </div>
          </div>

          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              <li>
                <a
                  href="/"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                  Dashboard
                </a>
              </li>
              <li>
                <a
                  href="/patients"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  Patients
                </a>
              </li>
              <li>
                <a
                  href="/search"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 text-blue-600 transition-colors"
                >
                  <SearchIcon className="w-5 h-5" />
                  Search
                </a>
              </li>
            </ul>
          </nav>

          <div className="p-4 border-t border-gray-200 space-y-2">
            <a
              href="/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <SettingsIcon className="w-5 h-5" />
              Settings
            </a>
            <a
              href="/logout"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Log Out
            </a>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <div>
          <div className="mb-4 text-sm text-gray-600">
            <a href="/" className="hover:text-gray-900">Home</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Search</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Search Past Sessions
          </h1>

          {/* Search Bar */}
          <div className="card p-6 mb-6">
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across all notes, transcriptions, and patient data"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Results Section */}
          <div className="flex gap-6 flex-1">
            {/* Results List */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recent Sessions</h2>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input-field w-auto"
                >
                  <option value="date_newest">Sort by Date (Newest)</option>
                  <option value="date_oldest">Sort by Date (Oldest)</option>
                  <option value="relevance">Sort by Relevance</option>
                </select>
              </div>

              <div className="space-y-4">
                {mockResults.map((result) => (
                  <div key={result.id} className="card p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">
                          {result.patientName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {result.date} - {result.sessionType}
                        </p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {result.daysAgo} days ago
                      </span>
                    </div>

                    <p className="text-gray-700 mb-4 leading-relaxed">
                      {result.excerpt}
                    </p>

                    <div className="flex items-center gap-2">
                      {result.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            tag === 'Anxiety'
                              ? 'bg-blue-50 text-blue-700'
                              : tag === 'CBT'
                              ? 'bg-green-50 text-green-700'
                              : tag === 'Depression'
                              ? 'bg-red-50 text-red-700'
                              : tag === 'Work Stress'
                              ? 'bg-purple-50 text-purple-700'
                              : 'bg-yellow-50 text-yellow-700'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center gap-2 mt-8">
                <button className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium">
                  1
                </button>
                <button className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                  2
                </button>
                <button className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                  3
                </button>
                <button className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Filter Sidebar */}
            <div className="w-80 flex-shrink-0">
              <div className="card p-6 sticky top-24">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Filter by</h2>

                {/* Patient Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patient
                  </label>
                  <select
                    value={selectedPatient}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                    className="input-field"
                  >
                    <option value="all">All Patients</option>
                    <option value="jane">Jane D.</option>
                    <option value="john">John S.</option>
                  </select>
                </div>

                {/* Date Range */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Range
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      placeholder="mm/dd/yyyy"
                      className="input-field"
                    />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      placeholder="mm/dd/yyyy"
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Tags / Topics */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags / Topics
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                      >
                        {tag}
                        <button
                          onClick={() => toggleTag(tag)}
                          className="hover:text-blue-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => toggleTag('Depression')}
                      className={`text-sm px-3 py-1 rounded-full ${
                        selectedTags.includes('Depression')
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Depression +
                    </button>
                  </div>
                </div>

                {/* Session Type */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Session Type
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="sessionType"
                        value="initial"
                        checked={sessionType === 'initial'}
                        onChange={(e) => setSessionType(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Initial Assessment
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="sessionType"
                        value="followup"
                        checked={sessionType === 'followup'}
                        onChange={(e) => setSessionType(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">Follow-up</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="sessionType"
                        value="couples"
                        checked={sessionType === 'couples'}
                        onChange={(e) => setSessionType(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Couples Therapy
                      </span>
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button className="flex-1 btn-primary">Apply Filters</button>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8 py-6 border-t flex items-center justify-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          Confidential Patient Data - HIPAA Compliant
        </div>
      </div>
    </div>
  );
}
