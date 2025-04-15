import {
  GoogleOAuthProvider,
  GoogleLogin,
  CredentialResponse,
} from '@react-oauth/google';
import React, { useEffect, useState } from 'react';
import { icons } from '../assets/assets';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  name: string;
  image: string;
  createData: string;
}

const Navigation: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = sessionStorage.getItem('user');
    if (user) {
      setUser(JSON.parse(user));
    }
  }, []);

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    const { credential } = credentialResponse;
    if (!credential) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: credential }),
      });

      const data = await response.json();
      sessionStorage.setItem('user', JSON.stringify(data.user));
      sessionStorage.setItem('token', JSON.stringify(data.token));
      setUser(data.user);

      if (!response.ok) {
        throw new Error(
          `Failed to log in: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleError = () => {
    console.error('Failed Google login');
  };

  return (
    <div className='w-full flex justify-between items-center font-semibold'>
      <div className='flex items-center gap-1'>
        <img
          onClick={() => navigate(-1)}
          className='w-8 p-2 cursor-pointer'
          src={icons.arrow_left}
          alt='왼쪽 이동'
        />
        <img
          onClick={() => navigate(1)}
          className='w-8 p-2 cursor-pointer'
          src={icons.arrow_right}
          alt='오른쪽 이동'
        />
      </div>
      <div className='flex items-center gap-3'>
        {user ? (
          <img
            className='w-10 h-10 rounded-full cursor-pointer'
            src={user.image}
            alt={`${user.name} 프로필`}
            onClick={() => navigate('/profile')}
          />
        ) : (
          <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <div>
              <GoogleLogin onSuccess={handleSuccess} onError={handleError} />
            </div>
          </GoogleOAuthProvider>
        )}
      </div>
    </div>
  );
};

export default Navigation;
