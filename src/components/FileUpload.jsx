import React from 'react';
export default function FileUpload({ onUpload }) {
  return (
    <input type="file" accept="audio/*" onChange={e => onUpload(e.target.files[0])} className="block mx-auto" />
  );
} 