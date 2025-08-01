import React from 'react';
export default function ErrorMessage({ message }) {
  if (!message) return null;
  return <div className="text-red-500 text-center mt-2">{message}</div>;
} 