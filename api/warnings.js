export default async function handler(req, res) {

  const response = await fetch(
    'https://api.weather.gov/alerts/active?event=Severe%20Thunderstorm%20Warning',
    {
      headers: { 'User-Agent': 'seb-weather-app (contact@example.com)' }
    }
  );

  const data = await response.json();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json(data);
}
