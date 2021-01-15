import db from '../postgres';

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

export const sponsorDraftIfAny = async (space, erc712DraftHash) => {
  const update = `UPDATE messages SET data=data||'{"sponsored": true}' WHERE type = 'draft' AND id = $1 AND space = $2`;
  const result = await db.query(update, [erc712DraftHash, space]);
  console.log(result.rows.length);
  return result.rows;
};

export const storeDraft = async (
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

export const storeProposal = async (
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

export const storeVote = async (
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

export const getMessages = async (space: string, msgType: string) => {
  const query = `SELECT * FROM messages WHERE type = $1 AND space = $2 ORDER BY timestamp DESC`;
  const result = await db.query(query, [msgType, space]);
  console.log(result.rows.length);
  return result.rows;
};

export const getMessagesByAction = async (
  space: string,
  actionId: string,
  msgType: string
) => {
  const query = `SELECT * FROM messages WHERE type = $1 AND space = $2 AND "actionId" = $3 ORDER BY timestamp DESC`;
  const result = await db.query(query, [msgType, space, actionId]);
  console.log(result.rows.length);
  return result.rows;
};

export const getMessagesById = async (
  space: string,
  id: string,
  msgType: string
) => {
  const query = `SELECT * FROM messages WHERE space = $1 AND id = $2 AND type = $3`;
  const result = await db.query(query, [space, id, msgType]);
  console.log(result.rows.length);
  return result.rows;
};

export const getProposalVotes = async (space: string, id: string) => {
  const query = `SELECT * FROM messages WHERE type = 'vote' AND space = $1 AND payload ->> 'proposalHash' = $2 ORDER BY timestamp ASC`;
  const result = await db.query(query, [space, id]);
  console.log(result.rows.length);
  return result.rows;
};

export const getAllDraftsExceptSponsored = async (space: string) => {
  const query = `SELECT * FROM messages WHERE type = 'draft' AND space = $1 AND data ->> 'sponsored' = 'false' ORDER BY timestamp ASC`;
  const result = await db.query(query, [space]);
  console.log(result.rows.length);
  return result.rows;
};
