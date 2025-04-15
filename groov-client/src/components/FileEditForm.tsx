import React, { useEffect, useState } from 'react';
import useAuth from '../hooks/useAuth';
useAuth;

interface FileEditFormProps {
  onFormSubmit: () => void;
  songId?: string;
  songTitle?: string;
}

const FileEditForm: React.FC<FileEditFormProps> = ({
  onFormSubmit,
  songId,
  songTitle,
}) => {
  const [newCoverImage, setNewCoverImage] = useState<File | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [upload, setUpload] = useState(false);
  const { getToken } = useAuth();
  const token = getToken();

  useEffect(() => {
    if (songTitle) setNewTitle(songTitle);
  }, [songTitle]);

  const handleImageResize = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const image = new Image();
        image.src = event.target?.result as string;
        image.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          const size = Math.min(image.width, image.height);
          canvas.width = size;
          canvas.height = size;

          ctx.drawImage(
            image,
            (image.width - size) / 2,
            (image.height - size) / 2,
            size,
            size,
            0,
            0,
            size,
            size
          );
          canvas.toBlob((blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: 'image/png',
                lastModified: Date.now(),
              });
              resolve(resizedFile);
            } else {
              reject(new Error('이미지 변환 실패'));
            }
          }, 'image/png');
        };
        image.onerror = () => reject(new Error('이미지 로드 실패'));
      };
      reader.onerror = () => reject(new Error('파일 읽기 실패'));
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoverImage) {
      alert('커버 이미지를 등록해주세요.');
      return;
    }
    if (!newTitle) {
      alert('음원 제목을 등록해주세요.');
      return;
    }

    try {
      setUpload(true);

      const resizedImage = await handleImageResize(newCoverImage);
      const formData = new FormData();
      formData.append('title', newTitle);
      formData.append('image_file', resizedImage);

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/song/${songId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('업로드 실패');
      }

      alert('음원이 수정되었어요! 🎵');
      onFormSubmit();
      setNewCoverImage(null);
      setNewTitle('');
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert('파일 업로드에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setUpload(false);
    }
  };

  const handleDeleteSong = async () => {
    const userConfirmed = window.confirm(
      `"${songTitle}"를 삭제하면 다시 복원할 수 없어요. 정말 삭제하시겠어요?`
    );
    if (!userConfirmed) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/song/${songId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error('Failed to delete song.');
      }
      alert(`"${songTitle}"가 성공적으로 삭제되었습니다.`);
      window.location.reload();
    } catch (error) {
      console.error('Fetch error:', error);
      alert('노래를 삭제하는 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div>
        <label htmlFor='newTitle' className='block text-sm font-medium mb-2'>
          음원 제목
        </label>
        <input
          id='newTitle'
          type='text'
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className='px-3 py-2 w-full  text-black focus:outline-none focus:ring-2 text-sm '
          placeholder='음원 제목을 작성해주세요.'
          required
          maxLength={20}
        />
      </div>

      <div>
        <label
          htmlFor='newCoverImage'
          className='block text-sm font-medium mb-2'
        >
          커버 이미지
        </label>
        <input
          id='newCoverImage'
          type='file'
          accept='image/png, image/jpeg, image/jpg'
          onChange={(e) =>
            e.target.files && setNewCoverImage(e.target.files[0])
          }
          className='w-full text-sm text-gray-500 bg-white file:mr-4 file:py-2 file:px-4  file:border-0 file:text-sm file:font-semibold file:bg-[#242424] file:rounded-none file:text-white'
        />
      </div>

      <section id='uploadState' className='flex items-center gap-5'>
        <button
          className={`bg-[#8033D3] text-white py-2 px-5 rounded-full text-sm font-bold focus:outline-none cursor-pointer mt-5 ${
            upload ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-70'
          }`}
        >
          파일 수정
        </button>
        <button
          type='button'
          onClick={() => handleDeleteSong()}
          className={`bg-white text-black py-2 px-5 rounded-full text-sm font-bold focus:outline-none cursor-pointer mt-5 ${
            upload ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-70'
          }`}
        >
          파일 삭제
        </button>
        {upload ? (
          <p className='text-white flex justify-center text-xs mt-5'>
            수정 중 ... ጿ ኈ ቼ ዽ ... ♫
          </p>
        ) : (
          ''
        )}
      </section>
    </form>
  );
};

export default FileEditForm;
