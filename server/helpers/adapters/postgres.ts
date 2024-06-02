import db from '../postgres';
import { toVotesMessageJson } from '../utils';
import { EventsDB, EventsRepository } from '../../repositories/events-repository.js';
import { MessagesRepository } from '../../repositories/messages-repository.js';
import { OffchainProofsRepository } from '../../repositories/offchain-proofs-repository.js';

/**
 * Values to insert into the `events` database.
 *
 * [id, event, space, expire]
 */
type EventInsertValuesTuple = [string, string, string, number];

const EVENTS_INSERT_STATEMENT: string =
  'INSERT INTO events (id, event, space, expire) ' +
  'VALUES ($1, $2, $3, $4) ' +
  'ON CONFLICT ON CONSTRAINT events_pkey DO NOTHING';

const format = (
  erc712Hash: string,
  body: any,
  msg: any,
  space: string,
  token: string,
  messageType: string,
  relayerIpfsHash: any,
  actionId: string,
  data: any
) => {
  return [
    erc712Hash,
    body.address,
    msg.version,
    msg.timestamp,
    space,
    token,
    messageType,
    JSON.stringify(msg.payload),
    body.sig,
    JSON.stringify({
      relayerIpfsHash: relayerIpfsHash
    }),
    actionId,
    data
  ];
};

const insert = async (params: Array<object>) => {
  if (params.length < 10) throw Error('Invalid parameters');
  const cmd =
    'INSERT INTO messages (id, address, version, timestamp, space, token, type, payload, sig, metadata, "actionId", data) VALUES ' +
    '($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) ON CONFLICT ON CONSTRAINT messages_pkey DO NOTHING';
  return await db.query(cmd, params);
};

const sponsorDraftIfAny = async (space, erc712DraftHash) => {
  const update = `UPDATE messages SET data=data||'{"sponsored": true}' WHERE type = 'draft' AND id = $1 AND space = $2`;
  const result = await db.query(update, [erc712DraftHash, space]);
  return result;
};

 const storeDraft = async (
  space,
  erc712Hash,
  token,
  body,
  authorIpfsHash,
  relayerIpfsHash,
  actionId
) => {
  return await insert(
    format(
      erc712Hash,
      body,
      JSON.parse(body.msg),
      space,
      token,
      'draft',
      relayerIpfsHash,
      actionId,
      { sponsored: false, authorIpfsHash: authorIpfsHash }
    )
  );
};

const storeProposal = async (
  space,
  erc712Hash,
  erc712DraftHash,
  token,
  body,
  authorIpfsHash,
  relayerIpfsHash,
  actionId
) => {
  return await insert(
    format(
      erc712Hash,
      body,
      JSON.parse(body.msg),
      space,
      token,
      'proposal',
      relayerIpfsHash,
      actionId,
      { authorIpfsHash: authorIpfsHash, erc712DraftHash: erc712DraftHash }
    )
  );
};

const storeVote = async (
  space,
  erc712Hash,
  token,
  body,
  authorIpfsHash,
  relayerIpfsHash,
  actionId
) => {
  return await insert(
    format(
      erc712Hash,
      body,
      JSON.parse(body.msg),
      space,
      token,
      'vote',
      relayerIpfsHash,
      actionId,
      { authorIpfsHash: authorIpfsHash }
    )
  );
};

const getExpiredEvents: (timestamp: number) => Promise<EventsDB[]> = (timestamp) => {
  return db
    .query<EventsDB, [number]>('SELECT * FROM events WHERE expire <= $1', [
      timestamp
    ])
    .then(result => result.rows);
};
const getMessages = async (space: string, msgType: string) => {
  const query = `SELECT * FROM messages WHERE type = $1 AND space = $2 ORDER BY timestamp DESC`;
  const result = await db.query(query, [msgType, space]);
  console.log(result.rows.length);
  return result.rows;
};

const getMessagesByAction = async (
  space: string,
  actionId: string,
  msgType: string
) => {
  const query = `SELECT * FROM messages WHERE type = $1 AND space = $2 AND "actionId" = $3 ORDER BY timestamp DESC`;
  const result = await db.query(query, [msgType, space, actionId]);
  console.log(result.rows.length);
  return result.rows;
};

const getMessagesById = async (
  space: string,
  id: string,
  msgType: string
) => {
  const query = `SELECT * FROM messages WHERE space = $1 AND id = $2 AND type = $3`;
  const result = await db.query(query, [space, id, msgType]);
  console.log(result.rows.length);
  return result.rows;
};

const getVoteBySender = async (
  space: string,
  address: string,
  proposalId: string
) => {
  console.log([space, address, proposalId]);
  const query = `SELECT * FROM messages WHERE space = $1 AND address = $2 AND payload ->> 'proposalId' = $3 AND type = 'vote'`;
  const result = await db.query(query, [space, address, proposalId]);
  console.log(result.rows.length);
  return result.rows;
};

const getProposalByDraft = async (space: string, id: string) => {
  const query = `SELECT * FROM messages WHERE space = $1 AND type = 'proposal' AND data ->> 'erc712DraftHash' = $2`;
  const result = await db.query(query, [space, id]);
  console.log(result.rows.length);
  return result.rows;
};

const getProposalVotes = async (space: string, id: string) => {
  const query = `SELECT * FROM messages WHERE type = 'vote' AND space = $1 AND payload ->> 'proposalId' = $2 ORDER BY timestamp ASC`;
  const result = await db.query(query, [space, id]);
  console.log(result.rows.length);
  return result.rows;
};

const findVotesForProposals = (space, proposals) =>
  Promise.all(
    proposals.map(p =>
      getProposalVotes(space, p.id)
        .then(votes =>
          votes && votes.length > 0 ? toVotesMessageJson(votes) : []
        )
        .then(votes => {
          p['votes'] = votes;
          return p;
        })
    )
  );

const getAllProposalsAndVotes = async (space: string) => {
  const queryProposals = `SELECT * FROM messages WHERE type = 'proposal' AND space = $1`;
  const proposalsResult = await db.query(queryProposals, [space]);
  console.log(proposalsResult.rows.length);
  return await findVotesForProposals(space, proposalsResult.rows);
};

const getAllProposalsAndVotesByAction = async (
  space: string,
  actionId: string
) => {
  const queryProposals = `SELECT * FROM messages WHERE type = 'proposal' AND space = $1 AND "actionId" = $2 ORDER BY timestamp DESC`;
  const proposalsResult = await db.query(queryProposals, [space, actionId]);
  console.log(proposalsResult.rows.length);
  return await findVotesForProposals(space, proposalsResult.rows);
};

const getAllDraftsExceptSponsored = async (space: string) => {
  const query = `SELECT * FROM messages WHERE type = 'draft' AND space = $1 AND data ->> 'sponsored' = 'false' ORDER BY timestamp ASC`;
  const result = await db.query(query, [space]);
  console.log(result.rows.length);
  return result.rows;
};

const saveOffchainProof = async (
  space: string,
  merkleRoot: string,
  steps: Record<string, any>[]
) => {
  const insert = `INSERT INTO offchain_proofs (merkle_root, space, steps) VALUES ($1, $2, $3);`;
  const result = await db.query(insert, [
    merkleRoot,
    space,
    JSON.stringify(steps)
  ]);
  console.log(result.rows.length);
  return result.rows;
};

const getOffchainProof = async (space: string, merkleRoot: string) => {
  const select = `SELECT * FROM offchain_proofs WHERE space = $1 AND merkle_root = $2 LIMIT 1;`;
  const result = await db.query(select, [space, merkleRoot]);
  console.log(result.rows.length);
  return result.rows;
};

const deleteProcessedEvent = (event: EventsDB) => {
  return db.query<any, [string, string]>(
    'DELETE FROM events WHERE id = $1 AND event = $2',
    [event.id, event.event]
  );
}

function insertCreatedProposal(
  EVENT_ID: string,
  space: string,
  timestamp: number
) {
  return db.query<any, EventInsertValuesTuple>(EVENTS_INSERT_STATEMENT, [
    EVENT_ID,
    'proposal/created',
    space,
    timestamp
  ]);
}
function insertStartedProposal(
  EVENT_ID: string,
  space: string,
  timestamp: number
) {
  return db.query<any, EventInsertValuesTuple>(EVENTS_INSERT_STATEMENT, [
    EVENT_ID,
    'proposal/start',
    space,
    timestamp
  ]);
}
function insertProposalEnd(
  EVENT_ID: string,
  space: string,
  timestamp: number
) {
  return db.query<any, EventInsertValuesTuple>(EVENTS_INSERT_STATEMENT, [
    EVENT_ID,
    'proposal/end',
    space,
    timestamp
  ]);
}
export const postgresEventsRepository: EventsRepository = {
  deleteProcessedEvent,
  getExpiredEvents,
  insertCreatedProposal,
  insertStartedProposal,
  insertProposalEnd
};
export const postgresMessagesRepository: MessagesRepository = {
  getAllDraftsExceptSponsored,
  getAllProposalsAndVotes,
  getAllProposalsAndVotesByAction,
  getMessages,
  getMessagesByAction,
  getMessagesById,
  getVoteBySender,
  getProposalByDraft,
  getProposalVotes,
  storeDraft,
  storeProposal,
  storeVote,
  sponsorDraftIfAny,
  findVotesForProposals
};
export const postgresOffchainProofsRepository: OffchainProofsRepository = {
  getOffchainProof,
  saveOffchainProof
}
