const useAuth = () => {
  const getToken = () => {
    const storedToken = sessionStorage.getItem('token');
    if (!storedToken) {
      return null;
    }
    try {
      const token = JSON.parse(storedToken);
      return token;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  return { getToken };
};

export default useAuth;
