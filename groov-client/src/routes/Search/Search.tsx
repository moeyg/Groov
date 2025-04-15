import { useEffect, useState } from 'react';
import SongList from '../../components/SongList';
import Navigation from '../../components/Navigation';
import useDebounce from '../../hooks/useDebounce';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

interface Song {
  id: string;
  title: string;
  image: string;
  description: string;
}

const Search = () => {
  const [searchResults, setSearchResults] = useState([]);
  const useQuery = () => {
    return new URLSearchParams(useLocation().search);
  };
  const query = useQuery();
  const searchedSong = query.get('q') || '';
  const debounceSearchTerm = useDebounce(searchedSong, 500);

  const fetchData = async (searchedSong: string) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/song?search=${searchedSong}`,
        {
          method: 'GET',
        }
      );
      const songList = response.data.data;
      setSearchResults(songList);
    } catch (error) {
      console.error('Error fetching song data:', error);
    }
  };

  useEffect(() => {
    if (debounceSearchTerm && debounceSearchTerm.trim() !== '') {
      fetchData(debounceSearchTerm);
    }
  }, [debounceSearchTerm]);

  return (
    <div>
      <Navigation />
      <h1 className='mt-7 mb-2 ml-3 font-bold lg:text-4xl text-3xl'>
        검색 결과
      </h1>
      {searchResults.length ? (
        <div>
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 '>
            {searchResults.map((song: Song) => (
              <SongList
                key={song.id}
                id={song.id}
                title={song.title}
                image={song.image}
                description={song.description}
              />
            ))}
          </div>
        </div>
      ) : (
        <div>
          <p className='mt-5 ml-3'>
            &quot;{searchedSong}&quot; 에 해당하는 음악은 아직 없어요.
          </p>
        </div>
      )}
    </div>
  );
};

export default Search;
