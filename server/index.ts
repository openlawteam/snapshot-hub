import express from 'express';
import spaces from '@snapshot-labs/snapshot-spaces';
import relayer from './helpers/relayer';
import { pinJson } from './helpers/ipfs';
import {
  verifySignature,
  jsonParse,
  sendError,
  hashPersonalMessage
} from './helpers/utils';
import {
  storeProposal,
  storeVote,
  getProposals,
  getProposalsBy,
  getProposalVotes
} from './helpers/adapters/postgres';
import pkg from '../package.json';
import { migrateProposals } from './helpers/migration/migrate';

const network = process.env.NETWORK || 'testnet';

//TODO: load token map according to each env: dev/prod
const tokens = {
  '0x8276d5e4133eba2043a2a9fccc55284c1243f1d4': 'thelao'
};

const router = express.Router();

router.get('/', (req, res) => {
  console.log('GET /api');
  return res.json({
    name: pkg.name,
    network,
    version: pkg.version,
    tag: 'alpha',
    relayer: relayer.address
  });
});

router.get('/spaces/:key?', (req, res) => {
  const { key } = req.params;
  console.log('GET /spaces/:key', key);
  return res.json(key ? spaces[key] : spaces);
});

router.put('/:space/migrate', async (req, res) => {
  const { space } = req.params;
  console.log('GET /:space/migrate', space);
  migrateProposals(space);
  return res.sendStatus(201);
});

router.get('/:space/proposals', async (req, res) => {
  const { space } = req.params;
  console.log('GET /:space/proposals', space);
  getProposals(space).then(messages => {
    res.json(
      Object.fromEntries(
        messages.map(message => {
          return [
            message.id,
            {
              address: message.address,
              msg: {
                version: message.version,
                timestamp: message.timestamp.toString(),
                token: message.token,
                type: message.type,
                payload: message.payload
              },
              sig: message.sig,
              authorIpfsHash: message.id,
              relayerIpfsHash: message.metadata.relayer_ipfs_hash,
              deprecated: message.deprecated
            }
          ];
        })
      )
    );
  });
});

router.get('/:space/proposal/:id', async (req, res) => {
  const { space, id } = req.params;
  console.log('GET /:space/proposal/:id', space, id);
  getProposalVotes(space, id).then(messages => {
    res.json(
      Object.fromEntries(
        messages.map(message => {
          return [
            message.address,
            {
              address: message.address,
              msg: {
                version: message.version,
                timestamp: message.timestamp.toString(),
                token: message.token,
                type: message.type,
                payload: message.payload
              },
              sig: message.sig,
              authorIpfsHash: message.id,
              relayerIpfsHash: message.metadata.relayer_ipfs_hash,
              deprecated: message.deprecated
            }
          ];
        })
      )
    );
  });
});

router.post('/message', async (req, res) => {
  console.log('POST /message');
  const body = req.body;
  const msg = jsonParse(body.msg);
  const ts = (Date.now() / 1e3).toFixed();
  // const minBlock = (3600 * 24) / 15;

  if (!body || !body.address || !body.msg || !body.sig)
    return sendError(res, 'wrong message body');

  if (
    Object.keys(msg).length !== 5 ||
    !msg.token ||
    !msg.payload ||
    Object.keys(msg.payload).length === 0
  )
    return sendError(res, 'wrong signed message');

  if (!tokens[msg.token]) return sendError(res, 'unknown space');

  if (
    !msg.timestamp ||
    typeof msg.timestamp !== 'string' ||
    msg.timestamp > ts + 30
  )
    return sendError(res, 'wrong timestamp');

  if (!msg.version || msg.version !== pkg.version)
    return sendError(res, 'wrong version');

  if (!msg.type || !['proposal', 'vote'].includes(msg.type))
    return sendError(res, 'wrong message type');

  if (
    !(await verifySignature(
      body.address,
      body.sig,
      hashPersonalMessage(body.msg)
    ))
  )
    return sendError(res, 'wrong signature');

  if (msg.type === 'proposal') {
    if (
      Object.keys(msg.payload).length !== 7 ||
      !msg.payload.choices ||
      msg.payload.choices.length < 2 ||
      !msg.payload.snapshot ||
      !msg.payload.metadata
    )
      return sendError(res, 'wrong proposal format');

    if (
      !msg.payload.name ||
      msg.payload.name.length > 256 ||
      !msg.payload.body ||
      msg.payload.body.length > 4e4
    )
      return sendError(res, 'wrong proposal size');

    if (
      typeof msg.payload.metadata !== 'object' ||
      JSON.stringify(msg.payload.metadata).length > 2e4
    )
      return sendError(res, 'wrong proposal metadata');

    if (
      !msg.payload.start ||
      // ts > msg.payload.start ||
      !msg.payload.end ||
      msg.payload.start >= msg.payload.end
    )
      return sendError(res, 'wrong proposal period');
  }

  if (msg.type === 'vote') {
    if (
      Object.keys(msg.payload).length !== 3 ||
      !msg.payload.proposal ||
      !msg.payload.choice ||
      !msg.payload.metadata
    )
      return sendError(res, 'wrong vote format');

    if (
      typeof msg.payload.metadata !== 'object' ||
      JSON.stringify(msg.payload.metadata).length > 1e4
    )
      return sendError(res, 'wrong vote metadata');

    const proposals = await getProposalsBy(msg.token, msg.payload.proposal);
    if (!proposals || proposals.length == 0)
      return sendError(res, 'unknown proposal');

    const payload = jsonParse(proposals[0].payload);
    if (ts > payload.end || payload.start > ts)
      return sendError(res, 'not in voting window');
  }

  const space = tokens[msg.token];

  const authorIpfsRes = await pinJson(`snapshot/${body.sig}`, {
    address: body.address,
    msg: body.msg,
    sig: body.sig,
    version: '2'
  });

  const relayerSig = await relayer.signMessage(authorIpfsRes);
  const relayerIpfsRes = await pinJson(`snapshot/${relayerSig}`, {
    address: relayer.address,
    msg: authorIpfsRes,
    sig: relayerSig,
    version: '2'
  });

  if (msg.type === 'proposal') {
    await storeProposal(space, msg.token, body, authorIpfsRes, relayerIpfsRes);

    //const networkStr = network === 'testnet' ? 'demo.' : '';
    let message = `${space} (${network})\n`;
    message += `**${msg.payload.name}**\n`;
    message += `<https://ipfs.fleek.co/ipfs/${authorIpfsRes}>`;
    console.log(`New proposal: ${message}`);
  }

  if (msg.type === 'vote') {
    await storeVote(space, msg.token, body, authorIpfsRes, relayerIpfsRes);
  }

  console.log(
    `Address "${body.address}"\n`,
    `Token "${msg.token}"\n`,
    `Type "${msg.type}"\n`,
    `IPFS hash "${authorIpfsRes}"`
  );

  return res.json({ ipfsHash: authorIpfsRes });
});

export default router;
