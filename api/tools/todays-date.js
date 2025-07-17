// api/tools/todays-date.js
const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { format } = req.body;

  try {
    const today = new Date();
    const defaultFormat = process.env.DEFAULT_DATE_FORMAT || 'iso';
    const requestedFormat = format || defaultFormat;
    let formattedDate;

    switch (requestedFormat.toLowerCase()) {
      case 'short':
        formattedDate = today.toLocaleDateString();
        break;
      case 'long':
        formattedDate = today.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        break;
      case 'time':
        formattedDate = today.toLocaleString();
        break;
      default:
        formattedDate = today.toISOString().split('T')[0]; // ISO format (YYYY-MM-DD)
    }

    res.status(200).json({
      result: formattedDate,
      format: requestedFormat
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
module.exports = handler;
