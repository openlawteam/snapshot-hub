import serveStatic from 'serve-static';
import bodyParser from 'body-parser';
import frameguard from 'frameguard';
import cors from 'cors';
import api from './server';

const allowedDomains = process.env.ALLOWED_DOMAINS
  ? process.env.ALLOWED_DOMAINS.split(',')
  : ['http://localhost'];

console.log(`Allowed domains ${allowedDomains.length}: ${allowedDomains}`);

const corsOptionsDelegate = (req, callback) => {
  const isDomainAllowed = allowedDomains.indexOf(req.header('Origin')) !== -1;
  const corsOptions = { origin: isDomainAllowed };
  callback(null, corsOptions);
};

export default (app, server) => {
  app.use(bodyParser.json({ limit: '20mb' }));
  app.use(bodyParser.urlencoded({ limit: '20mb', extended: false }));
  // @ts-ignore
  app.use(serveStatic(`${__dirname}/dist`));
  app.use(frameguard({ action: 'deny' }));
  app.use(cors(corsOptionsDelegate));
  app.use('/api', api);
  // @ts-ignore
  app.get('/*', (req, res) => res.sendStatus(200));
};
