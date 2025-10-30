import { useState } from "react";
import axios from "axios";
import EpisodeList from "../components/EpisodeList";

export default function Home() {
  const [animeId, setAnimeId] = useState("");
  const [anime, setAnime] = useState(null);
  const [videoLink, setVideoLink] = useState("");

  const fetchAnime = async () => {
    if (!animeId) return alert("Enter an Anime ID");
    const res = await axios.get(`/api/anime?anime_id=${animeId}`);
    setAnime(res.data);
    setVideoLink("");
  };

  const fetchVideo = async (ep) => {
    setVideoLink("Fetching video link...");
    const res = await axios.get(`/api/watch?anime_id=${anime.id}&episode=${ep}`);
    setVideoLink(res.data.watch_url || "No video found");
  };

  return (
    <div style={{ padding: "30px", fontFamily: "sans-serif" }}>
      <h1>🎬 Miruro Anime Viewer</h1>

      <input
        type="number"
        placeholder="Enter Anime ID"
        value={animeId}
        onChange={(e) => setAnimeId(e.target.value)}
        style={{ padding: "8px", marginRight: "10px" }}
      />
      <button onClick={fetchAnime} style={{ padding: "8px 15px" }}>
        Fetch
      </button>

      {anime && (
        <div style={{ marginTop: "20px" }}>
          <h2>{anime.title.romaji}</h2>
          <img
            src={anime.coverImage.large}
            alt="cover"
            style={{ width: "200px", borderRadius: "10px" }}
          />
          <p>{anime.description}</p>

          <EpisodeList
            total={anime.episodes || 12}
            onEpisodeClick={(ep) => fetchVideo(ep)}
          />
        </div>
      )}

      {videoLink && (
        <div style={{ marginTop: "30px" }}>
          <h3>🎥 Watch Link:</h3>
          <a href={videoLink} target="_blank" rel="noopener noreferrer">
            {videoLink}
          </a>
        </div>
      )}
    </div>
  );
}
