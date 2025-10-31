import { useState } from 'react';
import { Search, Book, MessageCircle, FileText, Video, Mail, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How do I record a new therapy session?',
    answer: 'Navigate to Sessions > New Session, select your patient, choose your microphone, and click "Start Recording". The session will be automatically saved and transcribed.',
    category: 'Getting Started'
  },
  {
    question: 'How secure is my patient data?',
    answer: 'MindScribe is fully HIPAA-compliant. All data is encrypted at rest and in transit using industry-standard AES-256 encryption. We conduct regular security audits and never share your data with third parties.',
    category: 'Security & Privacy'
  },
  {
    question: 'Can I edit AI-generated clinical notes?',
    answer: 'Yes! All AI-generated notes are fully editable. Simply click on any field in the clinical note to edit the content before signing and finalizing.',
    category: 'Clinical Notes'
  },
  {
    question: 'What audio formats are supported for upload?',
    answer: 'MindScribe supports MP3, WAV, M4A, and WebM audio formats. Files up to 500MB are accepted for transcription.',
    category: 'Technical'
  },
  {
    question: 'How long does transcription take?',
    answer: 'Transcription typically completes within 2-5 minutes for a 50-minute session. You\'ll receive a notification when transcription is complete.',
    category: 'Transcription'
  },
  {
    question: 'Can I export my clinical notes?',
    answer: 'Yes, you can export notes as PDF or DOCX format. Navigate to the clinical note and click the Export button in the top right.',
    category: 'Clinical Notes'
  },
  {
    question: 'How do I add a new patient?',
    answer: 'Go to Patients > Add New Client. Fill in the required fields (name, date of birth) and optional contact information. Click Save to create the patient record.',
    category: 'Getting Started'
  },
  {
    question: 'What note formats are available?',
    answer: 'MindScribe supports SOAP (Subjective, Objective, Assessment, Plan) and DARE (Description, Assessment, Response, Evaluation) note formats. You can select your preferred format when generating notes.',
    category: 'Clinical Notes'
  },
];

const categories = ['All', 'Getting Started', 'Clinical Notes', 'Transcription', 'Security & Privacy', 'Technical'];

export function Help() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 lg:mb-8 text-center">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
          Help & Support
        </h1>
        <p className="text-sm lg:text-base text-gray-600 max-w-2xl mx-auto">
          Get help with MindScribe. Browse our FAQs, watch tutorials, or contact our support team.
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6 lg:mb-8">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 lg:py-4 text-sm lg:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 lg:mb-12">
        <a
          href="#documentation"
          className="bg-white rounded-lg shadow-sm p-4 lg:p-6 hover:shadow-md transition-shadow"
        >
          <Book className="w-8 h-8 lg:w-10 lg:h-10 text-blue-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1 text-sm lg:text-base">Documentation</h3>
          <p className="text-xs lg:text-sm text-gray-600">Comprehensive guides and tutorials</p>
        </a>

        <a
          href="#video-tutorials"
          className="bg-white rounded-lg shadow-sm p-4 lg:p-6 hover:shadow-md transition-shadow"
        >
          <Video className="w-8 h-8 lg:w-10 lg:h-10 text-blue-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1 text-sm lg:text-base">Video Tutorials</h3>
          <p className="text-xs lg:text-sm text-gray-600">Watch step-by-step walkthroughs</p>
        </a>

        <a
          href="#contact"
          className="bg-white rounded-lg shadow-sm p-4 lg:p-6 hover:shadow-md transition-shadow"
        >
          <MessageCircle className="w-8 h-8 lg:w-10 lg:h-10 text-blue-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1 text-sm lg:text-base">Live Chat</h3>
          <p className="text-xs lg:text-sm text-gray-600">Chat with our support team</p>
        </a>

        <a
          href="#contact"
          className="bg-white rounded-lg shadow-sm p-4 lg:p-6 hover:shadow-md transition-shadow"
        >
          <Mail className="w-8 h-8 lg:w-10 lg:h-10 text-blue-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1 text-sm lg:text-base">Email Support</h3>
          <p className="text-xs lg:text-sm text-gray-600">Get help via email</p>
        </a>
      </div>

      {/* FAQs Section */}
      <div className="mb-8 lg:mb-12">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 lg:mb-6">
          Frequently Asked Questions
        </h2>

        {/* Category Filter */}
        <div className="flex gap-2 mb-4 lg:mb-6 overflow-x-auto pb-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="space-y-3 lg:space-y-4">
          {filteredFAQs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-6 lg:p-8 text-center">
              <p className="text-sm lg:text-base text-gray-600">No FAQs found matching your search.</p>
            </div>
          ) : (
            filteredFAQs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 lg:p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3 lg:gap-4 text-left flex-1">
                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm lg:text-base mb-1">
                        {faq.question}
                      </h3>
                      <span className="text-xs text-blue-600">{faq.category}</span>
                    </div>
                  </div>
                  {expandedFAQ === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                  )}
                </button>
                {expandedFAQ === index && (
                  <div className="px-4 lg:px-6 pb-4 lg:pb-6 pt-0">
                    <div className="pl-8 lg:pl-9">
                      <p className="text-sm lg:text-base text-gray-700 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Documentation Section */}
      <div id="documentation" className="mb-8 lg:mb-12">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 lg:mb-6">
          Documentation
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <a
            href="#"
            className="bg-white rounded-lg shadow-sm p-4 lg:p-6 hover:shadow-md transition-shadow flex items-start gap-4"
          >
            <Book className="w-8 h-8 text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2 text-sm lg:text-base">Getting Started Guide</h3>
              <p className="text-xs lg:text-sm text-gray-600 mb-3">
                Complete walkthrough for new users
              </p>
              <div className="flex items-center text-blue-600 text-xs lg:text-sm font-medium">
                Read more <ExternalLink className="w-4 h-4 ml-1" />
              </div>
            </div>
          </a>

          <a
            href="#"
            className="bg-white rounded-lg shadow-sm p-4 lg:p-6 hover:shadow-md transition-shadow flex items-start gap-4"
          >
            <FileText className="w-8 h-8 text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2 text-sm lg:text-base">Clinical Notes Guide</h3>
              <p className="text-xs lg:text-sm text-gray-600 mb-3">
                How to create and manage clinical notes
              </p>
              <div className="flex items-center text-blue-600 text-xs lg:text-sm font-medium">
                Read more <ExternalLink className="w-4 h-4 ml-1" />
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* Contact Section */}
      <div id="contact" className="bg-white rounded-lg shadow-sm p-6 lg:p-8">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 lg:mb-6">
          Still Need Help?
        </h2>
        <p className="text-sm lg:text-base text-gray-600 mb-6">
          Our support team is here to help you. Reach out via email or schedule a call.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="mailto:support@mindscribe.com"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm lg:text-base font-medium"
          >
            <Mail className="w-5 h-5" />
            Email Support
          </a>
          <a
            href="#"
            className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm lg:text-base font-medium"
          >
            <MessageCircle className="w-5 h-5" />
            Start Live Chat
          </a>
        </div>
      </div>
    </div>
  );
}
