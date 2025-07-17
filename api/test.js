
// api/test.js
const handler = async (req, res) => {
  res.status(200).json({ message: "Test endpoint working!" });
}
module.exports = handler;
