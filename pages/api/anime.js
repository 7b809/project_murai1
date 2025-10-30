import axios from "axios";

export default async function handler(req, res) {
  const { anime_id } = req.query;
  if (!anime_id)
    return res.status(400).json({ error: "Missing anime_id parameter" });

  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title {
          romaji
          english
          native
        }
        description(asHtml: false)
        episodes
        season
        seasonYear
        coverImage {
          extraLarge
          large
        }
        bannerImage
        genres
        averageScore
      }
    }
  `;

  try {
    const response = await axios.post("https://graphql.anilist.co", {
      query,
      variables: { id: parseInt(anime_id) },
    });

    return res.json(response.data.data.Media);
  } catch (err) {
    console.error("AniList Error:", err);
    return res.status(500).json({ error: "Failed to fetch anime details" });
  }
}
