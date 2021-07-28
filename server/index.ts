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
  getMessageERC712Hash,
  MerkleTree,
  buildVoteLeafHashForMerkleTree
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
  getVoteBySender,
  getProposalByDraft,
  getAllProposalsAndVotes,
  getAllDraftsExceptSponsored,
  findVotesForProposals,
  getAllProposalsAndVotesByAction,
  saveOffchainProof,
  getOffchainProof
} from './helpers/adapters/postgres';
import pkg from '../package.json';
/**
 * In order to migrate the data from snapshot-hub service to OpenLaw infra, we expose a new endpoint
 * to trigger the migration process via a PUT call. The migration happens async and gets logged to the server logs.
 */
const network = process.env.NETWORK || 'testnet';

/**
 * If true, the IPFS pinning service will be used to store the message content, and get a pinning hash to
 * save for lookup.
 */
const useIPFSPinnig = process.env.USE_IPFS === 'true';

/**
 * If true, the proposal's voting end time constraint will not be enforced.
 * This allows an external time period to be used (i.e. DAO's on-chain proposal's voting period).
 */
const ignoreVoteEndConstraint: boolean =
  process.env.IGNORE_VOTE_END_CONSTRAINT === 'true';

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
    .then(toProposalWithVotesMessageJson)
    .then(obj => res.json(obj));
});

router.get('/:space/proposal/:id/votes', async (req, res) => {
  const { space, id } = req.params;
  console.log('GET /:space/proposal/:id/votes', space, id);
  getProposalVotes(space, id)
    .then(toVotesMessageJson)
    .then(obj => res.json(obj));
});

router.post('/:space/offchain_proofs', async (req, res) => {
  const space = req.params.space;
  const verifyingContract = req.body.verifyingContract;
  const actionId = req.body.actionId;
  const chainId = req.body.chainId;
  const merkleRoot = req.body.merkleRoot;
  const steps = req.body.steps;

  if (
    !space ||
    !verifyingContract ||
    !actionId ||
    !chainId ||
    !merkleRoot ||
    !steps ||
    steps.length < 1 // must have at least 1 steps
  )
    return res.status(400).send({
      error: 'invalid request parameters'
    });

  const indexes = steps.map(s => s.index).filter(s => s >= 0);
  if (indexes.length !== steps.length) {
    return res.status(400).send({ error: 'invalid merkle root' });
  }

  // the initial index should be always 0
  let current = indexes[0];
  if (current !== 0)
    return res.status(400).send({ error: 'invalid initial index' });

  // each step must have the index provided in an incremental order by 1 unit only
  for (let i = 1; i < indexes.length; i++) {
    // if there's only 1 index, exit before the increment check.
    if (indexes.length === 1) {
      return;
    }

    if (indexes[i] - current !== 1) {
      return res.status(400).send({ error: 'invalid indexes' });
    }

    current = indexes[i];
  }

  const merkleTree = new MerkleTree(
    steps.map(s =>
      buildVoteLeafHashForMerkleTree(s, verifyingContract, actionId, chainId)
    )
  );

  if (merkleTree.getHexRoot() === merkleRoot) {
    try {
      await saveOffchainProof(space, merkleRoot, steps);
      return res.sendStatus(201);
    } catch (error) {
      return res.status(500).send({
        error: 'something went wrong while storing the off-chain proof'
      });
    }
  }

  return res.status(400).send({ error: 'invalid merkle root' });
});

router.get('/:space/offchain_proof/:merkleRoot', async (req, res) => {
  const { space, merkleRoot } = req.params;
  return getOffchainProof(space, merkleRoot)
    .then(p => {
      if (p && p.length === 1) return res.status(200).send(p[0]);
      return res.sendStatus(404);
    })
    .catch(e => {
      console.error(e);
      return res.sendStatus(500);
    });
});

router.post('/message', async (req, res) => {
  const body = req.body;
  const msg = jsonParse(body.msg);
  const erc712Data = jsonParse(body.erc712Data);
  const ts = (Date.now() / 1e3).toFixed();
  console.log('POST /message ', msg.type);
  // const minBlock = (3600 * 24) / 15;

  if (!body || !body.address || !body.msg || !body.sig || !body.erc712Data)
    return sendError(res, 'wrong message body');

  console.log(msg);

  if (
    //[payload, timestamp, token, space, type, version] == 6
    Object.keys(msg).length !== 6 ||
    !msg.token ||
    !msg.payload ||
    Object.keys(msg.payload).length === 0
  )
    return sendError(res, 'wrong `body.msg`');

  console.log('sig data:', erc712Data);

  if (
    //[actionId, chainId, verifyingContract, message] == 4
    Object.keys(erc712Data).length !== 4 ||
    !erc712Data.actionId ||
    !erc712Data.chainId ||
    !erc712Data.verifyingContract ||
    !erc712Data.message ||
    Object.keys(erc712Data.message).length === 0
  )
    return sendError(res, 'wrong erc712Data');

  const space = tokens[msg.token.toLowerCase()];
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
  if (erc712Data.verifyingContract && erc712Data.chainId) {
    isValidSignature = verifySignature(
      { ...erc712Data.message, type: msg.type },
      body.address,
      erc712Data.verifyingContract,
      erc712Data.actionId,
      erc712Data.chainId,
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
      //[choice, metadata, proposalId] == 3
      Object.keys(msg.payload).length !== 3 ||
      !msg.payload.proposalId ||
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
      msg.payload.proposalId,
      msgTypes.PROPOSAL
    );
    if (!proposals || proposals.length == 0)
      return sendError(res, 'unknown proposal');

    const { payload: payloadToParse } = proposals[0];
    const payload = jsonParse(payloadToParse, payloadToParse);

    const isNotInVotingWindow: boolean = ignoreVoteEndConstraint
      ? payload.start > ts
      : ts > payload.end || payload.start > ts;

    if (isNotInVotingWindow) return sendError(res, 'not in voting window');

    const votes = await getVoteBySender(
      space,
      body.address,
      msg.payload.proposalId
    );
    if (votes && votes.length > 0) return sendError(res, 'already voted');
  }

  const authorIpfsRes = useIPFSPinnig
    ? await pinJson(`snapshot/${body.sig}`, {
        address: body.address,
        msg: body.msg,
        sig: body.sig,
        version: '2'
      })
    : '';

  const relayerSig = await relayer.signMessage(authorIpfsRes);
  const relayerIpfsRes = useIPFSPinnig
    ? await pinJson(`snapshot/${relayerSig}`, {
        address: relayer.address,
        msg: authorIpfsRes,
        sig: relayerSig,
        version: '2'
      })
    : '';

  if (msg.type === 'draft') {
    const erc712Hash = getMessageERC712Hash(
      { ...msg, type: msg.type },
      erc712Data.verifyingContract,
      erc712Data.actionId,
      erc712Data.chainId
    );
    await storeDraft(
      space,
      erc712Hash,
      msg.token,
      body,
      authorIpfsRes,
      relayerIpfsRes,
      erc712Data.actionId
    );
    return res.json({
      uniqueId: erc712Hash
    });
  }

  if (msg.type === 'proposal') {
    const erc712Hash = getMessageERC712Hash(
      { ...msg, type: msg.type },
      erc712Data.verifyingContract,
      erc712Data.actionId,
      erc712Data.chainId
    );
    const erc712DraftHash = getDraftERC712Hash(
      { ...msg, type: msg.type },
      erc712Data.verifyingContract,
      erc712Data.actionId,
      erc712Data.chainId
    );

    const sponsorDraftResult = await sponsorDraftIfAny(space, erc712DraftHash);

    const erc712DraftHashToSet =
      sponsorDraftResult.rowCount > 0 ? erc712DraftHash : '';

    await storeProposal(
      space,
      erc712Hash,
      erc712DraftHashToSet,
      msg.token,
      body,
      authorIpfsRes,
      relayerIpfsRes,
      erc712Data.actionId
    );

    return res.json({
      uniqueId: erc712Hash,
      uniqueIdDraft: erc712DraftHashToSet
    });
  }

  if (msg.type === 'vote') {
    const erc712Hash = getMessageERC712Hash(
      { ...msg, type: msg.type },
      erc712Data.verifyingContract,
      erc712Data.actionId,
      erc712Data.chainId
    );
    await storeVote(
      space,
      erc712Hash,
      msg.token,
      body,
      authorIpfsRes,
      relayerIpfsRes,
      erc712Data.actionId
    );

    return res.json({ uniqueId: erc712Hash });
  }

  console.log(
    `Address "${body.address}"\n`,
    `Token "${msg.token}"\n`,
    `Type "${msg.type}"\n`,
    `IPFS hash "${authorIpfsRes}",\n`,
    `ActionId: ${erc712Data.actionId}`
  );
});

export default router;
