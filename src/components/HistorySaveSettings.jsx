import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export default function HistorySaveSettings() {
  const [settings, setSettings] = useState({
    autoSave: true,
    autoSaveDelay: 5,
    manualSaveEnabled: true,
    saveAudioFiles: true,
    saveMetadata: true,
    maxHistoryItems: 1000,
    retentionDays: 365
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('key', 'history_save_settings')
        .single();

      if (data && data.value) {
        setSettings({ ...settings, ...data.value });
      }
    } catch (err) {
      console.error('Error loading history save settings:', err);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          key: 'history_save_settings',
          value: settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving history settings:', err);
      alert('Error saving settings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
        History Save Settings
      </h2>

      <div className="space-y-6">
        {/* Automatic Save Settings */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Automatic Save Settings
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Automatic Saving
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Automatically save transcriptions when users record or upload
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Save Audio Files
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Store audio files in Supabase Storage
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.saveAudioFiles}
                  onChange={(e) => handleSettingChange('saveAudioFiles', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Save Metadata
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Store file size, duration, and other metadata
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.saveMetadata}
                  onChange={(e) => handleSettingChange('saveMetadata', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Manual Save Settings */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Manual Save Settings
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Manual Saving
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Allow users to manually save transcriptions
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.manualSaveEnabled}
                  onChange={(e) => handleSettingChange('manualSaveEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Storage Settings */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Storage Settings
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maximum History Items per User
              </label>
              <input
                type="number"
                value={settings.maxHistoryItems}
                onChange={(e) => handleSettingChange('maxHistoryItems', parseInt(e.target.value))}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                min="100"
                max="10000"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Oldest items will be automatically deleted when limit is reached
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data Retention (Days)
              </label>
              <input
                type="number"
                value={settings.retentionDays}
                onChange={(e) => handleSettingChange('retentionDays', parseInt(e.target.value))}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                min="30"
                max="3650"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Items older than this will be automatically deleted
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              loading 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : saved
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
} 