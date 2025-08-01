import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { supabase } from '../utils/supabaseClient';
import { historyService } from '../utils/historyService';

// Mapping of spoken phrases to symbols
const DICTATION_COMMANDS = [
  { phrases: ["period"], insert: "." },
  { phrases: ["comma"], insert: "," },
  { phrases: ["question mark"], insert: "?" },
  { phrases: ["colon"], insert: ":" },
  { phrases: ["semi colon", "semicolon"], insert: ";" },
  { phrases: ["exclamation mark", "exclamation point"], insert: "!" },
  { phrases: ["dash", "hyphen", "minus sign", "minus"], insert: "-" },
  { phrases: ["plus sign", "plus"], insert: "+" },
  { phrases: ["equals sign", "equals"], insert: "=" },
  { phrases: ["apostrophe"], insert: "'" },
  { phrases: ["quotation mark", "quote"], insert: '"' },
  { phrases: ["left bracket", "open bracket"], insert: "[" },
  { phrases: ["right bracket", "close bracket"], insert: "]" },
  { phrases: ["left brace", "open brace"], insert: "{" },
  { phrases: ["right brace", "close brace"], insert: "}" },
  { phrases: ["slash", "forward slash"], insert: "/" },
  { phrases: ["backslash"], insert: "\\" },
  { phrases: ["asterisk", "star"], insert: "*" },
  { phrases: ["ampersand"], insert: "&" },
  { phrases: ["percent sign", "percent"], insert: "%" },
  { phrases: ["dollar sign", "dollar"], insert: "$" },
  { phrases: ["at sign", "at"], insert: "@" },
  { phrases: ["hash", "pound", "number sign"], insert: "#" },
  { phrases: ["underscore"], insert: "_" },
  { phrases: ["less than"], insert: "<" },
  { phrases: ["greater than"], insert: ">" },
  { phrases: ["pipe", "vertical bar"], insert: "|" },
  { phrases: ["tilde"], insert: "~" },
  { phrases: ["caret"], insert: "^" },
  { phrases: ["tab"], insert: "\t" },
  { phrases: ["space"], insert: " " },
  { phrases: ["new line"], insert: "\n" },
  { phrases: ["new paragraph"], insert: "\n\n" },
  { phrases: ["open parentheses", "open parenthesis"], insert: "(" },
  { phrases: ["close parentheses", "close parenthesis"], insert: ")" },
  { phrases: ["smiley", "smiley face"], insert: ":-)" },
];

function processDictationText(text) {
  let processed = text;
  DICTATION_COMMANDS.forEach(cmd => {
    cmd.phrases.forEach(phrase => {
      // Replace phrase with insert, case-insensitive, word boundary
      const regex = new RegExp(`\\b${phrase.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi');
      processed = processed.replace(regex, cmd.insert);
    });
  });
  return processed;
}

export default function Transcription() {
  const [transcription, setTranscription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [dictationSupported, setDictationSupported] = useState(false);
  const [copied, setCopied] = useState(false);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef(null);
  const [savingHistory, setSavingHistory] = useState(false);

  // Check for speech recognition support on component mount
  useEffect(() => {
    const checkSpeechRecognition = () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const isSupported = !!SpeechRecognition;
      console.log('Speech recognition supported:', isSupported);
      setDictationSupported(isSupported);
      
      if (!isSupported) {
        console.log('Speech recognition not available in this browser');
      }
    };
    
    checkSpeechRecognition();
  }, []);

  // Combined recording and dictation function
  const startRecording = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    setError('');
    setIsRecording(true);
    setRecordingTime(0);
    setTranscription(''); // Clear previous transcription

    try {
      // Start audio recording
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      const chunks = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedAudio(blob);
        setAudioURL(url);
        setAudioChunks(chunks);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Clear timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        // Save to history after a short delay to ensure transcription is processed
        setTimeout(async () => {
          if (transcription.trim()) {
            console.log('Auto-saving to history after recording...');
            await saveToHistory(blob);
          } else {
            console.log('No transcription text available for auto-save');
          }
        }, 1000);
      };
      
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      recorder.start();
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Start speech recognition for real-time transcription
      console.log('Starting speech recognition...');
      console.log('Dictation supported:', dictationSupported);
      
      if (dictationSupported) {
        try {
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          if (!SpeechRecognition) {
            console.error('Speech recognition not supported');
            setError('Speech recognition not supported in this browser');
            return;
          }
          
          const recognition = new SpeechRecognition();
          recognition.lang = 'en-US';
          recognition.interimResults = true;
          recognition.continuous = true;
          
          recognition.onstart = () => {
            console.log('Speech recognition started');
          };
          
          recognition.onresult = (event) => {
            console.log('Speech recognition result:', event);
            let finalTranscript = '';
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalTranscript += transcript;
              } else {
                interimTranscript += transcript;
              }
            }
            
            console.log('Final transcript:', finalTranscript);
            console.log('Interim transcript:', interimTranscript);
            
            if (finalTranscript) {
              const processed = processDictationText(finalTranscript);
              setTranscription(prev => prev ? prev + ' ' + processed : processed);
            }
            
            // Also show interim results
            if (interimTranscript && !finalTranscript) {
              setTranscription(prev => {
                const baseText = prev.split(' ').slice(0, -1).join(' '); // Remove last interim word
                return baseText ? baseText + ' ' + interimTranscript : interimTranscript;
              });
            }
          };
          
          recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setError(`Speech recognition error: ${event.error}`);
          };
          
          recognition.onend = () => {
            console.log('Speech recognition ended');
            if (isRecording) {
              console.log('Restarting speech recognition...');
              recognition.start(); // Restart if still recording
            }
          };
          
          recognitionRef.current = recognition;
          recognition.start();
        } catch (recognitionError) {
          console.error('Error setting up speech recognition:', recognitionError);
          setError('Failed to start speech recognition');
        }
      } else {
        console.log('Speech recognition not supported, recording audio only');
        setError('Speech recognition not supported in this browser. Audio will be recorded but not transcribed in real-time.');
      }
      
    } catch (err) {
      console.error('Recording error:', err);
      setError('Error accessing microphone: ' + err.message);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Save transcription to history
  const saveToHistory = async (audioBlob = null) => {
    if (!transcription.trim()) {
      console.log('No transcription text to save');
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
      if (audioBlob) {
        console.log('Uploading audio to storage...');
        try {
          // Upload audio to Supabase Storage with simple naming
          const fileName = `${user.id}_transcription_${Date.now()}.webm`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('transcriptions')
            .upload(fileName, audioBlob);

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
      }

      console.log('Saving to history service...');
      // Save to history (with or without audio URL)
      const result = await historyService.saveTranscription({
        text: transcription,
        audioUrl: audioUrl,
        fileName: audioBlob ? `transcription_${Date.now()}.webm` : null,
        fileSize: audioBlob ? audioBlob.size : null,
        duration: recordingTime,
        sourceType: 'recording'
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

  // Text-to-Speech
  const speakText = () => {
    if (!transcription) return;
    const synth = window.speechSynthesis;
    const utter = new window.SpeechSynthesisUtterance(transcription);
    synth.speak(utter);
  };

  // Copy to clipboard
  const handleCopy = () => {
    if (!transcription) return;
    navigator.clipboard.writeText(transcription);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Clear transcription and error
  const handleClear = () => {
    setTranscription('');
    setError('');
    setRecordedAudio(null);
    setAudioURL(null);
    setAudioChunks([]);
  };

  // Download functions
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

  const downloadAsMp4 = () => {
    if (!recordedAudio) {
      setError('No recorded audio available to download');
      return;
    }
    
    const blob = new Blob([recordedAudio], { type: 'audio/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recording_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle Enter to finalize (simulate submit)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full flex flex-col md:flex-row gap-8 justify-center items-start min-h-[70vh]">
      {/* Sidebar with tips/help */}
      <aside className="w-full md:w-1/3 bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700 mb-6 md:mb-0">
        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Quick Tips</h3>
        <ul className="list-disc list-inside text-gray-700 dark:text-gray-200 text-base space-y-2">
          <li>Click <b>Start Recording</b> to begin recording your voice.</li>
          <li>Your speech will be automatically converted to text in real-time.</li>
          <li>Click <b>Stop Recording</b> when you're finished.</li>
          <li>Your transcriptions are automatically saved to your history.</li>
          <li>Use the <b>speaker</b> icon to listen to your transcription.</li>
          <li>Use the <b>copy</b> icon to copy your transcription.</li>
          <li>Use the <b>download</b> buttons to save files.</li>
          <li>Use the <b>broom</b> icon to clear everything.</li>
          <li>Punctuate by saying <b>period</b>, <b>comma</b>, <b>question mark</b>, etc.</li>
        </ul>
        <div className="mt-6 text-gray-500 text-sm">
          <b>Punctuation & Formatting Commands:</b>
          <table className="mt-2 w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="text-left pr-2 pb-1">Say</th>
                <th className="text-left pb-1">Insert</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>period</td><td>.</td></tr>
              <tr><td>comma</td><td>,</td></tr>
              <tr><td>question mark</td><td>?</td></tr>
              <tr><td>colon</td><td>:</td></tr>
              <tr><td>semi colon / semicolon</td><td>;</td></tr>
              <tr><td>exclamation mark / exclamation point</td><td>!</td></tr>
              <tr><td>dash / hyphen / minus</td><td>-</td></tr>
              <tr><td>plus sign / plus</td><td>+</td></tr>
              <tr><td>equals sign / equals</td><td>=</td></tr>
              <tr><td>apostrophe</td><td>'</td></tr>
              <tr><td>quotation mark / quote</td><td>"</td></tr>
              <tr><td>left bracket / open bracket</td><td>[</td></tr>
              <tr><td>right bracket / close bracket</td><td>]</td></tr>
              <tr><td>left brace / open brace</td><td>{'{'}</td></tr>
              <tr><td>right brace / close brace</td><td>{'}'}</td></tr>
              <tr><td>slash / forward slash</td><td>/</td></tr>
              <tr><td>backslash</td><td>{'\\'}</td></tr>
              <tr><td>asterisk / star</td><td>*</td></tr>
              <tr><td>ampersand</td><td>&</td></tr>
              <tr><td>percent sign / percent</td><td>%</td></tr>
              <tr><td>dollar sign / dollar</td><td>$</td></tr>
              <tr><td>at sign / at</td><td>@</td></tr>
              <tr><td>hash / pound / number sign</td><td>#</td></tr>
              <tr><td>underscore</td><td>_</td></tr>
              <tr><td>less than</td><td>&lt;</td></tr>
              <tr><td>greater than</td><td>&gt;</td></tr>
              <tr><td>pipe / vertical bar</td><td>|</td></tr>
              <tr><td>tilde</td><td>~</td></tr>
              <tr><td>caret</td><td>^</td></tr>
              <tr><td>tab</td><td>(tab)</td></tr>
              <tr><td>space</td><td>(space)</td></tr>
              <tr><td>new line</td><td>(line break)</td></tr>
              <tr><td>new paragraph</td><td>(2 line breaks)</td></tr>
              <tr><td>open parentheses / parenthesis</td><td>(</td></tr>
              <tr><td>close parentheses / parenthesis</td><td>)</td></tr>
              <tr><td>smiley / smiley face</td><td>:-)</td></tr>
            </tbody>
          </table>
        </div>
      </aside>
      
      {/* Main transcription area */}
      <div className="flex-1 w-full max-w-2xl bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700 mb-8">
        <h2 className="text-3xl font-extrabold mb-6 text-center text-gray-900 dark:text-gray-100">Audio Transcription</h2>
        
        {/* Single recording button */}
        <div className="flex flex-col items-center gap-4 mb-6">
          <button
            onClick={startRecording}
            className={`flex items-center gap-3 px-8 py-4 rounded-xl text-xl font-bold shadow-lg transition-all duration-200 ${
              isRecording 
                ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <span role="img" aria-label="record" className="text-3xl">
              {isRecording ? '⏹️' : '🎙️'}
            </span>
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
          
          {isRecording && (
            <div className="flex items-center gap-2 text-red-600 font-semibold">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
              Recording: {formatTime(recordingTime)}
            </div>
          )}
          
          {isRecording && dictationSupported && (
            <div className="flex items-center gap-2 text-green-600 font-semibold">
              <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse"></div>
              Speech recognition active
            </div>
          )}
          
          {isRecording && !dictationSupported && (
            <div className="flex items-center gap-2 text-yellow-600 font-semibold">
              <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
              Audio recording only (no real-time transcription)
            </div>
          )}
          
          {savingHistory && (
            <div className="flex items-center gap-2 text-blue-600 font-semibold">
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
              Saving to history...
            </div>
          )}
          
          {!dictationSupported && (
            <div className="text-yellow-500 text-sm">Real-time transcription may not work in this browser.</div>
          )}
        </div>

        {/* Audio Player */}
        {audioURL && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Recorded Audio</h3>
            <audio controls className="w-full" src={audioURL}>
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {/* Text Area */}
        <textarea
          ref={inputRef}
          className="w-full mb-4 p-3 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
          rows={6}
          placeholder="Your transcribed text will appear here as you speak..."
          value={transcription}
          onChange={e => setTranscription(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <button
            onClick={handleCopy}
            className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded shadow flex items-center gap-2 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            title="Copy to clipboard"
            disabled={!transcription}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {copied ? 'Copied!' : 'Copy'}
          </button>
          
          <button
            onClick={downloadAsTxt}
            className="bg-green-500 text-white px-4 py-2 rounded shadow flex items-center gap-2 hover:bg-green-600 transition-colors"
            title="Download as text file"
            disabled={!transcription}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download .txt
          </button>
          
          <button
            onClick={() => saveToHistory(recordedAudio)}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow flex items-center gap-2 hover:bg-blue-700 transition-colors"
            title="Save to history"
            disabled={!transcription.trim()}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Save to History
          </button>
          
          <button
            onClick={speakText}
            className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded shadow flex items-center gap-2 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            title="Listen to transcription"
            disabled={!transcription}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            Listen
          </button>
          
          <button
            onClick={downloadAsMp4}
            className="bg-purple-500 text-white px-4 py-2 rounded shadow flex items-center gap-2 hover:bg-purple-600 transition-colors"
            title="Download recorded audio as MP4"
            disabled={!recordedAudio}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            Download .mp4
          </button>
          
        <button
            onClick={handleClear}
            className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded shadow flex items-center gap-2 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            title="Clear everything"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear
        </button>
        </div>

        {loading && <div className="mt-4"><LoadingSpinner /></div>}
        <ErrorMessage message={error} />
        
        {transcription && (
          <div className="mt-8 bg-gray-50 dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="font-semibold mb-2 text-lg text-gray-900 dark:text-gray-100">Transcription Result</div>
            <div className="mb-2 text-gray-700 dark:text-gray-200 whitespace-pre-line">{transcription}</div>
          </div>
        )}
      </div>
    </div>
  );
} 