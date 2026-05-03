import { kv } from '@vercel/kv';
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export default async function handler(req, res) {
  try {
    // Fetch current tornado warnings from NWS
    const response = await fetch(
      'https://api.weather.gov/alerts/active?event=Tornado%20Warning',
      { headers: { 'User-Agent': 'seb-weather-app' } }
    );
    const data = await response.json();
    const warnings = data.features || [];

    let textsSent = 0;

    // Check each warning
    for (const warning of warnings) {
      const warningId = warning.id;
      const headline = warning.properties.headline;
      const areaDesc = warning.properties.areaDesc;

      // Check if we've already texted about this warning
      const alreadySent = await kv.get(`tornado:${warningId}`);

      if (!alreadySent) {
        // New warning — send a text
        await client.messages.create({
          body: `🌪️ TORNADO WARNING\n${headline}\nArea: ${areaDesc}`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: process.env.TWILIO_TEST_NUMBER,
        });

        // Remember we sent this one (keep for 24 hours)
        await kv.set(`tornado:${warningId}`, '1', { ex: 86400 });
        textsSent++;
      }
    }

    res.status(200).json({
      success: true,
      warningsChecked: warnings.length,
      textsSent,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
