import React, { useEffect, useState } from 'react';
import Navigation from '../../components/Navigation';
import SongList from '../../components/SongList';
import Alert from '../../components/Alert';
import FileUploadForm from '../../components/FileUploadForm';
import { icons } from '../../assets/assets';
import { useNavigate } from 'react-router-dom';
import FileEditForm from '../../components/FileEditForm';
import useAuth from '../../hooks/useAuth';
useAuth;

interface User {
  id: string;
  name: string;
  image: string;
  createDate: string;
}

interface Song {
  id: string;
  title: string;
  image: string;
  description: string;
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [uploads, setUploads] = useState([]);
  const [visibleAlert, setVisibleAlert] = useState(false);
  const [visibleFileUploadForm, setVisibleFileUploadForm] = useState(false);
  const [visibleFileEditForm, setVisibleFileEditForm] = useState(false);
  const [selectedSong, setSelectedSong] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const token = getToken();

  useEffect(() => {
    fetchUserData();
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);

    if (tokenPayload.exp < now) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      alert('로그인이 만료되었습니다. 다시 로그인 해주세요.');
      navigate('/');
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        console.error('Failed to retrieve user data.');
        navigate('/');
      }
      const data = await response.json();
      setUser(data.user);
      setUploads(data.uploads);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCancelMembership = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        console.error('Membership cancel request failed.');
      }
      handleLogout();
    } catch (error) {
      console.error('Failed cancel membership:', error);
      alert('회원 탈퇴 중 문제가 발생했습니다.');
    }
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    navigate('/');
  };

  const handleEditClick = (id: string, title: string) => {
    setSelectedSong({ id, title });
    setVisibleFileEditForm(true);
  };

  const handleEditFormSubmit = () => {
    setVisibleFileUploadForm(false);
  };

  const handleUploadFormSubmit = () => {
    setVisibleFileUploadForm(false);
  };

  return (
    <>
      <Navigation />
      <div className='mt-7 mb-4 ml-3 flex flex-col gap-9'>
        <h1 className='font-bold lg:text-4xl text-3xl'>
          {user?.name}님 안녕하세요!
        </h1>
        <section id='userInfo' className='flex items-center gap-10'>
          <img
            className='w-[10rem] h-[10rem] rounded-full object-cover'
            src={user?.image}
            alt={`${user?.name} 프로필`}
          />
          <div className='flex flex-col gap-3'>
            <h2 className='text-3xl'>{user?.name}</h2>
            <div>
              <p>ID Number: {user?.id?.slice(0, 8)}</p>
              <p>Create: {user?.createDate}</p>
              <button
                onClick={() => handleLogout()}
                className='hover:opacity-55 px-5 py-1.5 bg-white text-sm text-black rounded-full mt-4'
              >
                로그아웃
              </button>
            </div>
          </div>
        </section>
        <section
          id='uploadFileList'
          className='flex flex-col gap-5 items-start'
        >
          <h2
            onClick={() => navigate('/downloads')}
            className='mt-2 text-2xl font-bold cursor-pointer'
          >
            다운로드 파일 리스트 →
          </h2>

          <h2 className='mt-2 text-2xl font-bold'>업로드 파일 리스트</h2>
          {uploads.length ? (
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'>
              {uploads.map((song: Song) => (
                <div key={song.id} className='relative shadow-md'>
                  <button
                    onClick={() => handleEditClick(song.id, song.title)}
                    className='absolute right-2 px-5 py-1 bg-white text-xs font-semibold text-black rounded-full shadow-xl transform transition-transform duration-200 hover:scale-110'
                  >
                    EDIT
                  </button>
                  <SongList
                    id={song.id}
                    title={song.title}
                    image={song.image}
                    description={song.description}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className='text-white'>
              지금 업로드하여 당신의 음악을 공유하세요!
            </p>
          )}
          {visibleFileEditForm && (
            <section className='relative w-[27rem] sm:w-[35rem] md:w-[45rem] bg-[#121212] rounded-lg px-7 py-7 flex flex-col gap-2'>
              <img
                src={icons.close}
                className='w-5 cursor-pointer self-end'
                onClick={() => setVisibleFileEditForm((prev) => !prev)}
              />
              <FileEditForm
                onFormSubmit={handleEditFormSubmit}
                songId={selectedSong?.id}
                songTitle={selectedSong?.title}
              />
            </section>
          )}
        </section>
        {visibleFileUploadForm && (
          <section className='relative w-[27rem] sm:w-[35rem] md:w-[45rem] bg-[#121212] rounded-lg px-7 py-7 flex flex-col gap-2'>
            <img
              src={icons.close}
              className='w-5 cursor-pointer self-end'
              onClick={() => setVisibleFileUploadForm((prev) => !prev)}
            />
            <FileUploadForm
              onFormSubmit={handleUploadFormSubmit}
              token={token}
            />
          </section>
        )}
        <section id='uploadState' className='flex items-center gap-5'>
          {!visibleFileUploadForm && (
            <button
              className='bg-[#8033D3] text-white py-2 px-5 rounded-full text-sm font-bold focus:outline-none cursor-pointer'
              onClick={() => setVisibleFileUploadForm((prev) => !prev)}
            >
              파일 업로드
            </button>
          )}
        </section>
        <section id='cancelMembership'>
          {visibleAlert && (
            <Alert
              title={`"groov" 를 탈퇴하시겠어요?`}
              message={`탈퇴를 결정하시다니 아쉽습니다 ... 하지만 언젠든 다시 돌아오실 수 있기를 바랍니다. :)`}
              negativeText='탈퇴하겠습니다.'
              onNegativeAction={handleCancelMembership}
              positiveText='생각해볼게요.'
              onPositiveAction={() => setVisibleAlert((prev) => !prev)}
            />
          )}
          <p
            onClick={() => setVisibleAlert((prev) => !prev)}
            className='mt-5 text-[#555555] cursor-pointer'
          >
            회원 탈퇴
          </p>
        </section>
      </div>
    </>
  );
};

export default Profile;
