import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { historyService } from '../utils/historyService';

export default function UploadAudio() {
  const [file, setFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [savingHistory, setSavingHistory] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(false);
    setTranscription('');
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('audio', file);
      const res = await fetch('https://server-t-1.onrender.com/api/transcriptions/whisper', {
        method: 'POST',
        body: formData,
      });
      
      // Check if response is JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response. Please check server logs.');
      }
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Transcription failed');
      setTranscription(data.transcription);
      setSubmitted(true);

      // Save to history
      await saveToHistory(data.transcription);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      // Do NOT clear file or audioUrl here, so the audio player remains visible
    }
  };

  const saveToHistory = async (transcriptionText) => {
    if (!transcriptionText.trim() || !file) {
      console.log('No transcription text or file to save');
      return;
    }

    try {
      setSavingHistory(true);
      console.log('Starting to save to history...');
      
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('User not authenticated:', authError);
        throw new Error('User not authenticated');
      }
      console.log('User authenticated:', user.id);
      
      let audioUrl = null;
      try {
        // Upload audio file to Supabase Storage
        const fileName = `${user.id}_upload_${Date.now()}_${file.name}`;
        console.log('Uploading audio to storage:', fileName);
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('transcriptions')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Audio upload error:', uploadError);
          // Continue without audio URL if upload fails
          console.log('Continuing without audio upload...');
        } else {
          console.log('Audio uploaded successfully');

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('transcriptions')
            .getPublicUrl(fileName);
          
          audioUrl = urlData.publicUrl;
          console.log('Audio URL:', audioUrl);
        }
      } catch (storageError) {
        console.error('Storage error:', storageError);
        // Continue without audio URL if storage fails
        console.log('Continuing without audio upload due to storage error...');
      }

      console.log('Saving to history service...');
      // Save to history (with or without audio URL)
      const result = await historyService.saveTranscription({
        text: transcriptionText,
        audioUrl: audioUrl,
        fileName: file.name,
        fileSize: file.size,
        duration: null, // We don't have duration for uploaded files
        sourceType: 'upload'
      });
      
      console.log('Successfully saved to history:', result);

    } catch (err) {
      console.error('Error saving to history:', err);
      // Show error to user for debugging
      setError(`Failed to save to history: ${err.message}`);
    } finally {
      setSavingHistory(false);
    }
  };

  const handleCopy = () => {
    if (!transcription) return;
    navigator.clipboard.writeText(transcription);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const downloadAsTxt = () => {
    if (!transcription) return;
    
    const blob = new Blob([transcription], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setAudioUrl(selectedFile ? URL.createObjectURL(selectedFile) : '');
    setTranscription(''); // Clear previous transcription when new file is selected
    setSubmitted(false);
    setError('');
  };

  return (
    <div className="w-full flex flex-col items-center min-h-[60vh] p-8">
      <h2 className="text-3xl font-extrabold mb-6 text-center text-gray-900 dark:text-gray-100">Upload Audio</h2>
      <form onSubmit={handleSubmit} className="w-full max-w-xl flex flex-col gap-4 bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
        <input
          type="file"
          accept="audio/*"
          className="w-full p-3 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
          onChange={handleFileChange}
          required
        />
        {(audioUrl || transcription) && (
          <audio controls src={audioUrl} className="w-full mt-2" />
        )}
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold shadow transition-colors"
          disabled={loading}
        >
          {loading ? 'Transcribing...' : 'Upload & Transcribe'}
        </button>
        {error && <div className="text-red-600 font-semibold mt-2">{error}</div>}
        {submitted && transcription && (
          <div className="text-green-600 font-semibold mt-2">Transcription:</div>
        )}
        {savingHistory && (
          <div className="flex items-center gap-2 text-blue-600 font-semibold">
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
            Saving to history...
          </div>
        )}
        {transcription && (
          <>
            <div className="mt-4 bg-gray-50 dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 whitespace-pre-line">
              {transcription}
            </div>
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded shadow flex items-center justify-center gap-2 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={downloadAsTxt}
                className="flex-1 bg-green-500 text-white px-4 py-2 rounded shadow flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download .txt
              </button>
              <button
                type="button"
                onClick={() => saveToHistory(transcription)}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded shadow flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
                disabled={!transcription.trim()}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save to History
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
} 
