import React, { useState } from 'react';

interface FileUploadFormProps {
  onFormSubmit: () => void;
  token: string;
}

const FileUploadForm: React.FC<FileUploadFormProps> = ({
  onFormSubmit,
  token,
}) => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [songTitle, setSongTitle] = useState('');
  const [upload, setUpload] = useState(false);

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
    if (!audioFile || !coverImage || !songTitle) {
      return;
    }

    try {
      setUpload(true);

      const resizedImage = await handleImageResize(coverImage);
      const formData = new FormData();
      formData.append('title', songTitle);
      formData.append('audio_file', audioFile);
      formData.append('image_file', resizedImage);

      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('업로드 실패');
      }

      alert('멋진 음악이네요! 🎵');
      onFormSubmit();
      setAudioFile(null);
      setCoverImage(null);
      setSongTitle('');
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert('파일 업로드에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setUpload(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div>
        <label htmlFor='songTitle' className='block text-sm font-medium mb-2'>
          음원 제목
        </label>
        <input
          id='songTitle'
          type='text'
          value={songTitle}
          onChange={(e) => setSongTitle(e.target.value)}
          className='px-3 py-2 w-full  text-black focus:outline-none focus:ring-2 text-sm '
          placeholder='음원 제목을 작성해주세요.'
          required
          maxLength={20}
        />
      </div>

      <div>
        <label htmlFor='audioFile' className='block text-sm font-medium mb-2'>
          오디오 파일
        </label>
        <input
          id='audioFile'
          type='file'
          accept='audio/mp3'
          onChange={(e) => e.target.files && setAudioFile(e.target.files[0])}
          className='w-full text-sm text-gray-500 bg-white file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-[#242424] file:rounded-none file:text-white'
          required
        />
      </div>

      <div>
        <label htmlFor='coverImage' className='block text-sm font-medium mb-2'>
          커버 이미지
        </label>
        <input
          id='coverImage'
          type='file'
          accept='image/png, image/jpeg, image/jpg'
          onChange={(e) => e.target.files && setCoverImage(e.target.files[0])}
          className='w-full text-sm text-gray-500 bg-white file:mr-4 file:py-2 file:px-4  file:border-0 file:text-sm file:font-semibold file:bg-[#242424] file:rounded-none file:text-white'
          required
        />
      </div>

      <section id='uploadState' className='flex items-center gap-5'>
        <button
          className={`bg-[#8033D3] text-white py-2 px-5 rounded-full text-sm font-bold focus:outline-none cursor-pointer mt-5 ${
            upload ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-70'
          }`}
        >
          파일 업로드
        </button>
        {upload ? (
          <p className='text-white flex justify-center text-xs mt-5'>
            업로드 중 ... ጿ ኈ ቼ ዽ ... ♫
          </p>
        ) : (
          ''
        )}
      </section>
    </form>
  );
};

export default FileUploadForm;
