import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Transcription from './pages/Transcription';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import UploadAudio from './pages/UploadAudio';
import UserHistory from './pages/UserHistory';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminGuard from './components/AdminGuard';
import LiveChat from './components/LiveChat';
import Pricing from './pages/Pricing';


const funFacts = [
  { label: 'Users', value: 1234 },
  { label: 'Transcriptions', value: 56789 },
  { label: 'Uptime (%)', value: 99.99 },
];
const quotes = [
  'The best way to get started is to quit talking and begin doing. – Walt Disney',
  'Success is not in what you have, but who you are. – Bo Bennett',
  'The only limit to our realization of tomorrow is our doubts of today. – F.D. Roosevelt',
];
const testimonials = [
  '“Transcripto made my podcast workflow so much easier!” — Taylor R.',
  '“Accurate, fast, and super easy to use.” — Morgan S.',
  '“The best transcription tool I have ever used!” — Alex P.'
];
const timeline = [
  { year: 2022, event: 'Project started' },
  { year: 2023, event: 'Beta launch' },
  { year: 2024, event: 'v2.0 released' },
];
const roadmap = [
  { feature: 'Mobile App', votes: 42 },
  { feature: 'Multi-language', votes: 35 },
  { feature: 'Team Collaboration', votes: 28 },
];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const leaderboardData = [
  { name: 'Alice', score: 120 },
  { name: 'Bob', score: 110 },
  { name: 'Charlie', score: 95 },
];
const notifications = [
  'New transcription completed!',
  'User Alex joined!',
  'System update scheduled for Friday.',
];
const dashboardWidgets = [
  'Transcription Stats',
  'Recent Activity',
  'Quick Upload',
];
const themes = [
  { name: 'Default', class: '' },
  { name: 'Ocean', class: 'bg-blue-100 text-blue-900' },
  { name: 'Forest', class: 'bg-green-100 text-green-900' },
  { name: 'Rose', class: 'bg-pink-100 text-pink-900' },
];

const faqs = [
  {
    q: 'What is Transcripto?',
    a: 'Transcripto is an AI-powered web platform that converts your audio or spoken words into accurate, readable text using advanced speech-to-text technology.'
  },
  {
    q: 'How does Transcripto work?',
    a: 'Simply upload or record your audio directly on the platform. Our AI system processes the audio and generates a transcription in seconds. You can view, edit, and download the text easily.'
  },
  {
    q: 'What types of audio files does Transcripto support?',
    a: 'We support a wide range of audio formats including: .mp3, .wav, .m4a, .ogg.'
  },
  {
    q: 'Is there a limit to the audio length I can upload?',
    a: 'Currently, you can upload audio files up to 60 minutes long. For longer durations or bulk transcription, contact our support team for a custom plan.'
  },
  {
    q: 'Can I edit the transcribed text?',
    a: 'Yes! Once the transcription is generated, you can review and edit the text within our editor before saving or exporting it.'
  },
  {
    q: 'Is my data secure?',
    a: 'Absolutely. We prioritize user privacy. All audio and transcription data is encrypted, and we never share your files with third parties.'
  },
  {
    q: 'Do I need an account to use Transcripto?',
    a: 'Yes, creating an account helps you manage your transcriptions, access them anytime, and track your usage history.'
  },
  {
    q: 'Is Transcripto free?',
    a: 'We offer a free trial with limited minutes. For extended use, we have affordable premium plans. Visit our Pricing Page for details.'
  },
  {
    q: 'Can I access my transcriptions later?',
    a: 'Yes, all your past transcriptions are saved in your dashboard for future access and download, unless you choose to delete them.'
  },
  {
    q: 'Do you support multiple languages?',
    a: 'Currently, we support transcription in English, with more languages like Hindi, Spanish, and French coming soon!'
  },
  {
    q: 'Who can use Transcripto?',
    a: 'Anyone! Whether you\'re a student, content creator, journalist, or business professional — if you need fast and accurate transcription, Transcripto is for you.'
  },
  {
    q: 'How can I contact support?',
    a: 'You can reach our team anytime via support@transcripto.ai or use the live chat option on our website.'
  }
];

const legalContent = `📄 Terms of Service\n\nWelcome to Transcripto. By using our website and services, you agree to comply with the following Terms of Service:\n\nUse of Service\nYou agree to use Transcripto for lawful purposes only. Any misuse or unauthorized access will result in termination of your account.\n\nAccount Responsibility\nYou are responsible for maintaining the confidentiality of your login credentials and all activities under your account.\n\nContent Ownership\nAll content you upload remains your intellectual property. Transcripto does not claim ownership of your files.\n\nService Availability\nWhile we aim for 99.9% uptime, we do not guarantee uninterrupted access to the platform and may update or suspend services without prior notice.\n\nTermination\nWe reserve the right to suspend or terminate your access if you violate these terms.\n\nChanges to Terms\nWe may update these Terms from time to time. Continued use of the service means you accept the revised terms.\n\n🔒 Privacy Policy\n\nYour privacy is important to us. This Privacy Policy outlines how Transcripto collects, uses, and protects your data:\n\nData Collection\nWe collect personal information (such as email and name) and audio files solely for the purpose of providing our transcription service.\n\nData Usage\nYour data is used only to deliver, improve, and personalize your experience with our services.\n\nData Storage & Security\nAll uploaded files and transcriptions are stored securely using encrypted storage. Only you have access to your files.\n\nThird-Party Sharing\nWe do not sell, trade, or share your personal data with third parties without your consent.\n\nCookies\nWe use cookies to enhance your browsing experience and analyze usage patterns. You can manage your cookie preferences anytime.\n\nYour Rights\nYou can request to delete your account and data at any time by contacting our support team.\n\nPolicy Updates\nWe may revise this policy occasionally. Updates will be posted here, and continued use of our site confirms your acceptance.`;

const Home = () => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [showNewsletterPopup, setShowNewsletterPopup] = useState(false);
  const [showDownloadPopup, setShowDownloadPopup] = useState(false);
  const [downloadPlatform, setDownloadPlatform] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatEmail, setChatEmail] = useState('');
  const [chatEmailInput, setChatEmailInput] = useState('');
  const [chatEmailError, setChatEmailError] = useState('');
  const [showFaq, setShowFaq] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [suggestionSubmitted, setSuggestionSubmitted] = useState(false);
  const [suggestions, setSuggestions] = useState([]); // For admin dashboard storage
  const [faqIndex, setFaqIndex] = useState(0);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [activePlan, setActivePlan] = useState('Free');
  
  // Question game state
  const [showQuestionGame, setShowQuestionGame] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [gameScore, setGameScore] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  // Question game data
  const questions = [
    {
      question: "What is 7 + 5?",
      options: [
        "10",
        "12",
        "13",
        "15"
      ],
      correctAnswer: 1
    },
    {
      question: "What is 9 - 4?",
      options: [
        "3",
        "4",
        "5",
        "6"
      ],
      correctAnswer: 2
    },
    {
      question: "What is 6 × 3?",
      options: [
        "9",
        "12",
        "15",
        "18"
      ],
      correctAnswer: 3
    },
    {
      question: "What is 20 ÷ 4?",
      options: [
        "4",
        "5",
        "6",
        "8"
      ],
      correctAnswer: 1
    },
    {
      question: "What is the value of 2²?",
      options: [
        "2",
        "4",
        "6",
        "8"
      ],
      correctAnswer: 1
    }
  ];

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail) {
      setShowNewsletterPopup(true);
    }
  };

  const handleDownloadClick = (platform) => {
    setDownloadPlatform(platform);
    setShowDownloadPopup(true);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      setChatMessages([...chatMessages, { from: 'user', text: chatInput }]);
      setChatInput('');
      // Here you would send the message to the backend for admin to see/reply
    }
  };

  const handleChatEmailSubmit = (e) => {
    e.preventDefault();
    if (!chatEmailInput.match(/^\S+@\S+\.\S+$/)) {
      setChatEmailError('Please enter a valid email address.');
      return;
    }
    setChatEmail(chatEmailInput);
    setChatEmailError('');
  };

  const handleCloseChat = () => {
    setShowChat(false);
    setChatEmail('');
    setChatEmailInput('');
    setChatEmailError('');
    setChatMessages([]);
    setChatInput('');
  };

  const handleFaqSuggestionSubmit = (e) => {
    e.preventDefault();
    if (suggestion.trim()) {
      setSuggestions([...suggestions, suggestion]);
      setSuggestion('');
      setSuggestionSubmitted(true);
      setTimeout(() => setSuggestionSubmitted(false), 2000);
    }
  };

  const handleUpgradeClick = (plan) => {
    setSelectedPlan(plan);
    setShowQuestionGame(true);
    setCurrentQuestionIndex(0);
    setGameScore(0);
    setGameCompleted(false);
    setSelectedAnswer(null);
  };

  const handleAnswerSelect = (answerIndex) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === questions[currentQuestionIndex].correctAnswer) {
      setGameScore(gameScore + 1);
    }
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    } else {
      setGameCompleted(true);
    }
  };

  const handleGameComplete = () => {
    if (gameScore >= 3) {
      setShowQuestionGame(false);
      setShowPaymentModal(true);
      setPaymentSuccess(false);
    }
  };

  const handleTryAgain = () => {
    setCurrentQuestionIndex(0);
    setGameScore(0);
    setGameCompleted(false);
    setSelectedAnswer(null);
  };

  const handleDummyPayment = () => {
    setTimeout(() => {
      setPaymentSuccess(true);
      setActivePlan(selectedPlan);
    }, 1200);
  };

  const termsContent = (
    <span>
      📄 Terms of Service<br /><br />
      Welcome to Transcripto. By using our website and services, you agree to comply with the following <button className="text-blue-600 underline" onClick={e => {e.stopPropagation(); setShowPrivacy(true); setShowTerms(false);}}>Privacy Policy</button> and Terms of Service:<br /><br />
      <b>Use of Service</b><br />
      You agree to use Transcripto for lawful purposes only. Any misuse or unauthorized access will result in termination of your account.<br /><br />
      <b>Account Responsibility</b><br />
      You are responsible for maintaining the confidentiality of your login credentials and all activities under your account.<br /><br />
      <b>Content Ownership</b><br />
      All content you upload remains your intellectual property. Transcripto does not claim ownership of your files.<br /><br />
      <b>Service Availability</b><br />
      While we aim for 99.9% uptime, we do not guarantee uninterrupted access to the platform and may update or suspend services without prior notice.<br /><br />
      <b>Termination</b><br />
      We reserve the right to suspend or terminate your access if you violate these terms.<br /><br />
      <b>Changes to Terms</b><br />
      We may update these Terms from time to time. Continued use of the service means you accept the revised terms and our <button className="text-blue-600 underline" onClick={e => {e.stopPropagation(); setShowPrivacy(true); setShowTerms(false);}}>Privacy Policy</button>.
    </span>
  );

  const privacyContent = (
    <span>
      🔒 Privacy Policy<br /><br />
      Your privacy is important to us. This Privacy Policy outlines how Transcripto collects, uses, and protects your data:<br /><br />
      <b>Data Collection</b><br />
      We collect personal information (such as email and name) and audio files solely for the purpose of providing our transcription service.<br /><br />
      <b>Data Usage</b><br />
      Your data is used only to deliver, improve, and personalize your experience with our services.<br /><br />
      <b>Data Storage & Security</b><br />
      All uploaded files and transcriptions are stored securely using encrypted storage. Only you have access to your files.<br /><br />
      <b>Third-Party Sharing</b><br />
      We do not sell, trade, or share your personal data with third parties without your consent.<br /><br />
      <b>Cookies</b><br />
      We use cookies to enhance your browsing experience and analyze usage patterns. You can manage your cookie preferences anytime.<br /><br />
      <b>Your Rights</b><br />
      You can request to delete your account and data at any time by contacting our support team.<br /><br />
      <b>Policy Updates</b><br />
      We may revise this policy occasionally. Updates will be posted here, and continued use of our site confirms your acceptance of this Privacy Policy and our <button className="text-blue-600 underline" onClick={e => {e.stopPropagation(); setShowTerms(true); setShowPrivacy(false);}}>Terms of Service</button>.
    </span>
  );

  return (
    <div className="w-full flex flex-col items-center gap-12 relative">
      {/* About Section */}
      <div className="w-full flex justify-center items-center">
        <div className="w-full max-w-3xl bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-2xl p-10 border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-8 items-center">
          <img
            src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80"
            alt="Demo"
            className="w-64 h-64 object-cover rounded-xl shadow-md border border-gray-200 dark:border-gray-700"
          />
          <div className="flex-1">
            <h1 className="text-4xl font-extrabold mb-4 text-gray-900 dark:text-gray-100">About This Project</h1>
            <p className="mb-4 text-lg text-gray-700 dark:text-gray-200">
              <span className="font-semibold">Transcripto</span> is a modern web application for audio transcription. Record or upload audio, get instant transcriptions, and manage your history. Admins can review and edit all transcriptions. Built with React, Node.js, and Tailwind CSS.
            </p>
            <ul className="mb-4 list-disc list-inside text-gray-700 dark:text-gray-200">
              <li>🎤 Record or upload audio for transcription</li>
              <li>📝 View and manage your transcription history</li>
              <li>🔒 Secure authentication and user roles</li>
              <li>🛠️ Admin dashboard for managing all transcriptions</li>
            </ul>
          </div>
        </div>
      </div>
      {/* Demo Section */}
      <div className="w-full flex justify-center items-center">
        <div className="w-full max-w-3xl bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-2xl p-10 border border-gray-200 dark:border-gray-700 flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Live Demo</h2>
          <p className="mb-6 text-gray-700 dark:text-gray-200 text-center">Experience Transcripto in action! Watch the video below or click to try a sample audio transcription.</p>
          <div className="w-full aspect-video max-w-xl rounded-lg overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
            <iframe
              width="100%"
              height="315"
              src="https://www.youtube.com/embed/8SQV-B83tPU"
              title="Demo Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
          <button
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors"
            onClick={() => navigate('/login')}
          >
            Try Demo
          </button>
        </div>
      </div>
      {/* Question Game Modal */}
      {showQuestionGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700 flex flex-col items-center max-w-2xl w-full">
            {!gameCompleted ? (
              <>
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Quick Quiz - Upgrade to {selectedPlan}</h3>
                <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  Question {currentQuestionIndex + 1} of {questions.length} | Score: {gameScore}
                </div>
                <div className="w-full mb-6">
                  <div className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    {questions[currentQuestionIndex].question}
                  </div>
                  <div className="space-y-3">
                    {questions[currentQuestionIndex].options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(index)}
                        className={`w-full p-3 text-left rounded-lg border transition-colors ${
                          selectedAnswer === index
                            ? 'bg-blue-100 dark:bg-blue-900 border-blue-500 text-blue-900 dark:text-blue-100'
                            : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleNextQuestion}
                  disabled={selectedAnswer === null}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                </button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Quiz Complete!</h3>
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{gameScore}/{questions.length}</div>
                  <div className="text-lg text-gray-700 dark:text-gray-300">
                    {gameScore === questions.length && "Perfect! 🎉"}
                    {gameScore >= questions.length * 0.8 && gameScore < questions.length && "Great job! 👍"}
                    {gameScore >= questions.length * 0.6 && gameScore < questions.length * 0.8 && "Good effort! 😊"}
                    {gameScore < questions.length * 0.6 && "Keep learning! 📚"}
                  </div>
                </div>
                {gameScore >= 3 ? (
                  <div className="text-center">
                    <div className="text-green-600 font-semibold mb-4">Congratulations! You can proceed to payment.</div>
                    <button
                      onClick={handleGameComplete}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-green-700 transition-colors"
                    >
                      Continue to Payment
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-red-600 font-semibold mb-4">Score too low! You need at least 3 correct answers to proceed.</div>
                    <button
                      onClick={handleTryAgain}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Dummy Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700 flex flex-col items-center max-w-sm w-full">
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">Dummy Payment</h3>
            <p className="mb-4 text-gray-700 dark:text-gray-200 text-center">
              This is a test payment for the <span className="font-semibold">{selectedPlan}</span> plan.<br />
              No real money will be charged.
            </p>
            {!paymentSuccess ? (
              <button onClick={handleDummyPayment} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors">Simulate Payment</button>
            ) : (
              <div className="text-green-600 font-semibold mb-4">Payment Successful! You are now on the {selectedPlan} plan.</div>
            )}
            <button onClick={() => setShowPaymentModal(false)} className="mt-4 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-lg font-semibold shadow hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors">Close</button>
          </div>
        </div>
      )}
      
      {/* Blog/News Section */}
      <div className="w-full flex justify-center items-center">
        <div className="w-full max-w-4xl bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100 text-center">Latest News</h2>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">🎉 Version 2.0 Released!</h3>
              <p className="text-gray-700 dark:text-gray-200">We’ve added multi-language support and a new analytics dashboard. Check it out now!</p>
            </div>
            <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">🚀 Mobile App Coming Soon</h3>
              <p className="text-gray-700 dark:text-gray-200">Stay tuned for our iOS and Android apps, launching this fall.</p>
            </div>
          </div>
        </div>
      </div>
      {/* Newsletter Signup Section */}
      <div className="w-full flex justify-center items-center">
        <div className="w-full max-w-xl bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700 flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Newsletter Signup</h2>
          <form onSubmit={handleNewsletterSubmit} className="w-full flex flex-col md:flex-row gap-4 items-center justify-center">
            <input
              type="email"
              placeholder="Your email"
              value={newsletterEmail}
              onChange={e => setNewsletterEmail(e.target.value)}
              className="flex-1 p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
            <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors">Subscribe</button>
          </form>
        </div>
        {/* Newsletter Popup Modal */}
        {showNewsletterPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700 flex flex-col items-center max-w-sm w-full">
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">Subscribed!</h3>
              <p className="mb-4 text-gray-700 dark:text-gray-200 text-center">
                You subscribed to <span className="font-semibold">Transcripto</span> with <span className="font-semibold">{newsletterEmail}</span>
              </p>
              <button onClick={() => setShowNewsletterPopup(false)} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors">Close</button>
            </div>
          </div>
        )}
      </div>
      {/* Social Media Links Section */}
      <div className="w-full flex justify-center items-center">
        <div className="w-full max-w-xl bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700 flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Developer Handles</h2>
          <div className="flex gap-6">
            <a href="https://www.facebook.com/guru.offx" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-900 text-3xl" aria-label="Facebook">📘</a>
            <a href="https://www.instagram.com/gurux04/?utm_source=ig_web_button_share_sheet" target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-700 text-3xl" aria-label="Instagram">📸</a>
            <a href="https://x.com/chiragkb04" target="_blank" rel="noopener noreferrer" className="text-black hover:text-gray-700 text-3xl" aria-label="X">𝕏</a>
            <a href="https://github.com/codest0411" target="_blank" rel="noopener noreferrer" className="text-gray-800 hover:text-black text-3xl" aria-label="GitHub">🐙</a>
            <a href="https://www.linkedin.com/in/chirag-bhandarkar-206124232/" target="_blank" rel="noopener noreferrer" className="text-blue-800 hover:text-blue-900 text-3xl" aria-label="LinkedIn">💼</a>
          </div>
        </div>
      </div>
      {/* Download App Section */}
      <div className="w-full flex justify-center items-center">
        <div className="w-full max-w-xl bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700 flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Download App</h2>
          <div className="flex gap-6">
            <button
              onClick={() => handleDownloadClick('App Store')}
              className="bg-black text-white px-6 py-3 rounded-lg font-semibold shadow flex items-center gap-2 hover:bg-gray-800 transition-colors"
            >
              <span>⬇️</span> App Store
            </button>
            <button
              onClick={() => handleDownloadClick('Google Play')}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold shadow flex items-center gap-2 hover:bg-green-700 transition-colors"
            >
              <span>⬇️</span> Google Play
            </button>
          </div>
        </div>
        {/* Download Popup Modal */}
        {showDownloadPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700 flex flex-col items-center max-w-sm w-full">
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">Coming Soon!</h3>
              <p className="mb-4 text-gray-700 dark:text-gray-200 text-center">
                The app is in process. Coming soon!<br />- <span className="font-semibold">Transcripto</span>
              </p>
              <button onClick={() => setShowDownloadPopup(false)} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors">Close</button>
            </div>
          </div>
        )}
      </div>
      {/* Support/Help Center Section */}
      <div className="w-full flex justify-center items-center">
        <div className="w-full max-w-xl bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700 flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Support & Help Center</h2>
          <div className="flex flex-col gap-2 items-center">
            <button onClick={() => setShowChat(true)} className="text-blue-600 hover:underline">Live Chat</button>
            <button onClick={() => setShowFaq(true)} className="text-blue-600 hover:underline">FAQ</button>
          </div>
        </div>
        {/* Live Chat Modal */}
        {showChat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700 flex flex-col items-center max-w-sm w-full">
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">Live Chat</h3>
              {!chatEmail ? (
                <form onSubmit={handleChatEmailSubmit} className="w-full flex flex-col items-center gap-2">
                  <input
                    type="email"
                    value={chatEmailInput}
                    onChange={e => setChatEmailInput(e.target.value)}
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-700"
                    placeholder="Enter your email to start chat"
                    required
                  />
                  {chatEmailError && <div className="text-red-500 text-sm">{chatEmailError}</div>}
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors w-full">Start Chat</button>
                </form>
              ) : (
                <>
                  <div className="w-full text-sm text-gray-500 dark:text-gray-300 mb-2 text-center">You are chatting as <span className="font-semibold">{chatEmail}</span></div>
                  <div className="w-full h-48 bg-gray-100 dark:bg-gray-900 rounded-lg p-3 mb-2 overflow-y-auto border border-gray-200 dark:border-gray-700 flex flex-col gap-2">
                    {chatMessages.length === 0 && <div className="text-gray-400 text-center">No messages yet.</div>}
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={msg.from === 'user' ? 'text-right text-blue-600' : 'text-left text-green-600'}>{msg.text}</div>
                    ))}
                  </div>
                  <form onSubmit={handleSendChat} className="w-full flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-700"
                      placeholder="Type your message..."
                    />
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors">Send</button>
                  </form>
                </>
              )}
              <button onClick={handleCloseChat} className="mt-4 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-lg font-semibold shadow hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors">Close</button>
            </div>
          </div>
        )}
        {/* FAQ Modal */}
        {showFaq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700 flex flex-col items-center max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Frequently Asked Questions</h3>
              <div className="text-gray-800 dark:text-gray-100 text-left w-full text-base mb-6">
                <div className="font-semibold mb-2">{faqIndex + 1}. {faqs[faqIndex].q}</div>
                <div>{faqs[faqIndex].a}</div>
              </div>
              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => setFaqIndex(i => Math.max(0, i - 1))}
                  disabled={faqIndex === 0}
                  className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold disabled:opacity-50"
                >Previous</button>
                <button
                  onClick={() => setFaqIndex(i => Math.min(faqs.length - 1, i + 1))}
                  disabled={faqIndex === faqs.length - 1}
                  className="px-4 py-2 rounded bg-blue-600 text-white font-semibold disabled:opacity-50"
                >Next</button>
              </div>
              <form onSubmit={handleFaqSuggestionSubmit} className="w-full flex flex-col items-center gap-2 mb-2">
                <textarea
                  value={suggestion}
                  onChange={e => setSuggestion(e.target.value)}
                  className="w-full p-2 rounded border border-gray-300 dark:border-gray-700"
                  placeholder="Have a suggestion? Let us know!"
                  rows={3}
                  required
                />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors">Submit Suggestion</button>
                {suggestionSubmitted && <div className="text-green-600 font-semibold">Thank you for your suggestion!</div>}
              </form>
              <button onClick={() => { setShowFaq(false); setFaqIndex(0); }} className="mt-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-lg font-semibold shadow hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors">Close</button>
            </div>
          </div>
        )}
      </div>
      {/* Contact Section */}
      <div className="w-full flex justify-center items-center pb-8">
        <div className="w-full max-w-3xl bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700 flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Contact</h2>
          <p className="mb-2 text-gray-700 dark:text-gray-200">Email: <a href="mailto:transcripto45@gmail.com" className="text-blue-600 hover:underline">transcripto45@gmail.com</a></p>
          <p className="mb-2 text-gray-700 dark:text-gray-200">GitHub: <a href="https://github.com/codest0411" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">github.com/codest0411</a></p>
        </div>
      </div>
      {/* Footer */}
      <footer className="w-full bg-gray-900 text-gray-200 py-6 mt-8 flex flex-col items-center text-center text-sm">
        <div className="mb-2">&copy; {new Date().getFullYear()} Transcripto. All rights reserved.</div>
        <div className="flex gap-4">
          <span onClick={() => setShowLegal(true)} className="hover:underline text-blue-500 cursor-pointer">Terms of Service</span>
          <span onClick={() => setShowLegal(true)} className="hover:underline text-blue-500 cursor-pointer">Privacy Policy</span>
          <a href="http://localhost:5173/admin-login" className="hover:underline text-gray-400 cursor-pointer text-xs">Admin</a>
        </div>
      </footer>
      {/* Legal Modal */}
      {showLegal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700 flex flex-col items-center max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Terms of Service & Privacy Policy</h3>
            <div className="text-gray-800 dark:text-gray-100 text-left w-full whitespace-pre-line mb-4">{legalContent}</div>
            <button onClick={() => setShowLegal(false)} className="mt-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-lg font-semibold shadow hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

function GetStarted() {
  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-8 items-start justify-center">
        <div className="flex-1 bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
          {/* Login component removed */}
        </div>
        <div className="flex-1 bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
          {/* Register component removed */}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <>
      <Routes>
        {/* Admin routes - no navbar */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
        
        {/* Main app routes - with navbar */}
        <Route path="/" element={
          <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-100 via-white to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
            <Navbar />
            <main className="flex-1 flex flex-col items-center justify-center px-4 py-2 w-full">
              <Home />
            </main>
            <LiveChat />
          </div>
        } />
      
      <Route path="/login" element={
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-100 via-white to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
          <Navbar />
          <main className="flex-1 flex flex-col items-center justify-center px-4 py-2 w-full">
            <Login />
          </main>
          <LiveChat />
        </div>
      } />
      
      <Route path="/register" element={
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-100 via-white to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
          <Navbar />
          <main className="flex-1 flex flex-col items-center justify-center px-4 py-2 w-full">
            <Register />
          </main>
          <LiveChat />
        </div>
      } />
      
      <Route path="/transcription" element={
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-100 via-white to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
          <Navbar />
          <main className="flex-1 flex flex-col items-center justify-center px-4 py-2 w-full">
            <Transcription />
          </main>
          <LiveChat />
        </div>
      } />
      
      <Route path="/pricing" element={
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-100 via-white to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
          <Navbar />
          <main className="flex-1 flex flex-col items-center justify-center px-4 py-2 w-full">
            <Pricing />
          </main>
          <LiveChat />
        </div>
      } />
      
      <Route path="/upload-audio" element={
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-100 via-white to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
          <Navbar />
          <main className="flex-1 flex flex-col items-center justify-center px-4 py-2 w-full">
            <UploadAudio />
          </main>
          <LiveChat />
        </div>
      } />
      
      <Route path="/profile" element={
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-100 via-white to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
          <Navbar />
          <main className="flex-1 flex flex-col items-center justify-center px-4 py-2 w-full">
            <Profile />
          </main>
          <LiveChat />
        </div>
      } />
      
      <Route path="/history" element={
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-100 via-white to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
          <Navbar />
          <main className="flex-1 flex flex-col items-center justify-center px-4 py-2 w-full">
            <UserHistory />
          </main>
          <LiveChat />
        </div>
      } />
      
      {/* 404 route */}
      <Route path="*" element={
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-100 via-white to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
          <Navbar />
          <main className="flex-1 flex flex-col items-center justify-center px-4 py-2 w-full">
            <div className="p-8 text-center text-2xl">404 Not Found</div>
          </main>
          <LiveChat />
        </div>
      } />
    </Routes>
    </>
  );
}
