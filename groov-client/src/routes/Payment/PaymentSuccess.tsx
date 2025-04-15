import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const token = getToken();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pgToken = urlParams.get('pg_token');
    const userId = JSON.parse(sessionStorage.getItem('user') || '').id;
    const songId = sessionStorage.getItem('songId');
    const orderId = sessionStorage.getItem('orderId');
    const tid = sessionStorage.getItem('tid');

    const handlePaymentSuccess = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BASE_URL}/payment/approve`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              user_id: userId,
              order_id: orderId,
              song_id: songId,
              tid: tid,
              pg_token: pgToken,
            }),
          }
        );

        const result = await response.json();
        if (result.data === 'payment_success') {
          navigate(`/downloading`);
        }
      } catch (error) {
        console.error(error);
        alert('결제 승인 처리 중 오류가 발생했습니다.');
        navigate('/');
      }
    };

    if (pgToken) handlePaymentSuccess();
  }, []);

  return (
    <div>
      <p>결제 처리 중 ... ጿ ኈ ቼ ዽ ... ♫</p>
    </div>
  );
};

export default PaymentSuccess;
