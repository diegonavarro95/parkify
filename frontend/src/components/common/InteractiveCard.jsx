import React from 'react';

const InteractiveCard = ({ children, className, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        bg-white dark:bg-dark-card 
        rounded-xl border border-slate-200 dark:border-slate-700 
        shadow-sm hover:shadow-lg hover:border-brand-200 dark:hover:border-brand-800
        transition-all duration-300 
        overflow-hidden 
        p-5 cursor-pointer 
        ${className || ''}
      `}
    >
      {children}
    </div>
  );
};

export default InteractiveCard;