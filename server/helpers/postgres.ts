import { Pool } from 'pg';
import bluebird from 'bluebird';
import parse from 'connection-string';

// @ts-ignore
const config = parse(process.env.JAWSDB_URL);
config.connectionLimit = 25;
config.multipleStatements = true;
config.database = config.path[0];
config.host = config.hosts[0].name;
console.log(config);
bluebird.promisifyAll([Pool]);
const db = new Pool(config);

//console.log('Creating database...');
//const sql = 'CREATE TABLE customers (name VARCHAR(255), address VARCHAR(255))';
//db.query(sql, function(err, result) {
//if (err) throw err;
//console.log('Table created');
//});

export default db;
