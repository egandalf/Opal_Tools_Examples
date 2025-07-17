// api/tools/rick-roll.js
const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rickRollMessages = [
      "🎵 Never gonna give you up, never gonna let you down! 🎵",
      "You've been Rick Rolled! 🕺",
      "🎤 Never gonna run around and desert you! 🎤",
      "Rick Astley strikes again! 🎸",
      "🎵 We're no strangers to love... 🎵"
    ];

    const randomMessage = rickRollMessages[Math.floor(Math.random() * rickRollMessages.length)];
    const videoUrl = process.env.RICK_ROLL_VIDEO_URL || "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

    res.status(200).json({
      result: randomMessage,
      video_url: videoUrl,
      message: "You've been Rick Rolled! 🎉"
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
