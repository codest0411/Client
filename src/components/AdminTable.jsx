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

export default function AdminTable({ transcriptions, onDelete, onEdit }) {
  return (
    <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg shadow-lg border border-gray-200">
        <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">File Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Transcription</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Audio</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
            <tbody className="divide-y divide-gray-200">
          {transcriptions.map(t => (
                <tr key={t.id} className="hover:bg-blue-50 transition-colors duration-150">
                <td className="px-6 py-4 text-xs text-gray-900 font-mono">{t.userid || t.userId || 'N/A'}</td>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{t.fileName || t.title || 'Untitled'}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="max-h-32 overflow-y-auto pr-2 leading-relaxed">
                    {t.transcriptionText || t.content || <span className="italic text-gray-400">No transcription yet.</span>}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{t.createdAt ? new Date(t.createdAt).toLocaleString() : 'N/A'}</td>
                <td className="px-6 py-4">
                  {t.audioUrl || t.audio_url ? (
                    <audio controls src={t.audioUrl || t.audio_url} className="w-32 h-8" />
                  ) : (
                    <span className="text-gray-400 text-sm">No audio</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        const fullText = t.transcriptionText || t.content || '';
                        if (fullText) {
                          const newWindow = window.open('', '_blank');
                          newWindow.document.write(`
                            <html>
                              <head>
                                <title>${t.fileName || t.title || 'Transcription'}</title>
                                <style>
                                  body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
                                  .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                                  .content { white-space: pre-wrap; }
                                </style>
                              </head>
                              <body>
                                <div class="header">
                                  <h1>${t.fileName || t.title || 'Transcription'}</h1>
                                  <p><strong>Date:</strong> ${t.createdAt ? new Date(t.createdAt).toLocaleString() : 'N/A'}</p>
                                  <p><strong>User:</strong> ${t.userid || t.userId || 'N/A'}</p>
                                </div>
                                <div class="content">${fullText}</div>
                              </body>
                            </html>
                          `);
                          newWindow.document.close();
                        }
                      }}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!(t.transcriptionText || t.content)}
                    >
                      View Full
                    </button>
                    <button
                      onClick={() => downloadText(
                        (t.fileName || t.title || 'transcription') + '.txt',
                        t.transcriptionText || t.content || ''
                      )}
                      className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!(t.transcriptionText || t.content)}
                >
                  Download
                </button>
                {onDelete && (
                      <button 
                        onClick={() => onDelete(t.id)} 
                        className="px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                )}
                {onEdit && (
                      <button 
                        onClick={() => onEdit(t)} 
                        className="px-3 py-1 bg-gray-600 text-white text-xs rounded-md hover:bg-gray-700 transition-colors"
                      >
                        Edit
                      </button>
                    )}
                  </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 