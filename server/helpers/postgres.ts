import pq from 'pg';
import Pool from 'pg-pool';
import Connection from 'mysql/lib/Connection';
import bluebird from 'bluebird';
import parse from 'pg-connection-string';

// @ts-ignore
const config = parse(process.env.JAWSDB_URL);
config.connectionLimit = 25;
config.multipleStatements = true;
config.database = config.path[0];
config.host = config.hosts[0].name;
bluebird.promisifyAll([Pool, Connection]);
const db = new Pool(config);

export default db;
