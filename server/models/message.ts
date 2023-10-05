export type Message = {
  id: string;
  address: string;
  version: string;
  timestamp: number;
  space?: string;
  token?: string;
  type: string;
  payload?: string;
  sig: string;
  metadata?: string;
  actionId: string;
  data?: string;
};
