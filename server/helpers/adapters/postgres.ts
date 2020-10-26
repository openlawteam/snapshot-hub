import db from '../postgres';

function format(
  authorIpfsHash: string,
  body: any,
  msg: any,
  space: string,
  token: string,
  messageType: string,
  relayerIpfsHash: any,
  deprecated: any
) {
  return [
    authorIpfsHash,
    body.address,
    msg.version,
    msg.timestamp,
    space,
    token,
    messageType,
    JSON.stringify(msg.payload),
    body.sig,
    JSON.stringify({
      relayer_ipfs_hash: relayerIpfsHash
    }),
    JSON.stringify(deprecated)
  ];
}

async function insert(params: Array<object>) {
  if (params.length < 10) throw Error('Invalid parameters');
  const cmd =
    'INSERT INTO messages (id, address, version, timestamp, space, token, type, payload, sig, metadata, deprecated) VALUES ' +
    '($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT ON CONSTRAINT messages_pkey DO NOTHING';
  return await db.query(cmd, params);
}

export async function storeProposals(space, proposals) {
  return await Promise.all(
    proposals.map(p =>
      insert(
        format(
          p.authorIpfsHash,
          p,
          p.msg,
          space,
          p.msg.token,
          p.msg.type,
          p.relayerIpfsHash,
          p.deprecated
        )
      )
    )
  );
}

export async function storeVotes(space, votes) {
  return await Promise.all(
    votes.map(v =>
      insert(
        format(
          v.authorIpfsHash,
          v,
          v.msg,
          space,
          v.msg.token,
          'vote',
          v.relayerIpfsHash,
          v.deprecated
        )
      )
    )
  );
}

export async function storeProposal(
  space,
  token,
  body,
  authorIpfsHash,
  relayerIpfsHash
) {
  return await insert(
    format(
      authorIpfsHash,
      body,
      JSON.parse(body.msg),
      space,
      token,
      'proposal',
      relayerIpfsHash,
      {}
    )
  );
}

export async function storeVote(space, token, body, authorIpfsHash, relayerIpfsHash) {
  return await insert(
    format(
      authorIpfsHash,
      body,
      JSON.parse(body.msg),
      space,
      token,
      'vote',
      relayerIpfsHash,
      {}
    )
  );
}

export async function getProposals(space: string) {
  const query =
    "SELECT * FROM messages WHERE type = 'proposal' AND space = $1 ORDER BY timestamp DESC";
  const result = await db.query(query, [space]);
  console.log(result.rows.length);
  return result.rows;
}

export async function getProposalsBy(space: string, id: string) {
  const query = `SELECT * FROM messages WHERE space = $1 AND id = $2 AND type = 'proposal'`;
  const result = await db.query(query, [space, id]);
  console.log(result.rows.length);
  return result.rows;
}

export async function getProposalVotes(space: string, id: string) {
  const query = `SELECT * FROM messages WHERE type = 'vote' AND space = $1 AND payload ->> 'proposal' = $2 ORDER BY timestamp ASC`;
  const result = await db.query(query, [space, id]);
  console.log(result.rows.length);
  return result.rows;
}
