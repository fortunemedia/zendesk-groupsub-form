// netlify/functions/submit.js
// Netlify Serverless Function — proxies form data to Zendesk Tickets API
// Set these in your Netlify dashboard under Site Configuration → Environment Variables:
//   ZENDESK_SUBDOMAIN
//   ZENDESK_EMAIL
//   ZENDESK_API_TOKEN

exports.handler = async function (event, context) {

  // ─── CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // ─── Pull credentials from Netlify env vars (never exposed to the client)
  const subdomain = process.env.ZENDESK_SUBDOMAIN;
  const email     = process.env.ZENDESK_EMAIL;
  const token     = process.env.ZENDESK_API_TOKEN;

  if (!subdomain || !email || !token) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Missing Zendesk environment variables' }) };
  }

  // ─── Forward the payload straight to Zendesk
  try {
    const zendesk = await fetch(
      `https://${subdomain}.zendesk.com/api/v2/tickets.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + Buffer.from(email + '/token:' + token).toString('base64')
        },
        body: event.body  // already a JSON string from the form
      }
    );

    const data = await zendesk.json();
    return { statusCode: zendesk.status, headers, body: JSON.stringify(data) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to reach Zendesk', details: err.message }) };
  }
}
