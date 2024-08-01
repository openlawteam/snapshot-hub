import fetch from 'node-fetch';

export async function getProposalStatus(id: string, space: string) {
  const devUrl = 'https://develop.thelao.io/api/v1/governance/proposal-status';
  const prodUrl = 'https://thelao.io/api/v1/governance/proposal-status';

  const env = process.env.ENV;
  const endpoint = env === 'prod' ? prodUrl : devUrl;

  try {
    const proposalStatus = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify([{ id, space }]),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!proposalStatus.ok) {
      throw new Error(
        `Something went wrong while fetching the proposals status for ${id} ${space}`
      );
    }

    return await proposalStatus.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}
