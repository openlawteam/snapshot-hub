import db from '../postgres';

function format(
  erc712Hash: string,
  body: any,
  msg: any,
  space: string,
  token: string,
  messageType: string,
  relayerIpfsHash: any,
  actionId: string,
  data: any
) {
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
}

async function insert(params: Array<object>) {
  if (params.length < 10) throw Error('Invalid parameters');
  const cmd =
    'INSERT INTO messages (id, address, version, timestamp, space, token, type, payload, sig, metadata, "actionId", data) VALUES ' +
    '($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) ON CONFLICT ON CONSTRAINT messages_pkey DO NOTHING';
  return await db.query(cmd, params);
}

export async function storeDraft(
  space,
  erc712Hash,
  token,
  body,
  authorIpfsHash,
  relayerIpfsHash,
  actionId
) {
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
}

export async function storeProposal(
  space,
  erc712Hash,
  erc712DraftHash,
  token,
  body,
  authorIpfsHash,
  relayerIpfsHash,
  actionId
) {
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
}

export async function storeVote(
  space,
  erc712Hash,
  token,
  body,
  authorIpfsHash,
  relayerIpfsHash,
  actionId
) {
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
}

export async function getMessages(space: string, msgType: string) {
  const query = `SELECT * FROM messages WHERE type = $1 AND space = $2 ORDER BY timestamp DESC`;
  const result = await db.query(query, [msgType, space]);
  console.log(result.rows.length);
  return result.rows;
}

export async function getMessagesByAction(
  space: string,
  actionId: string,
  msgType: string
) {
  const query = `SELECT * FROM messages WHERE type = $1 AND space = $2 AND "actionId" = $3 ORDER BY timestamp DESC`;
  const result = await db.query(query, [msgType, space, actionId]);
  console.log(result.rows.length);
  return result.rows;
}

export async function getMessagesById(
  space: string,
  id: string,
  msgType: string
) {
  const query = `SELECT * FROM messages WHERE space = $1 AND id = $2 AND type = $3`;
  const result = await db.query(query, [space, id, msgType]);
  console.log(result.rows.length);
  return result.rows;
}

export async function getProposalVotes(space: string, id: string) {
  const query = `SELECT * FROM messages WHERE type = 'vote' AND space = $1 AND payload ->> 'proposalHash' = $2 ORDER BY timestamp ASC`;
  const result = await db.query(query, [space, id]);
  console.log(result.rows.length);
  return result.rows;
}
