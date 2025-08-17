import { handleNFT } from '../../src/routes/nft.js';

export default {
  async fetch(request, env, ctx) {
    return await handleNFT(request, env, ctx);
  }
};