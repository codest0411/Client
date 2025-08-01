import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import AutoSetup from './AutoSetup';

export default function AdminSettings({ onSettingsChange }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [showAutoSetup, setShowAutoSetup] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    site_name: 'Transcripto',
    site_description: 'AI-powered transcription platform',
    contact_email: 'transcripto45@gmail.com',
    max_file_size: '60',
    allowed_formats: 'mp3,wav,m4a,ogg',
    maintenance_mode: false,
    default_language: 'en',
    auto_delete_days: '30',
    max_transcriptions_per_user: '100',
    enable_live_chat: true,
    enable_notifications: true,
    theme_color: '#3B82F6',
    logo_url: 'https://ui-avatars.com/api/?name=Transcripto&background=3B82F6&color=ffffff&size=128',
    footer_text: '© 2024 Transcripto. All rights reserved.',
    privacy_policy_url: '/privacy',
    terms_of_service_url: '/terms',
    support_email: 'support@transcripto.com',
    max_concurrent_transcriptions: '5',
    enable_analytics: true,
    backup_frequency: 'daily'
  });

  // Additional data state
  const [notifications, setNotifications] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [pricingPlans, setPricingPlans] = useState([]);

  const tabs = [
    { id: 'general', name: 'General Settings', icon: '⚙️' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'faqs', name: 'FAQs', icon: '❓' },
    { id: 'pricing', name: 'Pricing Plans', icon: '💰' },
    { id: 'auto-setup', name: 'Auto Setup', icon: '🚀' }
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch admin settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('admin_settings')
        .select('*');

      if (settingsError) throw settingsError;

      // Convert settings array to object
      const settingsObj = {};
      settingsData?.forEach(setting => {
        let value = setting.setting_value;
        if (setting.setting_type === 'boolean') {
          value = value === 'true';
        } else if (setting.setting_type === 'number') {
          value = parseInt(value) || 0;
        }
        settingsObj[setting.setting_key] = value;
      });

      setSettings(prev => ({ ...prev, ...settingsObj }));

      // Fetch notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('system_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (notificationsError) throw notificationsError;
      setNotifications(notificationsData || []);

      // Fetch FAQs
      const { data: faqsData, error: faqsError } = await supabase
        .from('faqs')
        .select('*')
        .order('order_index', { ascending: true });

      if (faqsError) throw faqsError;
      setFaqs(faqsData || []);

      // Fetch pricing plans
      const { data: plansData, error: plansError } = await supabase
        .from('pricing_plans')
        .select('*')
        .order('price', { ascending: true });

      if (plansError) throw plansError;
      setPricingPlans(plansData || []);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess('');

      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        setting_key: key,
        setting_value: String(value),
        setting_type: typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string'
      }));

      const { error } = await supabase
        .from('admin_settings')
        .upsert(settingsArray, { onConflict: 'setting_key' });

      if (error) throw error;

      setSuccess('Settings saved successfully!');
      if (onSettingsChange) {
        onSettingsChange(settings);
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addNotification = async (notification) => {
    try {
      const { data, error } = await supabase
        .from('system_notifications')
        .insert(notification)
        .select();

      if (error) throw error;

      setNotifications(prev => [data[0], ...prev]);
      setSuccess('Notification added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const updateNotification = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('system_notifications')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, ...updates } : n)
      );
      setSuccess('Notification updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const { error } = await supabase
        .from('system_notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== id));
      setSuccess('Notification deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const addFaq = async (faq) => {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .insert(faq)
        .select();

      if (error) throw error;

      setFaqs(prev => [...prev, data[0]]);
      setSuccess('FAQ added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const updateFaq = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('faqs')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setFaqs(prev => 
        prev.map(f => f.id === id ? { ...f, ...updates } : f)
      );
      setSuccess('FAQ updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteFaq = async (id) => {
    try {
      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFaqs(prev => prev.filter(f => f.id !== id));
      setSuccess('FAQ deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const addPricingPlan = async (plan) => {
    try {
      const { data, error } = await supabase
        .from('pricing_plans')
        .insert(plan)
        .select();

      if (error) throw error;

      setPricingPlans(prev => [...prev, data[0]]);
      setSuccess('Pricing plan added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const updatePricingPlan = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('pricing_plans')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setPricingPlans(prev => 
        prev.map(p => p.id === id ? { ...p, ...updates } : p)
      );
      setSuccess('Pricing plan updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const deletePricingPlan = async (id) => {
    try {
      const { error } = await supabase
        .from('pricing_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPricingPlans(prev => prev.filter(p => p.id !== id));
      setSuccess('Pricing plan deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900">Admin Settings</h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage your application settings and configuration
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {error && <ErrorMessage message={error} />}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* General Settings Tab */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site Name
                </label>
                <input
                  type="text"
                  value={settings.site_name}
                  onChange={(e) => handleSettingChange('site_name', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) => handleSettingChange('contact_email', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max File Size (MB)
                </label>
                <input
                  type="number"
                  value={settings.max_file_size}
                  onChange={(e) => handleSettingChange('max_file_size', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allowed Formats
                </label>
                <input
                  type="text"
                  value={settings.allowed_formats}
                  onChange={(e) => handleSettingChange('allowed_formats', e.target.value)}
                  placeholder="mp3,wav,m4a,ogg"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Theme Color
                </label>
                <input
                  type="color"
                  value={settings.theme_color}
                  onChange={(e) => handleSettingChange('theme_color', e.target.value)}
                  className="w-full h-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Support Email
                </label>
                <input
                  type="email"
                  value={settings.support_email}
                  onChange={(e) => handleSettingChange('support_email', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="maintenance_mode"
                  checked={settings.maintenance_mode}
                  onChange={(e) => handleSettingChange('maintenance_mode', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="maintenance_mode" className="ml-2 block text-sm text-gray-900">
                  Maintenance Mode
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enable_live_chat"
                  checked={settings.enable_live_chat}
                  onChange={(e) => handleSettingChange('enable_live_chat', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="enable_live_chat" className="ml-2 block text-sm text-gray-900">
                  Enable Live Chat
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enable_notifications"
                  checked={settings.enable_notifications}
                  onChange={(e) => handleSettingChange('enable_notifications', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="enable_notifications" className="ml-2 block text-sm text-gray-900">
                  Enable System Notifications
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enable_analytics"
                  checked={settings.enable_analytics}
                  onChange={(e) => handleSettingChange('enable_analytics', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="enable_analytics" className="ml-2 block text-sm text-gray-900">
                  Enable Analytics
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Description
              </label>
              <textarea
                value={settings.site_description}
                onChange={(e) => handleSettingChange('site_description', e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Footer Text
              </label>
              <input
                type="text"
                value={settings.footer_text}
                onChange={(e) => handleSettingChange('footer_text', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={saveSettings}
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">System Notifications</h3>
              <button
                onClick={() => {
                  const newNotification = {
                    title: 'New Notification',
                    message: 'Notification message',
                    type: 'info',
                    is_active: true
                  };
                  addNotification(newNotification);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
              >
                Add Notification
              </button>
            </div>

            <div className="space-y-4">
              {notifications.map(notification => (
                <div key={notification.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{notification.title}</h4>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        notification.type === 'success' ? 'bg-green-100 text-green-800' :
                        notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        notification.type === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {notification.type}
                      </span>
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">{notification.message}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    Created: {new Date(notification.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQs Tab */}
        {activeTab === 'faqs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Frequently Asked Questions</h3>
              <button
                onClick={() => {
                  const newFaq = {
                    question: 'New Question',
                    answer: 'New Answer',
                    category: 'general',
                    order_index: faqs.length + 1,
                    is_active: true
                  };
                  addFaq(newFaq);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
              >
                Add FAQ
              </button>
            </div>

            <div className="space-y-4">
              {faqs.map(faq => (
                <div key={faq.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{faq.question}</h4>
                    <div className="flex space-x-2">
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                        {faq.category}
                      </span>
                      <button
                        onClick={() => deleteFaq(faq.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">{faq.answer}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    Order: {faq.order_index} | Active: {faq.is_active ? 'Yes' : 'No'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pricing Plans Tab */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Pricing Plans</h3>
              <button
                onClick={() => {
                  const newPlan = {
                    name: 'New Plan',
                    price: 0.00,
                    duration_months: 1,
                    features: ['Feature 1', 'Feature 2'],
                    is_active: true
                  };
                  addPricingPlan(newPlan);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
              >
                Add Plan
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {pricingPlans.map(plan => (
                <div key={plan.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{plan.name}</h4>
                    <button
                      onClick={() => deletePricingPlan(plan.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    ${plan.price}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {plan.duration_months} month{plan.duration_months > 1 ? 's' : ''}
                  </div>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {plan.features?.map((feature, index) => (
                      <li key={index}>• {feature}</li>
                    ))}
                  </ul>
                  <div className="mt-2 text-xs text-gray-500">
                    Active: {plan.is_active ? 'Yes' : 'No'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Auto Setup Tab */}
        {activeTab === 'auto-setup' && (
          <div>
            <AutoSetup onComplete={() => {
              fetchSettings();
              setSuccess('Auto setup completed successfully!');
              setTimeout(() => setSuccess(''), 3000);
            }} />
          </div>
        )}
      </div>
    </div>
  );
} 