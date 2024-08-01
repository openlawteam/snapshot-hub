import axios, { AxiosError } from 'axios/dist/node/axios.cjs';

export async function getProposalStatus(id: string, space: string) {
  const urls = {
    dev: 'https://develop.thelao.io/api/v1/governance/proposal-status',
    prod: 'https://thelao.io/api/v1/governance/proposal-status'
  };

  const endpoint = urls[process.env.ENV || 'dev'];

  try {
    const response = await axios.post(endpoint, [{ id, space }], {
      headers: {
        'Content-Type': 'application/json',
        'x-snapshot-hub-verify': process.env.WEBHOOK_VERIFY
      }
    });

    if (response.status !== 200) {
      throw new Error(
        `Something went wrong while fetching the proposals status for ${id} ${space}`
      );
    }

    return response.data;
  } catch (error) {
    const BASE_ERROR = `Failed to fetch proposal status for ${id} in ${space}`;

    if (error instanceof AxiosError) {
      console.error(
        BASE_ERROR,
        error.response ? error.response.data : error.toJSON()
      );
    } else {
      console.error(BASE_ERROR, error);
    }

    return [];
  }
}
