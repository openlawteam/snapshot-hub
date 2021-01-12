import express from 'express';
import relayer from './helpers/relayer';
import path from 'path';
import fs from 'fs';
import { pinJson } from './helpers/ipfs';
import { getAddress } from '@ethersproject/address';
import { jsonParse, sendError } from './helpers/utils';
import verifySignature from './helpers/erc712';
/**
 * OpenLaw uses Postgres to store the proposals and votes, so a new adapter was created to
 * connect to Postgres DB. The Queries and Inserts were moved to the adapter file: postgres.ts, mainly because the syntax
 * is a bit different for each database.
 */
import {
  storeProposal,
  storeVote,
  getProposals,
  getProposalsById,
  getProposalsByAction,
  getProposalVotes
} from './helpers/adapters/postgres';
import pkg from '../package.json';
/**
 * In order to migrate the data from snapshot-hub service to OpenLaw infra, we expose a new endpoint
 * to trigger the migration process via a PUT call. The migration happens async and gets logged to the server logs.
 */
const network = process.env.NETWORK || 'testnet';

/**
 * The upstream implementation relies on @snapshot-labs/snapshot-spaces npm lib to fetch all the available spaces.
 * Since this implementation is used by OpenLaw only, that dependency was removed and the spaces are loaded from the
 * ./spaces folder based on the environment: prod or dev.
 * - prod.json contains the spaces that are using in production mode with the moloch addresses from main net.
 * - dev.json contains the spaces that are using in development mode with the moloch addresses from test nets.
 */
const env = process.env.DEV ? 'dev' : 'prod';
const spaces = JSON.parse(
  fs.readFileSync(path.join(__dirname, `./spaces/${env}.json`)).toString()
);
const tokens = Object.entries(spaces)
  .map(space => [getAddress(space[1].token).toLowerCase(), space[0]])
  .reduce((p, c) => {
    p[c[0]] = c[1];
    return p;
  }, {});
console.log(`Spaces: ${JSON.stringify(tokens)}`);

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

router.get('/:space/proposals/:actionId', async (req, res) => {
  const { space, actionId } = req.params;
  console.log('GET /:space/proposals/:actionId', space, actionId);
  getProposalsByAction(space, actionId).then(messages => {
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

router.get('/:space/proposal/:id/votes', async (req, res) => {
  const { space, id } = req.params;
  console.log('GET /:space/proposal/:id/votes', space, id);
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
  const body = req.body;
  const msg = jsonParse(body.msg);
  const ts = (Date.now() / 1e3).toFixed();
  console.log('POST /message ', msg.type);
  // const minBlock = (3600 * 24) / 15;

  if (!body || !body.address || !body.msg || !body.sig)
    return sendError(res, 'wrong message body');

  console.log(msg);

  if (
    //[payload, timestamp, token, space, type,
    // actionId, version, chainId, verifyingContract, spaceHash] == 10
    Object.keys(msg).length !== 10 ||
    !msg.token ||
    !msg.payload ||
    Object.keys(msg.payload).length === 0
  )
    return sendError(res, 'wrong signed message');

  const space = tokens[msg.token];
  if (!space) return sendError(res, 'unknown space');

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

  let isValidSignature = false;
  if (msg.verifyingContract && msg.chainId) {
    isValidSignature = verifySignature(
      msg,
      body.address,
      msg.verifyingContract,
      msg.actionId,
      msg.chainId,
      body.sig
    );
  }

  if (!isValidSignature) return sendError(res, 'wrong signature', 400);

  if (msg.type === 'draft') {
    if (
      //[name, body, choices, metadata, nameHash, bodyHash] == 6
      Object.keys(msg.payload).length !== 6 ||
      !msg.payload.choices ||
      msg.payload.choices.length < 2 ||
      !msg.payload.snapshot ||
      !msg.payload.metadata
    )
      return sendError(res, 'wrong draft format');

    if (
      !msg.payload.name ||
      msg.payload.name.length > 256 ||
      !msg.payload.body ||
      msg.payload.body.length > 4e4
    )
      return sendError(res, 'wrong draft size');

    if (
      typeof msg.payload.metadata !== 'object' ||
      JSON.stringify(msg.payload.metadata).length > 2e4
    )
      return sendError(res, 'wrong draft metadata');
  }

  if (msg.type === 'proposal') {
    if (
      //[name, body, choices, start, end, snapshot, metadata, name, body] == 9
      Object.keys(msg.payload).length !== 9 ||
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
      //[choice, proposal, proposalHash]
      Object.keys(msg.payload).length !== 3 ||
      !msg.payload.proposalIpfsHash ||
      !msg.payload.choice ||
      !msg.payload.metadata
    )
      return sendError(res, 'wrong vote format');

    if (
      typeof msg.payload.metadata !== 'object' ||
      JSON.stringify(msg.payload.metadata).length > 1e4
    )
      return sendError(res, 'wrong vote metadata');

    const proposals = await getProposalsById(
      space,
      msg.payload.proposalIpfsHash
    );
    if (!proposals || proposals.length == 0)
      return sendError(res, 'unknown proposal');

    const payload = jsonParse(proposals[0].payload);
    if (ts > payload.end || payload.start > ts)
      return sendError(res, 'not in voting window');
  }

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
    await storeProposal(
      space,
      msg.token,
      body,
      authorIpfsRes,
      relayerIpfsRes,
      msg.actionId
    );

    /**
     * OpenLaw does not use discord for notifications, so the dependency was disabled for now
     * and the message is just printed out to the server log.
     * Later the discord notification can be enabled again if needed.
     */
    let message = `${space} (${network})\n`;
    message += `**${msg.payload.name}**\n`;
    message += `<https://ipfs.fleek.co/ipfs/${authorIpfsRes}>`;
    console.log(`New proposal: ${message}`);
  }

  if (msg.type === 'vote') {
    await storeVote(
      space,
      msg.token,
      body,
      authorIpfsRes,
      relayerIpfsRes,
      msg.actionId
    );
  }

  console.log(
    `Address "${body.address}"\n`,
    `Token "${msg.token}"\n`,
    `Type "${msg.type}"\n`,
    `IPFS hash "${authorIpfsRes}",\n`,
    `ActionId: ${msg.actionId}`
  );

  return res.json({ ipfsHash: authorIpfsRes });
});

export default router;
