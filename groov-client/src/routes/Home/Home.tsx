import React, { useContext } from 'react';
import Navigation from '../../components/Navigation';
import SongList from '../../components/SongList';
import { PlayerContext } from '../../context/PlayerContext';

const Home: React.FC = () => {
  const playerContext = useContext(PlayerContext);
  if (!playerContext) {
    return <div>Loading...</div>;
  }
  const { songsData } = playerContext;

  return (
    <>
      <Navigation />
      <div className='mb-4'>
        <h1 className='mt-7 mb-2 ml-3 font-bold lg:text-4xl text-3xl'>
          PICK's Tunes 🎧
        </h1>
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5  gap-5 '>
          {songsData.length > 0
            ? songsData.map((song) => (
                <SongList
                  key={song.id}
                  id={song.id}
                  title={song.title}
                  image={song.image}
                  description={song.description}
                />
              ))
            : ''}
        </div>
      </div>
    </>
  );
};

export default Home;
