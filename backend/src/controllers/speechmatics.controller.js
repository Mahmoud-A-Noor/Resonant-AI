const axios = require('axios');

exports.getJwt = async (req, res) => {
  try {
    const response = await axios.post(
      'https://mp.speechmatics.com/v1/api_keys?type=rt',
      { ttl: 1500 },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SPEECHMATICS_API_KEY}`,
        },
      }
    );
    res.json({ jwt: response.data.key_value });
  } catch (err) {
    console.error('Speechmatics error:', err);
    res.status(500).json({ error: err.message });
  }
};
