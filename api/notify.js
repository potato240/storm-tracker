import { Redis } from '@upstash/redis';
import twilio from 'twilio';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export default async function handler(req, res) {
  try {
    const tornadoResponse = await fetch(
      'https://api.weather.gov/alerts/active?event=Tornado%20Warning',
      { headers: { 'User-Agent': 'seb-weather-app' } }
    );
    const tornadoData = await tornadoResponse.json();

    const flagResponse = await fetch(
      'https://api.weather.gov/alerts/active?event=Red%20Flag%20Warning',
      { headers: { 'User-Agent': 'seb-weather-app' } }
    );
    const flagData = await flagResponse.json();

    const tornadoWarnings = (tornadoData.features || []).map(w => ({ ...w, type: 'Tornado Warning' }));
    const flagWarnings = (flagData.features || []).map(w => ({ ...w, type: 'Red Flag Warning' }));
    const warnings = [...tornadoWarnings, ...flagWarnings];

    let textsSent = 0;

    for (const warning of warnings) {
      const warningId = warning.id;
      const warningType = warning.type;
      const headline = warning.properties.headline;
      const areaDesc = warning.properties.areaDesc;

      const alreadySent = await redis.get(`warning:${warningId}`);

      if (!alreadySent) {
        await client.messages.create({
          body: `${warningType}\n${headline}\nArea: ${areaDesc}`,
          from: process.env.TWILIO_PHONE_NU
