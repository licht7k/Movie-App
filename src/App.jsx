import React, { useEffect, useState } from "react";
import Search from "./components/Search";
import Spinner from "./components/Spinner";
import MovieCard from "./components/MovieCard";
import { useDebounce } from "react-use";
import { updateSearchCount } from "./appwrite";
import { getTrendingMovies } from "./appwrite";

// TMDB_API_KEY =
//   "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4MmY4YWRjMTE3NTZlMmViOWNiNmE0MDBhN2IwMjE4ZCIsIm5iZiI6MTc1NDUzOTA4NC42MTMsInN1YiI6IjY4OTQyNDRjYWQ2ZDFlNjc3MzlkYjBmMyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.D620XOqnca-gN7xrl19Y9Xgm9Wpu7_7Xry052xKLsiA";

const API_Base_URL = "https://api.themoviedb.org/3";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

const App = () => {
  const [search, setSearch] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  const [movieList, setMovieList] = useState([]);

  const [trendingMovies, setTrendingMovies] = useState([]);

  const [loading, setLoading] = useState(false);

  const [debouncedSearchTerm, setdebouncedSearchTerm] = useState("");

  //debounce delay function
  useDebounce(() => setdebouncedSearchTerm(search), 700, [search]);

  //fetch movies --------
  const fetchMovies = async (query = "") => {
    setLoading(true);
    setErrorMessage("");

    try {
      const endpoint = query
        ? `${API_Base_URL}/search/movie?query=${query}`
        : `${API_Base_URL}/discover/movie?sort_by=popularity.desc`;

      const response = await fetch(endpoint, API_OPTIONS);
      //                           where     how

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (data.response === "False") {
        setErrorMessage(
          data.error || "Failed to fetch movies. Please try again later."
        );
        setMovieList([]);
        return;
      }
      setMovieList(data.results || []);
      console.log("Movies fetched successfully:", data.results);

      if (query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
      }
    } catch (error) {
      console.error(`Error fetching movies: ${error}`);
      setErrorMessage("Failed to fetch movies. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const loadTrendingMovies = async () => {
    try {

      const movies = await getTrendingMovies();

      setTrendingMovies(movies);
      console.log("Trending movies loaded successfully:", movies);
      
    } catch (error) {
      console.error("Error loading trending movies:", error);
    }
  };

  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    loadTrendingMovies();
    console.log("Trending movies loaded on mount");
  }, []);

  return (
    <main>
      <div className="pattern" />
      <div className="wrapper">
        <header>
          <img className="w-sm" src="./hero-img.png" alt="Hero Banner" />
          <h1 className="text-5xl">
            Discover <span className="text-gradient">Movies</span> You'll Love{" "}
            <br /> Simple and Quick
          </h1>
          <Search search={search} setSearch={setSearch} />
        </header>

        {trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>
            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.id}>
                  <p>{index + 1}</p>
                  <img src={movie.poster_url} alt={movie.title} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="all-movies">
          <h2 className="mt-15">All Movies</h2>
          {loading ? (
            <Spinner />
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <ul>
              {movieList.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
};

export default App;
