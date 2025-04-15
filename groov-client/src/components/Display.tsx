import React, { useRef } from 'react';
import { Route, Routes } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Home from '../routes/Home/Home';
import Song from '../routes/Song/Song';
import Search from '../routes/Search/Search';
import Profile from '../routes/Profile/Profile';
import Downloads from '../routes/Downloads/Downloads';
import PaymentSuccess from '../routes/Payment/PaymentSuccess';
import Downloading from '../routes/Downloading/Downloading';

const Display: React.FC = () => {
  const displayRef = useRef<HTMLDivElement>(null);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <div
        ref={displayRef}
        className='w-[100%] m-2 px-6 pt-4 rounded text-white overflow-auto lg:w-[75%] lg-ml-0'
      >
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/song/:id' element={<Song />} />
          <Route path='/search/' element={<Search />} />
          <Route path='/profile' element={<Profile />} />
          <Route path='/downloads' element={<Downloads />} />
          <Route path='/payment/success' element={<PaymentSuccess />} />
          <Route path='/downloading' element={<Downloading />} />
        </Routes>
      </div>
    </GoogleOAuthProvider>
  );
};

export default Display;
