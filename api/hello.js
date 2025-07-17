const handler = async (req, res) => {
  try {
    const { name = 'World' } = req.query;
    res.status(200).json({
      message: `Hello, ${name}!`,
      timestamp: new Date().toISOString(),
      method: req.method
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = handler;
