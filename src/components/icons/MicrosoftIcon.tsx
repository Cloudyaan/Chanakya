
import React from 'react';

export const MicrosoftIcon = ({ className = "" }: { className?: string }) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 23 23" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path fill="#f1511b" d="M11.5 0h-11v11h11z" />
      <path fill="#80cc28" d="M23 0h-11v11h11z" />
      <path fill="#00adef" d="M11.5 11.5h-11v11h11z" />
      <path fill="#fbbc09" d="M23 11.5h-11v11h11z" />
    </svg>
  );
};
