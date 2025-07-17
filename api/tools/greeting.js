// api/tools/greeting.js
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, language } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name parameter is required' });
  }

  try {
    const availableLanguages = (process.env.GREETING_LANGUAGES || 'english,spanish,french').split(',');
    
    const greetings = {
      english: `Hello, ${name}!`,
      spanish: `¡Hola, ${name}!`,
      french: `Bonjour, ${name}!`
    };

    const selectedLanguage = language || availableLanguages[Math.floor(Math.random() * availableLanguages.length)];
    const greeting = greetings[selectedLanguage.toLowerCase()] || greetings.english;

    res.status(200).json({
      result: greeting,
      language: selectedLanguage
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
