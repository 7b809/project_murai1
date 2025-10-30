export default function EpisodeList({ total, onEpisodeClick }) {
  const episodes = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <div style={{ marginTop: "20px" }}>
      <h3>Episodes</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        {episodes.map((ep) => (
          <button
            key={ep}
            onClick={() => onEpisodeClick(ep)}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              background: "#eee",
              border: "1px solid #ccc",
              cursor: "pointer",
            }}
          >
            Ep {ep}
          </button>
        ))}
      </div>
    </div>
  );
}
