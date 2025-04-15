import React, {
  createContext,
  useRef,
  useState,
  ReactNode,
  useEffect,
} from 'react';

export interface Time {
  currentTime: {
    second: number;
    minute: number;
  };
  totalTime: {
    second: number;
    minute: number;
  };
}

export interface Song {
  id: string;
  title: string;
  image: string;
  fileUrl: string;
  uploadDate: string;
  duration: string;
  downloadCount: number;
  description: string;
}

interface PlayerContextType {
  audioRef: React.RefObject<HTMLAudioElement>;
  trackLength: React.RefObject<HTMLDivElement>;
  seekBar: React.RefObject<HTMLDivElement>;
  track: Song | null;
  setTrack: React.Dispatch<React.SetStateAction<Song | null>>;
  playStatus: boolean;
  setPlayStatus: React.Dispatch<React.SetStateAction<boolean>>;
  time: Time;
  setTime: React.Dispatch<React.SetStateAction<Time>>;
  play: () => void;
  pause: () => void;
  playSelectedSong: (id: string) => void;
  previous: () => void;
  next: () => void;
  seekTo: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  songsData: Song[];
}

interface PlayerContextProviderProps {
  children: ReactNode;
}

export const PlayerContext = createContext<PlayerContextType | undefined>(
  undefined
);

const PlayerContextProvider: React.FC<PlayerContextProviderProps> = ({
  children,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const trackLength = useRef<HTMLDivElement>(null);
  const seekBar = useRef<HTMLDivElement>(null);
  const [songsData, setSongsData] = useState<Song[]>([]);
  const [track, setTrack] = useState<Song | null>(null);
  const [playStatus, setPlayStatus] = useState(false);
  const [time, setTime] = useState<Time>({
    currentTime: {
      second: 0,
      minute: 0,
    },
    totalTime: {
      second: 0,
      minute: 0,
    },
  });

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BASE_URL}/songs`, {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch songs data.');
        }

        const songList = await response.json();
        if (!songList || !Array.isArray(songList.data)) {
          throw new Error('Invalid song data format.');
        }

        setSongsData(songList.data);
        sessionStorage.setItem('songList', JSON.stringify(songList.data));
        if (songList.data.length > 0) {
          setTrack(songList.data[0]);
        }
      } catch (error) {
        console.error(error);
        setSongsData([]);
      }
    };

    fetchSongs();
  }, []);

  const play = () => {
    if (audioRef.current) {
      audioRef.current
        .play()
        .catch((err) => console.error('Playback error:', err));
      setPlayStatus(true);
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayStatus(false);
    }
  };

  const playSelectedSong = async (id: string) => {
    if (!songsData || songsData.length === 0) {
      console.error('Songs data is empty or undefined.');
      return;
    }
    const selectedTrack = songsData.find((song) => song.id === id);
    if (selectedTrack) {
      setTrack(selectedTrack);
      if (audioRef.current) {
        const fullUrl = `${import.meta.env.VITE_BASE_URL}${
          selectedTrack.fileUrl
        }`;

        try {
          audioRef.current.src = fullUrl;
          await audioRef.current.play();
          setPlayStatus(true);
        } catch (err) {
          console.error('Playback error:', err);
        }
      }
    }
  };

  const previous = async () => {
    if (track) {
      const currentIndex = songsData.findIndex((song) => song.id === track.id);
      if (currentIndex > 0) {
        const previousTrack = songsData[currentIndex - 1];
        setTrack(previousTrack);
        if (audioRef.current) {
          audioRef.current.src = previousTrack.fileUrl;
          audioRef.current
            .play()
            .catch((err) => console.error('Playback error:', err));
        }
        setPlayStatus(true);
      }
    }
  };

  const next = async () => {
    if (track) {
      const currentIndex = songsData.findIndex((song) => song.id === track.id);
      if (currentIndex < songsData.length - 1) {
        const nextTrack = songsData[currentIndex + 1];
        setTrack(nextTrack);
        if (audioRef.current) {
          audioRef.current.src = nextTrack.fileUrl;
          audioRef.current
            .play()
            .catch((err) => console.error('Playback error:', err));
        }
        setPlayStatus(true);
      }
    }
  };

  const seekTo = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (audioRef.current && trackLength.current) {
      audioRef.current.currentTime =
        (event.nativeEvent.offsetX / trackLength.current.offsetWidth) *
        audioRef.current.duration;
    }
  };

  useEffect(() => {
    const updateBarAndTime = () => {
      if (audioRef.current && seekBar.current) {
        const currentTime = audioRef.current.currentTime;
        const duration = audioRef.current.duration;

        if (!isNaN(duration) && duration > 0) {
          seekBar.current.style.width = `${Math.floor(
            (currentTime / duration) * 100
          )}%`;

          setTime({
            currentTime: {
              second: Math.floor(currentTime % 60),
              minute: Math.floor(currentTime / 60),
            },
            totalTime: {
              second: Math.floor(duration % 60),
              minute: Math.floor(duration / 60),
            },
          });
        }
      }
    };

    if (audioRef.current) {
      audioRef.current.addEventListener('timeupdate', updateBarAndTime);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', updateBarAndTime);
      }
    };
  }, [audioRef, seekBar]);

  const contextValue: PlayerContextType = {
    audioRef,
    trackLength,
    seekBar,
    track,
    setTrack,
    playStatus,
    setPlayStatus,
    time,
    setTime,
    play,
    pause,
    playSelectedSong,
    previous,
    next,
    seekTo,
    songsData,
  };

  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
      <audio ref={audioRef} preload='auto'></audio>
    </PlayerContext.Provider>
  );
};

export default PlayerContextProvider;
