import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { icons } from '../assets/assets';

const Sidebar: React.FC = () => {
  const [inputVisible, setInputVisible] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const { search } = useLocation();

  useEffect(() => {
    const query = new URLSearchParams(search);
    const text = query.get('q');
    if (text) setSearchValue(text);
    else setSearchValue('');
  }, [search]);

  const handleSearchClick = () => {
    setInputVisible((prev) => !prev);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    navigate(`search?q=${e.target.value}`, { replace: true });
    if (!inputVisible && inputRef.current) inputRef.current.focus();
  };

  return (
    <div className='w-[25%] h-full p-2 flex-col gap-2 text-white hidden lg:flex'>
      <div className='bg-[#121212] h-[15%] rounded flex flex-col justify-around'>
        <div
          onClick={() => navigate('/')}
          className='flex item-center gap-3 pl-4 cursor-pointer'
        >
          <img className='w-6' src={icons.home} alt='홈' />
          <strong className='font-bold'>홈</strong>
        </div>
        <div className='flex item-center gap-3 pl-4 pr-4'>
          <img
            onClick={handleSearchClick}
            className='w-6 cursor-pointer'
            src={icons.search}
            alt='검색'
          />
          {inputVisible && (
            <input
              className='flex-grow border-none rounded-[15px] px-3 focus:outline-none text-black text-sm'
              placeholder='제목으로 검색해주세요.'
              ref={inputRef}
              value={searchValue}
              type='text'
              onChange={handleSearch}
            />
          )}
          {!inputVisible && <strong className='font-bold'>검색</strong>}
        </div>
      </div>
      <div className='bg-[#121212] h-[85%] rounded'>
        <div className='p-4 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <img className='w-6' src={icons.stack} alt='뮤직 아카이브' />
            <strong className='font-semibold'>나의 라이브러리</strong>
          </div>

          <div className='flex items-center gap-3'>
            <img className='w-5' src={icons.arrow} alt='' />
            <img className='w-5' src={icons.plus} alt='' />
          </div>
        </div>
        <div className='p-4 bg-[#242424] m-2 rounded font-semibold flex flex-col items-start justify-start gap-1 pl-4'>
          <h1>플레이리스트 만들기</h1>
          <p className='font-light'>
            나만의 취향이 가득 담긴 플레이리스트를 만들어 보세요.
          </p>
          <button className='font-normal px-4 py-1.5 bg-white text=[15px] text-black rounded-full mt-4'>
            플레이리스트 만들기
          </button>
        </div>
        <div className='p-4 bg-[#242424] m-2 rounded font-semibold flex flex-col items-start justify-start gap-1 pl-4 mt-4'>
          <h1>팟캐스트 구독하기</h1>
          <p className='font-light'>재미있는 에피소드를 찾아보세요.</p>
          <button className='font-normal px-4 py-1.5 bg-white text=[15px] text-black rounded-full mt-4'>
            팟캐스트 둘러보기
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
