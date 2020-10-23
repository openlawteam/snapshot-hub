import db from '../postgres';

function format(
  authorIpfsHash: string,
  body: any,
  msg: any,
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
    token, // using token as default value for "space" column
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

export async function storeProposals(proposals) {
  return await Promise.all(
    proposals.map(p =>
      insert(
        format(
          p.authorIpfsHash,
          p,
          p.msg,
          p.msg.token,
          p.msg.type,
          p.relayerIpfsHash,
          p.deprecated
        )
      )
    )
  );
}

export async function storeVotes(votes) {
  return await Promise.all(
    votes.map(v =>
      insert(
        format(
          v.authorIpfsHash,
          v,
          v.msg,
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
      token,
      'proposal',
      relayerIpfsHash,
      {}
    )
  );
}

export async function storeVote(token, body, authorIpfsHash, relayerIpfsHash) {
  return await insert(
    format(
      authorIpfsHash,
      body,
      JSON.parse(body.msg),
      token,
      'vote',
      relayerIpfsHash,
      {}
    )
  );
}

export async function getProposals(token: string) {
  const query =
    "SELECT * FROM messages WHERE type = 'proposal' AND token = $1 ORDER BY timestamp DESC";
  const result = await db.query(query, [token]);
  console.log(result.rows.length);
  return result.rows;
}

export async function getProposalsBy(token: string, id: string) {
  const query = `SELECT * FROM messages WHERE token = $1 AND id = $2 AND type = 'proposal'`;
  const result = await db.query(query, [token, id]);
  console.log(result.rows.length);
  return result.rows;
}

export async function getProposalVotes(token: string, id: string) {
  const query = `SELECT * FROM messages WHERE type = 'vote' AND token = $1 AND payload ->> 'proposal' = $2 ORDER BY timestamp ASC`;
  const result = await db.query(query, [token, id]);
  console.log(result.rows.length);
  return result.rows;
}
