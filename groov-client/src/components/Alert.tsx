import React from 'react';

interface AlertProps {
  title: string;
  message: string;
  negativeText?: string;
  positiveText?: string;
  onPositiveAction?: () => void;
  onNegativeAction?: () => void;
}

const Alert: React.FC<AlertProps> = ({
  title,
  message,
  negativeText,
  positiveText,
  onPositiveAction,
  onNegativeAction,
}) => {
  return (
    <div className='bg-[#121212] text-white p-6 rounded-lg'>
      <h1 className='text-xl font-bold mb-4'>{title}</h1>
      <p className='mb-6'>{message}</p>
      <div className=''>
        {positiveText ? (
          <button
            onClick={onPositiveAction}
            className='bg-[#8033D3] text-white py-2 px-5 rounded-full hover:opacity-55 focus:outline-none text-sm'
          >
            {positiveText}
          </button>
        ) : (
          ''
        )}
        {negativeText ? (
          <button
            onClick={onNegativeAction}
            className='bg-[#242424] text-white py-2 px-5 rounded-full hover:opacity-55  focus:outline-none text-sm ml-4'
          >
            {negativeText}
          </button>
        ) : (
          ''
        )}
      </div>
    </div>
  );
};

export default Alert;
