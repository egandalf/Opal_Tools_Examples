// api/discovery.js
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const baseUrl = process.env.BASE_URL || '';
  
  const functions = [
    {
      name: "greeting",
      description: "Greets a person in a random language (English, Spanish, or French)",
      parameters: [
        {
          name: "name",
          type: "string",
          description: "Name of the person to greet",
          required: true
        },
        {
          name: "language",
          type: "string",
          description: "Language for greeting (defaults to random)",
          required: false
        }
      ],
      endpoint: `${baseUrl}/tools/greeting`,
      http_method: "POST"
    },
    {
      name: "todays-date",
      description: "Returns today's date in the specified format",
      parameters: [
        {
          name: "format",
          type: "string",
          description: "Date format (defaults to ISO format)",
          required: false
        }
      ],
      endpoint: `${baseUrl}/tools/todays-date`,
      http_method: "POST"
    },
    {
      name: "rick-roll",
      description: "Rick rolls the user",
      parameters: [],
      endpoint: `${baseUrl}/tools/rick-roll`,
      http_method: "POST"
    }
  ];

  res.status(200).json({ functions });
}
