import { Pool } from 'pg';
import bluebird from 'bluebird';
import parse from 'connection-string';
import path from 'path';
import fs from 'fs';

// @ts-ignore
const config = parse(process.env.JAWSDB_URL);
config.connectionLimit = 25;
config.multipleStatements = true;
config.database = config.path[0];
config.host = config.hosts[0].name;
bluebird.promisifyAll([Pool]);
const db = new Pool(config);

async function createTables() {
  console.log('Creating database tables...');
  const sql = fs
    .readFileSync(path.join(__dirname, './database/schema.sql'))
    .toString();
  await db.query(sql, function(err, result) {
    if (err) throw err;
    console.log('Database tables created with success');
  });
}

createTables();

export default db;
