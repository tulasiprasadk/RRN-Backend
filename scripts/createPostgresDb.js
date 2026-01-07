import { Client } from 'pg';
import url from 'url';

async function main() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error('ERROR: DATABASE_URL is not set in environment.');
      process.exit(1);
    }

    // parse the URL and replace database with 'postgres' (connect to maintenance DB)
    const parsed = new url.URL(databaseUrl);
    const targetDb = parsed.pathname.replace(/^\//, '') || 'rrn';
    parsed.pathname = '/postgres';
    const adminUrl = parsed.toString();

    console.log('Connecting to Postgres admin DB to create:', targetDb);

    const client = new Client({ connectionString: adminUrl });
    await client.connect();

    const res = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [targetDb]);
    if (res.rowCount > 0) {
      console.log(`Database '${targetDb}' already exists.`);
    } else {
      console.log(`Creating database '${targetDb}'...`);
      await client.query(`CREATE DATABASE \"${targetDb}\"`);
      console.log(`Created database '${targetDb}'.`);
    }

    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Failed to create database:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();
