import { useState } from 'react';
import { Save, FileText, Lock, Clock, Sparkles, ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

type NoteType = 'soap' | 'dare';

// Mock transcript data
const mockTranscript = [
  {
    id: '1',
    speaker: 'therapist' as const,
    time: '00:15',
    text: 'Good morning, Jane. Thank you for coming in today. How have things been since our last session?',
  },
  {
    id: '2',
    speaker: 'client' as const,
    time: '00:42',
    text: "Hi, Dr. Anya. Things have been... a bit of a rollercoaster. I tried that mindfulness exercise you suggested, and it helped sometimes. But this week at work was really stressful.",
  },
  {
    id: '3',
    speaker: 'therapist' as const,
    time: '01:10',
    text: 'I see. Can you tell me more about what was stressful at work?',
  },
  {
    id: '4',
    speaker: 'client' as const,
    time: '01:35',
    text: 'We had a major project deadline, and I felt like all the pressure was on me. I was working late, and my sleep schedule got all messed up again. I started feeling that familiar sense of dread on Sunday evening.',
  },
  {
    id: '5',
    speaker: 'therapist' as const,
    time: '02:01',
    text: "That sounds incredibly challenging. It's understandable that your sleep would be affected. Let's explore that feeling of dread a bit more.",
  },
];

export function ClinicalNotes() {
  const { sessionId: _ } = useParams();
  const navigate = useNavigate();
  const [noteType, setNoteType] = useState<NoteType>('soap');
  const [subjective, setSubjective] = useState(
    'Client reports a "rollercoaster" week with significant work-related stress due to a major project deadline. She notes a recurrence of sleep disruption and the "familiar sense of dread on Sunday evening." Client identifies a core fear of failure and "letting everyone down." She mentions utilizing mindfulness exercises with some success.'
  );
  const [objective, setObjective] = useState(
    'Client presented as alert and oriented. Affect was congruent with reported mood, appearing anxious when discussing work pressures. Speech was clear and goal-directed. No psychomotor agitation or retardation was observed.'
  );
  const [assessment, setAssessment] = useState(
    'Client continues to exhibit symptoms consistent with Generalized Anxiety Disorder, triggered by'
  );
  const [plan, setPlan] = useState('');

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>
      <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Left Panel - Transcript */}
      <div className="w-1/3 flex flex-col">
        <div className="card flex-1 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Session Transcript
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
              <Clock className="w-4 h-4" />
              October 26, 2023 - 45 min duration
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {mockTranscript.map((segment) => (
              <div
                key={segment.id}
                className={`${
                  segment.speaker === 'therapist'
                    ? 'bg-blue-50 border-l-4 border-blue-600'
                    : 'bg-gray-50 border-l-4 border-gray-300'
                } p-4 rounded-r-lg`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-xs font-semibold uppercase ${
                      segment.speaker === 'therapist'
                        ? 'text-blue-700'
                        : 'text-gray-700'
                    }`}
                  >
                    {segment.speaker === 'therapist' ? 'Therapist' : 'Client'}
                  </span>
                  <span className="text-xs text-gray-500">{segment.time}</span>
                </div>
                <p className="text-sm text-gray-900">{segment.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Clinical Notes */}
      <div className="flex-1 flex flex-col">
        <div className="card flex-1 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Client: Jane Doe - Session Note
              </h1>
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm">
                <Lock className="w-4 h-4" />
                HIPAA Compliant
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium text-gray-900">
                Draft with unsaved changes
              </span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>

            {/* Note Type Tabs */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setNoteType('soap')}
                className={`px-6 py-2 rounded-t-lg font-medium transition-colors ${
                  noteType === 'soap'
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                SOAP Note
              </button>
              <button
                onClick={() => setNoteType('dare')}
                className={`px-6 py-2 rounded-t-lg font-medium transition-colors ${
                  noteType === 'dare'
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                DARE Note
              </button>
            </div>
          </div>

          {/* Note Editor */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl space-y-6">
              {/* AI Generated Badge */}
              <div className="flex items-center justify-end">
                <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm">
                  <Sparkles className="w-4 h-4" />
                  AI-Generated Text
                </div>
              </div>

              {noteType === 'soap' ? (
                <>
                  {/* Subjective */}
                  <div>
                    <label className="block text-lg font-bold text-gray-900 mb-3">
                      Subjective
                    </label>
                    <textarea
                      value={subjective}
                      onChange={(e) => setSubjective(e.target.value)}
                      className="w-full h-32 input-field resize-none"
                      placeholder="Client's reported symptoms, concerns, and subjective experience..."
                    />
                  </div>

                  {/* Objective */}
                  <div>
                    <label className="block text-lg font-bold text-gray-900 mb-3">
                      Objective
                    </label>
                    <textarea
                      value={objective}
                      onChange={(e) => setObjective(e.target.value)}
                      className="w-full h-32 input-field resize-none"
                      placeholder="Observable facts, mental status exam, clinical observations..."
                    />
                  </div>

                  {/* Assessment */}
                  <div>
                    <label className="block text-lg font-bold text-gray-900 mb-3">
                      Assessment
                    </label>
                    <textarea
                      value={assessment}
                      onChange={(e) => setAssessment(e.target.value)}
                      className="w-full h-32 input-field resize-none"
                      placeholder="Clinical interpretation, diagnosis, progress evaluation..."
                    />
                  </div>

                  {/* Plan */}
                  <div>
                    <label className="block text-lg font-bold text-gray-900 mb-3">
                      Plan
                    </label>
                    <textarea
                      value={plan}
                      onChange={(e) => setPlan(e.target.value)}
                      className="w-full h-32 input-field resize-none"
                      placeholder="Treatment plan, interventions, next steps, homework..."
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Description */}
                  <div>
                    <label className="block text-lg font-bold text-gray-900 mb-3">
                      Description
                    </label>
                    <textarea
                      className="w-full h-32 input-field resize-none"
                      placeholder="Describe what happened during the session..."
                    />
                  </div>

                  {/* Action */}
                  <div>
                    <label className="block text-lg font-bold text-gray-900 mb-3">
                      Action
                    </label>
                    <textarea
                      className="w-full h-32 input-field resize-none"
                      placeholder="What actions or interventions were taken..."
                    />
                  </div>

                  {/* Response */}
                  <div>
                    <label className="block text-lg font-bold text-gray-900 mb-3">
                      Response
                    </label>
                    <textarea
                      className="w-full h-32 input-field resize-none"
                      placeholder="How the client responded to interventions..."
                    />
                  </div>

                  {/* Evaluation */}
                  <div>
                    <label className="block text-lg font-bold text-gray-900 mb-3">
                      Evaluation
                    </label>
                    <textarea
                      className="w-full h-32 input-field resize-none"
                      placeholder="Evaluation of session and next steps..."
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-gray-200 flex items-center justify-between">
            <button className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              View History
            </button>

            <div className="flex gap-3">
              <button className="btn-secondary">Save Draft</button>
              <button className="btn-primary">
                <Save className="w-4 h-4 inline mr-2" />
                Finalize & Sign
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
