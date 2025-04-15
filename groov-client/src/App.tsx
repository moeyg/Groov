import React from 'react';
import Sidebar from './components/Sidebar';
import Player from './components/Player';
import Display from './components/Display';
import PlayerContextProvider from './context/PlayerContext';

const App: React.FC = () => {
  return (
    <PlayerContextProvider>
      <div className='h-screen bg-black'>
        <div className='h-[90%] flex'>
          <Sidebar />
          <Display />
        </div>
        <Player />
      </div>
    </PlayerContextProvider>
  );
};

export default App;
