import React from 'react';
import { useNavigate } from 'react-router-dom';

interface SongListProps {
  id: string;
  title: string;
  image: string;
  description: string;
}

const SongList: React.FC<SongListProps> = ({
  id,
  title,
  image,
  description,
}) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/song/${id}`)}
      className='min-w-[180px] p-2 px-3 rounded cursor-pointer hover:bg-[#ffffff26]'
    >
      <img
        className='rounded'
        src={`${import.meta.env.VITE_BASE_URL}${image}`}
        alt={title + 'album'}
      />
      <p className='font-bold mt-2 mb-1'>{title}</p>
      <p className='text-slate-200 text-sm'>{description}</p>
    </div>
  );
};

export default SongList;
