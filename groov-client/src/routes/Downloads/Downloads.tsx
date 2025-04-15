import { useEffect, useState } from 'react';
import Navigation from '../../components/Navigation';
import useAuth from '../../hooks/useAuth';

interface Song {
  id: string;
  title: string;
  description: string;
  image: string;
  upload_date: string;
}

const Downloads = () => {
  const [downloads, setDownloads] = useState<Song[]>([]);
  const { getToken } = useAuth();
  const token = getToken();
  const userId = JSON.parse(sessionStorage.getItem('user') || '').id;

  const fetchDownloads = async (authToken: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/downloads/${userId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch download data');
      }
      const data = await response.json();
      setDownloads(data);
    } catch (error) {
      console.error('Error fetching downloads:', error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDownloads(token);
    }
  }, [token]);

  return (
    <div>
      <Navigation />
      <h1 className='mt-7 mb-2 ml-3 font-bold lg:text-4xl text-3xl'>
        다운로드 리스트 🎵
      </h1>
      <div className='space-y-6  px-3 py-7'>
        {downloads.length > 0 ? (
          downloads.map((song) => (
            <div key={song.id} className='flex items-center space-x-4'>
              <img
                className='rounded h-20 mr-3 border-1'
                src={`${import.meta.env.VITE_BASE_URL}${song.image}`}
              />
              <div>
                <p className='font-bold text-lg'>{song.title}</p>
                <p className=''>{song.description}</p>
                <p className='text-sm'>
                  {new Date(song.upload_date).toISOString().split('T')[0]}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className='text-gray-500'>다운로드한 곡이 없습니다.</p>
        )}
      </div>
    </div>
  );
};

export default Downloads;
