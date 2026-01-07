import fetch from 'node-fetch';

async function main() {
  const url = 'http://localhost:3000/api/products?debug=true';
  try {
    const res = await fetch(url);
    console.log('Status:', res.status);
    console.log('Headers:', Object.fromEntries(res.headers.entries()));
    const text = await res.text();
    console.log('Body (raw):', text.slice(0, 2000));
    try {
      const json = JSON.parse(text);
      console.log('Body parsed (type):', Array.isArray(json) ? 'array' : typeof json);
    } catch (e) {
      console.error('Failed to parse JSON:', e.message);
    }
  } catch (err) {
    console.error('Request failed:', err.message);
  }
}

main();
