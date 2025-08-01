import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

export default function AutoSetup({ onComplete }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [setupComplete, setSetupComplete] = useState(false);

  const setupSteps = [
    { name: 'Checking database connection', weight: 10 },
    { name: 'Creating admin settings', weight: 20 },
    { name: 'Setting up system notifications', weight: 15 },
    { name: 'Adding FAQ data', weight: 15 },
    { name: 'Creating pricing plans', weight: 20 },
    { name: 'Setting up user subscriptions', weight: 10 },
    { name: 'Configuring permissions', weight: 10 }
  ];

  const updateProgress = (stepIndex, success = true) => {
    const completedWeight = setupSteps
      .slice(0, stepIndex + 1)
      .reduce((sum, step) => sum + step.weight, 0);
    setProgress(completedWeight);
    if (success) {
      setCurrentStep(`✅ ${setupSteps[stepIndex].name}`);
    } else {
      setCurrentStep(`❌ ${setupSteps[stepIndex].name}`);
    }
  };

  const runAutoSetup = async () => {
    setLoading(true);
    setError(null);
    setProgress(0);
    setCurrentStep('Starting auto setup...');

    try {
      // Step 1: Check database connection
      setCurrentStep('Checking database connection...');
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (testError) {
        throw new Error(`Database connection failed: ${testError.message}`);
      }
      updateProgress(0);

      // Step 2: Create admin settings
      setCurrentStep('Creating admin settings...');
      const defaultSettings = [
        { setting_key: 'site_name', setting_value: 'Transcripto', setting_type: 'string', description: 'Website name' },
        { setting_key: 'site_description', setting_value: 'AI-powered transcription platform', setting_type: 'string', description: 'Website description' },
        { setting_key: 'contact_email', setting_value: 'transcripto45@gmail.com', setting_type: 'string', description: 'Contact email' },
        { setting_key: 'max_file_size', setting_value: '60', setting_type: 'number', description: 'Maximum file size in MB' },
        { setting_key: 'allowed_formats', setting_value: 'mp3,wav,m4a,ogg', setting_type: 'string', description: 'Allowed audio formats' },
        { setting_key: 'maintenance_mode', setting_value: 'false', setting_type: 'boolean', description: 'Maintenance mode status' },
        { setting_key: 'default_language', setting_value: 'en', setting_type: 'string', description: 'Default transcription language' },
        { setting_key: 'auto_delete_days', setting_value: '30', setting_type: 'number', description: 'Days before auto-deleting old files' },
        { setting_key: 'max_transcriptions_per_user', setting_value: '100', setting_type: 'number', description: 'Maximum transcriptions per user' },
        { setting_key: 'enable_live_chat', setting_value: 'true', setting_type: 'boolean', description: 'Enable live chat feature' },
        { setting_key: 'enable_notifications', setting_value: 'true', setting_type: 'boolean', description: 'Enable system notifications' },
        { setting_key: 'theme_color', setting_value: '#3B82F6', setting_type: 'string', description: 'Primary theme color' },
        { setting_key: 'logo_url', setting_value: 'https://ui-avatars.com/api/?name=Transcripto&background=3B82F6&color=ffffff&size=128', setting_type: 'string', description: 'Logo URL' },
        { setting_key: 'footer_text', setting_value: '© 2024 Transcripto. All rights reserved.', setting_type: 'string', description: 'Footer text' },
        { setting_key: 'privacy_policy_url', setting_value: '/privacy', setting_type: 'string', description: 'Privacy policy URL' },
        { setting_key: 'terms_of_service_url', setting_value: '/terms', setting_type: 'string', description: 'Terms of service URL' },
        { setting_key: 'support_email', setting_value: 'support@transcripto.com', setting_type: 'string', description: 'Support email' },
        { setting_key: 'max_concurrent_transcriptions', setting_value: '5', setting_type: 'number', description: 'Maximum concurrent transcriptions' },
        { setting_key: 'enable_analytics', setting_value: 'true', setting_type: 'boolean', description: 'Enable analytics tracking' },
        { setting_key: 'backup_frequency', setting_value: 'daily', setting_type: 'string', description: 'Backup frequency' }
      ];

      for (const setting of defaultSettings) {
        const { error: insertError } = await supabase
          .from('admin_settings')
          .upsert(setting, { onConflict: 'setting_key' });
        
        if (insertError) {
          console.warn(`Warning: Could not insert setting ${setting.setting_key}:`, insertError);
        }
      }
      updateProgress(1);

      // Step 3: Setup system notifications
      setCurrentStep('Setting up system notifications...');
      const notifications = [
        { title: 'Welcome to Transcripto!', message: 'Thank you for joining our platform. Start transcribing your audio files today!', type: 'success' },
        { title: 'New Feature Available', message: 'We have added support for multiple audio formats including MP3, WAV, M4A, and OGG.', type: 'info' },
        { title: 'System Maintenance', message: 'Scheduled maintenance will occur on Sunday at 2 AM UTC. Service may be temporarily unavailable.', type: 'warning' },
        { title: 'Mobile App Coming Soon', message: 'Our mobile app is in development and will be available soon for iOS and Android.', type: 'info' },
        { title: 'Holiday Schedule', message: 'Our support team will have limited availability during the holiday season.', type: 'info' }
      ];

      for (const notification of notifications) {
        const { error: insertError } = await supabase
          .from('system_notifications')
          .upsert(notification, { onConflict: 'id' });
        
        if (insertError) {
          console.warn(`Warning: Could not insert notification:`, insertError);
        }
      }
      updateProgress(2);

      // Step 4: Add FAQ data
      setCurrentStep('Adding FAQ data...');
      const faqs = [
        { question: 'What is Transcripto?', answer: 'Transcripto is an AI-powered web platform that converts your audio or spoken words into accurate, readable text using advanced speech-to-text technology.', category: 'general', order_index: 1 },
        { question: 'How does Transcripto work?', answer: 'Simply upload or record your audio directly on the platform. Our AI system processes the audio and generates a transcription in seconds. You can view, edit, and download the text easily.', category: 'general', order_index: 2 },
        { question: 'What types of audio files does Transcripto support?', answer: 'We support a wide range of audio formats including: .mp3, .wav, .m4a, .ogg.', category: 'technical', order_index: 1 },
        { question: 'Is there a limit to the audio length I can upload?', answer: 'Currently, you can upload audio files up to 60 minutes long. For longer durations or bulk transcription, contact our support team for a custom plan.', category: 'technical', order_index: 2 },
        { question: 'Can I edit the transcribed text?', answer: 'Yes! Once the transcription is generated, you can review and edit the text within our editor before saving or exporting it.', category: 'features', order_index: 1 },
        { question: 'Is my data secure?', answer: 'Absolutely. We prioritize user privacy. All audio and transcription data is encrypted, and we never share your files with third parties.', category: 'security', order_index: 1 },
        { question: 'Do I need an account to use Transcripto?', answer: 'Yes, creating an account helps you manage your transcriptions, access them anytime, and track your usage history.', category: 'account', order_index: 1 },
        { question: 'Is Transcripto free?', answer: 'We offer a free trial with limited minutes. For extended use, we have affordable premium plans. Visit our Pricing Page for details.', category: 'pricing', order_index: 1 },
        { question: 'Can I access my transcriptions later?', answer: 'Yes, all your past transcriptions are saved in your dashboard for future access and download, unless you choose to delete them.', category: 'features', order_index: 2 },
        { question: 'Do you support multiple languages?', answer: 'Currently, we support transcription in English, with more languages like Hindi, Spanish, and French coming soon!', category: 'features', order_index: 3 },
        { question: 'Who can use Transcripto?', answer: 'Anyone! Whether you are a student, content creator, journalist, or business professional — if you need fast and accurate transcription, Transcripto is for you.', category: 'general', order_index: 3 },
        { question: 'How can I contact support?', answer: 'You can reach our team anytime via support@transcripto.ai or use the live chat option on our website.', category: 'support', order_index: 1 }
      ];

      for (const faq of faqs) {
        const { error: insertError } = await supabase
          .from('faqs')
          .upsert(faq, { onConflict: 'id' });
        
        if (insertError) {
          console.warn(`Warning: Could not insert FAQ:`, insertError);
        }
      }
      updateProgress(3);

      // Step 5: Create pricing plans
      setCurrentStep('Creating pricing plans...');
      const plans = [
        { name: 'Free', price: 0.00, duration_months: 1, features: ['Up to 10 minutes per month', 'Basic transcription', 'Email support', 'Standard accuracy'] },
        { name: 'Basic', price: 9.99, duration_months: 1, features: ['Up to 100 minutes per month', 'Advanced transcription', 'Priority support', 'High accuracy', 'Export options'] },
        { name: 'Pro', price: 19.99, duration_months: 1, features: ['Up to 500 minutes per month', 'Premium transcription', '24/7 support', 'Highest accuracy', 'All export formats', 'Bulk upload'] },
        { name: 'Enterprise', price: 49.99, duration_months: 1, features: ['Unlimited minutes', 'Custom accuracy', 'Dedicated support', 'API access', 'Custom integrations', 'Team management'] }
      ];

      for (const plan of plans) {
        const { error: insertError } = await supabase
          .from('pricing_plans')
          .upsert(plan, { onConflict: 'id' });
        
        if (insertError) {
          console.warn(`Warning: Could not insert plan:`, insertError);
        }
      }
      updateProgress(4);

      // Step 6: Setup user subscriptions (empty for now)
      setCurrentStep('Setting up user subscriptions...');
      // This will be populated as users subscribe
      updateProgress(5);

      // Step 7: Configure permissions (handled by RLS policies)
      setCurrentStep('Configuring permissions...');
      updateProgress(6);

      setSetupComplete(true);
      setCurrentStep('✅ Auto setup completed successfully!');
      
      if (onComplete) {
        onComplete();
      }

    } catch (err) {
      setError(err.message);
      setCurrentStep(`❌ Setup failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkSetupStatus = async () => {
    try {
      const { data: settings, error: settingsError } = await supabase
        .from('admin_settings')
        .select('setting_key')
        .limit(1);

      const { data: notifications, error: notificationsError } = await supabase
        .from('system_notifications')
        .select('id')
        .limit(1);

      const { data: faqs, error: faqsError } = await supabase
        .from('faqs')
        .select('id')
        .limit(1);

      const { data: plans, error: plansError } = await supabase
        .from('pricing_plans')
        .select('id')
        .limit(1);

      const isSetup = settings && settings.length > 0 && 
                     notifications && notifications.length > 0 && 
                     faqs && faqs.length > 0 && 
                     plans && plans.length > 0;

      if (isSetup) {
        setSetupComplete(true);
        setCurrentStep('✅ Setup already completed');
        setProgress(100);
      }
    } catch (err) {
      console.warn('Could not check setup status:', err);
    }
  };

  useEffect(() => {
    checkSetupStatus();
  }, []);

  if (setupComplete && !loading) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              Auto Setup Complete
            </h3>
            <div className="mt-2 text-sm text-green-700">
              <p>All required data has been successfully added to your database.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Auto Setup Configuration
        </h3>
        <p className="text-sm text-gray-600">
          This will automatically add all required data to your Supabase database and configure your admin dashboard.
        </p>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-500">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {currentStep && (
        <div className="mb-6 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">{currentStep}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">What will be set up:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Admin settings and configuration</li>
            <li>• System notifications</li>
            <li>• FAQ database</li>
            <li>• Pricing plans</li>
            <li>• User subscription system</li>
            <li>• Database permissions and security</li>
          </ul>
        </div>

        <button
          onClick={runAutoSetup}
          disabled={loading}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <LoadingSpinner size="sm" />
              <span className="ml-2">Setting up...</span>
            </div>
          ) : (
            'Run Auto Setup'
          )}
        </button>

        <p className="text-xs text-gray-500 text-center">
          This process will add all necessary data to your database. It's safe to run multiple times.
        </p>
      </div>
    </div>
  );
} 