import React, { useContext, useState } from 'react';
import Alert from '../../components/Alert';
import Navigation from '../../components/Navigation';
import { useParams } from 'react-router-dom';
import { icons } from '../../assets/assets';
import { PlayerContext } from '../../context/PlayerContext';
import type { Song } from '../../context/PlayerContext';
import './Song.css';

const Song: React.FC = () => {
  const [visibleAlert, setVisibleAlert] = useState(false);
  const { id } = useParams<string>();
  const songDataString = sessionStorage.getItem('songList');
  const songList = songDataString ? JSON.parse(songDataString) : [];
  const songData = songList.find((song: Song) => song.id === id);
  const { playSelectedSong } = useContext(PlayerContext) as {
    playSelectedSong: (id: string) => void;
  };

  const handlePayment = async () => {
    const storedToken = sessionStorage.getItem('token');
    if (!storedToken) {
      setVisibleAlert(true);
      return;
    }
    const token = JSON.parse(storedToken);
    const userId = JSON.parse(sessionStorage.getItem('user') || '').id;

    try {
      const orderId = `order_${songData.id}_${Date.now()}`;
      sessionStorage.setItem('orderId', orderId);
      sessionStorage.setItem('songId', songData.id);
      sessionStorage.setItem('songTitle', songData.title);

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/payment/ready`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            order_id: orderId,
            user_id: userId,
            item_name: songData.title,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed payment request.');

      const data = await response.json();
      sessionStorage.setItem('tid', data.tid);
      window.location.href = data.next_redirect_pc_url;
    } catch (error) {
      console.error(error);
      alert('결제 처리 중 오류가 발생했습니다.');
    }
  };

  const convertToMinutesAndSeconds = (durationInSeconds: number) => {
    const roundedDuration = Math.round(durationInSeconds);
    const minutes = Math.floor(roundedDuration / 60);
    const seconds = roundedDuration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Navigation />
      <div className='mt-9 flex gap-12 flex-col items-center sm:flex-row'>
        <div className='cover'>
          <img
            className='jacket'
            src={`${import.meta.env.VITE_BASE_URL}${songData.image}`}
            alt={songData.name}
          />
          <img
            className='overlay'
            src='/src/assets/images/cover.svg'
            alt='cover'
          />
        </div>
        <div className='flex flex-col justify-between h-full'>
          <div className='flex flex-col'>
            <h2 className='text-4xl font-bold mb-4 md:text-5xl'>
              {songData.title}
            </h2>
            <h4 className='text-xl mb-3'>{songData.desc}</h4>
            <p className='mt-1 flex items-center gap-2'>
              <img
                className='inline-block w-5'
                src={icons.clock}
                alt='재생 시간'
              />
              {songData.duration ? (
                <strong>{convertToMinutesAndSeconds(songData.duration)}</strong>
              ) : (
                <strong>0:00</strong>
              )}
            </p>
            <p className='mt-1 flex items-center gap-2'>
              <img
                className='inline-block w-5'
                src={icons.download}
                alt='다운로드 수'
              />
              <strong>
                {songData.downloaded ? `${songData.download}` : 0} Downloaded
              </strong>
            </p>
          </div>
          <div className='mt-5 flex gap-3'>
            <button
              onClick={() => playSelectedSong(songData.id)}
              className='bg-[#8033D3] text-white w-[120px] py-2 px-5 rounded-full hover:opacity-70 focus:outline-none text-sm font-bold'
            >
              재생하기
            </button>
            <button
              className='bg-[#FFFFFF] text-[#242424] w-[120px] py-2 px-5 rounded-full hover:opacity-70 focus:outline-none text-sm font-bold'
              onClick={handlePayment}
            >
              다운로드
            </button>
          </div>
        </div>
      </div>
      <hr className='mt-10 mb-10' />
      <div className='mb-10'>
        {visibleAlert ? (
          <Alert
            title='이 멋진 음악을 놓치지 마세요!'
            message='원하는 곡을 손쉽게 다운로드하려면 로그인이 필요합니다. 지금 바로 로그인하고 당신만의 음악 세계를 만들어보세요!'
            positiveText='ጿ ኈ ቼ ዽ ... ♫'
            onPositiveAction={() => setVisibleAlert((prev) => !prev)}
          />
        ) : (
          <div>
            <p className='font-bold text-2xl md:text-3xl'>Comments</p>
            <p className='mt-5'>첫 번째 댓글의 주인공이 되어보세요!</p>
          </div>
        )}
      </div>
    </>
  );
};

export default Song;
