import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const Downloading = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const token = getToken();
  const songId = sessionStorage.getItem('songId');
  const songTitle = sessionStorage.getItem('songTitle') || '';
  const isExecuted = useRef(false);

  useEffect(() => {
    if (isExecuted.current) return;
    isExecuted.current = true;

    const fetchDownloadSong = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BASE_URL}/downloading/${songId}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 404)
          throw new Error('음원 파일을 찾을 수 없습니다.');
        if (response.status === 403)
          throw new Error('결제가 완료되지 않았습니다.');
        if (!response.ok) throw new Error('다운로드 요청 실패');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.setAttribute('download', songTitle);
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 1000);
        link.remove();

        sessionStorage.removeItem('tid');
        sessionStorage.removeItem('songId');
        sessionStorage.removeItem('songTitle');
        sessionStorage.removeItem('orderId');

        navigate(`/song/${songId}`);
      } catch (error) {
        console.error(error);
        alert('다운로드에 실패했습니다.');
      }
    };

    fetchDownloadSong();
  }, []);

  return (
    <div>
      <p>다운로드 중 ... ጿ ኈ ቼ ዽ ... ♫</p>
    </div>
  );
};

export default Downloading;
