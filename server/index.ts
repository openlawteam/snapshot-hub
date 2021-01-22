import express from 'express';
import relayer from './helpers/relayer';
import path from 'path';
import fs from 'fs';
import { pinJson } from './helpers/ipfs';
import { getAddress } from '@ethersproject/address';
import {
  jsonParse,
  sendError,
  toMessageJson,
  toProposalWithVotesMessageJson,
  toVotesMessageJson
} from './helpers/utils';
import {
  verifySignature,
  getDraftERC712Hash,
  getMessageERC712Hash
} from '@openlaw/snapshot-js-erc712';
/**
 * OpenLaw uses Postgres to store the proposals and votes, so a new adapter was created to
 * connect to Postgres DB. The Queries and Inserts were moved to the adapter file: postgres.ts, mainly because the syntax
 * is a bit different for each database.
 */
import {
  storeDraft,
  storeProposal,
  storeVote,
  sponsorDraftIfAny,
  getMessages,
  getMessagesById,
  getMessagesByAction,
  getProposalVotes,
  getProposalByDraft,
  getAllProposalsAndVotes,
  getAllDraftsExceptSponsored,
  findVotesForProposals,
  getAllProposalsAndVotesByAction
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
const env = process.env.ENV;
if (!env)
  throw Error('Missing env var [ENV], possible values: local, dev, prod');

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

const msgTypes = {
  DRAFT: 'draft',
  PROPOSAL: 'proposal',
  VOTE: 'vote'
};

const apiStatus = (req, res) =>
  res.json({
    name: pkg.name,
    network,
    version: pkg.version,
    tag: 'alpha',
    relayer: relayer.address
  });

router.get('/', (req, res) => {
  console.log('GET /api');
  return apiStatus(req, res);
});

router.get('/spaces/:key?', (req, res) => {
  const { key } = req.params;
  console.log('GET /spaces/:key', key);
  return res.json(key ? spaces[key] : spaces);
});

router.get('/:space/drafts', async (req, res) => {
  const { space } = req.params;
  console.log('GET /:space/drafts', space);
  getAllDraftsExceptSponsored(space)
    .then(toMessageJson)
    .then(obj => res.json(obj));
});

router.get('/:space/drafts/:actionId', async (req, res) => {
  const { space, actionId } = req.params;
  console.log('GET /:space/drafts/:actionId', space, actionId);
  getMessagesByAction(space, actionId, msgTypes.DRAFT)
    .then(toMessageJson)
    .then(obj => res.json(obj));
});

router.get('/:space/draft/:id', async (req, res) => {
  const { space, id } = req.params;
  console.log('GET /:space/drafts/:id', space, id);
  getMessagesById(space, id, msgTypes.DRAFT)
    .then(toMessageJson)
    .then(obj => res.json(obj));
});

router.get('/:space/proposals', async (req, res) => {
  const { space } = req.params;
  const includeVotes = req.query.includeVotes;
  console.log('GET /:space/proposals?includeVotes', space, includeVotes);

  const resultsPromise = includeVotes
    ? getAllProposalsAndVotes(space).then(toProposalWithVotesMessageJson)
    : getMessages(space, msgTypes.PROPOSAL).then(toMessageJson);

  resultsPromise.then(obj => res.json(obj));
});

router.get('/:space/proposals/:actionId', async (req, res) => {
  const includeVotes = req.query.includeVotes;
  const { space, actionId } = req.params;
  console.log(
    'GET /:space/proposals/:actionId?includeVotes',
    space,
    actionId,
    includeVotes
  );

  const resultsPromise = includeVotes
    ? getAllProposalsAndVotesByAction(space, actionId).then(
        toProposalWithVotesMessageJson
      )
    : getMessagesByAction(space, actionId, msgTypes.PROPOSAL).then(
        toMessageJson
      );

  resultsPromise.then(obj => res.json(obj));
});

router.get('/:space/proposal/:id', async (req, res) => {
  const { space, id } = req.params;
  const searchUniqueDraftId = req.query.searchUniqueDraftId;
  const includeVotes = req.query.includeVotes;

  console.log(
    `GET /${space}/proposal/:id? searchUniqueDraftId=${searchUniqueDraftId} &  includeVotes=${includeVotes}`
  );

  const resultsPromise = searchUniqueDraftId
    ? getProposalByDraft(space, id).then(results => {
        if (results && results.length > 0) return results;
        else return getMessagesById(space, id, msgTypes.PROPOSAL);
      })
    : getMessagesById(space, id, msgTypes.PROPOSAL);

  resultsPromise
    .then(proposals =>
      includeVotes ? findVotesForProposals(space, proposals) : proposals
    )
    .then(obj => res.json(obj));
});

router.get('/:space/proposal/:id/votes', async (req, res) => {
  const { space, id } = req.params;
  console.log('GET /:space/proposal/:id/votes', space, id);
  getProposalVotes(space, id)
    .then(toVotesMessageJson)
    .then(obj => res.json(obj));
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
    //[payload, timestamp, token, space, type, actionId,
    // version, chainId, verifyingContract] == 9
    Object.keys(msg).length !== 9 ||
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

  if (
    !msg.type ||
    !Object.keys(msgTypes)
      .map(k => msgTypes[k])
      .includes(msg.type)
  )
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
      //[name, body, choices, metadata] == 4
      Object.keys(msg.payload).length !== 4 ||
      !msg.payload.choices ||
      msg.payload.choices.length < 2 ||
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
      //[name, body, choices, start, end, snapshot, metadata] == 7
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
      //[choice, metadata, proposalHash] == 3
      Object.keys(msg.payload).length !== 3 ||
      !msg.payload.proposalHash ||
      !msg.payload.choice ||
      !msg.payload.metadata
    )
      return sendError(res, 'wrong vote format');

    if (
      typeof msg.payload.metadata !== 'object' ||
      JSON.stringify(msg.payload.metadata).length > 1e4
    )
      return sendError(res, 'wrong vote metadata');

    const proposals = await getMessagesById(
      space,
      msg.payload.proposalHash,
      msgTypes.PROPOSAL
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

  if (msg.type === 'draft') {
    const erc712Hash = getMessageERC712Hash(
      msg,
      msg.verifyingContract,
      msg.actionId,
      msg.chainId
    );
    await storeDraft(
      space,
      erc712Hash,
      msg.token,
      body,
      authorIpfsRes,
      relayerIpfsRes,
      msg.actionId
    );
    return res.json({
      uniqueId: erc712Hash
    });
  }

  if (msg.type === 'proposal') {
    const erc712Hash = getMessageERC712Hash(
      msg,
      msg.verifyingContract,
      msg.actionId,
      msg.chainId
    );
    const erc712DraftHash = getDraftERC712Hash(
      msg,
      msg.verifyingContract,
      msg.actionId,
      msg.chainId
    );
    await storeProposal(
      space,
      erc712Hash,
      erc712DraftHash,
      msg.token,
      body,
      authorIpfsRes,
      relayerIpfsRes,
      msg.actionId
    );

    await sponsorDraftIfAny(space, erc712DraftHash);

    return res.json({
      uniqueId: erc712Hash,
      uniqueIdDraft: erc712DraftHash
    });
  }

  if (msg.type === 'vote') {
    const erc712Hash = getMessageERC712Hash(
      msg,
      msg.verifyingContract,
      msg.actionId,
      msg.chainId
    );
    await storeVote(
      space,
      erc712Hash,
      msg.token,
      body,
      authorIpfsRes,
      relayerIpfsRes,
      msg.actionId
    );

    return res.json({ uniqueId: erc712Hash });
  }

  console.log(
    `Address "${body.address}"\n`,
    `Token "${msg.token}"\n`,
    `Type "${msg.type}"\n`,
    `IPFS hash "${authorIpfsRes}",\n`,
    `ActionId: ${msg.actionId}`
  );
});

export default router;
