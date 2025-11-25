import React from 'react';

export default function ErrorMessage({ message, className = '' }) {
  if (!message) return null;
  return (
    <div className={`text-red-500 mb-4 ${className}`.trim()} role="alert">
      {message}
    </div>
  );
}
