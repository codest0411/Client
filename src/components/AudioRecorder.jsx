import React, { useState, useRef } from 'react';

export default function AudioRecorder({ onRecord, onStop }) {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
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
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], `recording_${Date.now()}.webm`, { type: 'audio/webm' });
        onRecord(file);
        onStop && onStop(blob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Clear timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setRecordingTime(0);
      };
      
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      recorder.start();
      setIsRecording(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Error accessing microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg text-lg font-semibold shadow-lg transition-all duration-200 ${
          isRecording 
            ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse' 
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        <span role="img" aria-label="record" className="text-2xl">
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
      
      {!isRecording && recordingTime > 0 && (
        <div className="text-sm text-gray-600">
          Last recording: {formatTime(recordingTime)}
        </div>
      )}
    </div>
  );
} 