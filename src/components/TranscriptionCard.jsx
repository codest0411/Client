import React from 'react';

function downloadText(filename, text) {
  const element = document.createElement('a');
  const file = new Blob([text], { type: 'text/plain' });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

export default function TranscriptionCard({ transcription, onDelete, onEdit, isAdmin }) {
  return (
    <div className="bg-white rounded shadow p-4 mb-4">
      <div className="flex justify-between items-center mb-2">
        <div className="text-gray-700 font-semibold">{transcription.fileName || transcription.title}</div>
        <div className="flex gap-2">
          <button
            onClick={() => downloadText(
              (transcription.fileName || transcription.title || 'transcription') + '.txt',
              transcription.transcriptionText || transcription.content || ''
            )}
            className="text-green-600 hover:underline text-sm mr-2"
            disabled={!(transcription.transcriptionText || transcription.content)}
          >
            Download
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(transcription.id)}
              className="text-red-600 hover:underline text-sm"
            >Delete</button>
          )}
          {isAdmin && onEdit && (
            <button
              onClick={() => onEdit(transcription)}
              className="text-blue-600 hover:underline text-sm"
            >Edit</button>
          )}
        </div>
      </div>
      <div className="text-xs text-gray-400 mb-1">{new Date(transcription.createdAt).toLocaleString()}</div>
      <div className="text-gray-900 mb-2 max-h-48 overflow-y-auto">
        {transcription.transcriptionText || transcription.content || <span className="italic text-gray-400">No transcription yet.</span>}
      </div>
      <audio controls src={transcription.audioUrl || transcription.audio_url} className="w-full" />
    </div>
  );
} 