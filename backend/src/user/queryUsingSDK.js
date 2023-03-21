const {Crypto, Universal, Node, MemoryAccount} = require('@aeternity/aepp-sdk');

const url = 'https://testnet.aeternity.io/';

class QueryUsingSDK {

  initClient = async () => {
    // process.env['SECRET_KEY'] = 'd907e6e4919908349d62a2f62b20eab1d15ee8996dd8bd1daa352f8f77c7c7a41184ec39960829f23fab331fde26a74dc1ed6a1ad470912fd5ead26f45557dc1';
    // if (!process.env.SECRET_KEY) throw "SECRET_KEY not defined";
    const secretKey = '177a354bbd05d403485a9062524da7d41532546168bd4270b48527c59b9526c0c9366503150afa0eb5ace5e12d5e11c6e0e92fe17473c034fdfebf64546b50dc';
    if (!this.client) {
      this.client = await Universal({
        nodes: [
          {
            name: 'node',
            instance: await Node({
              url: process.env.NODE_URL || url,
            }),
          }],
        accounts: [MemoryAccount({keypair: {publicKey: Crypto.getAddressFromPriv(secretKey), secretKey: secretKey}})],
      });
    }
  };

  initOracle = async () => {
    let oracleId = 'ok_2XchkwHMs1eRZYu1XmuYamrncZPUthn11kfQLgGbp34LXFiZrn'
    if (!this.oracle) this.oracle = await this.client.getOracleObject(oracleId);
    console.log("initialized oracle:", this.oracle.id);
  }

  queryAePrice = async (currency) => {
    if (!this.oracle) throw "Oracle not initialized";
    const query = await this.oracle.postQuery(currency, {
      queryFee: this.oracle.queryFee,
      // optionally specify ttl
      // queryTtl: {type: 'delta', value: 20},
      // responseTtl: {type: 'delta', value: 20},
    });

    console.log(`queried for '${currency}' with query id: ${query.id}`);
    return query;
  }

  pollForResponse = async (query) => {
    const response = await query.pollForResponse();
    console.log("got response:", response);
    let queryRes = String(Crypto.decodeBase64Check(response.response.slice(3)));
    console.log('queryRes');
    console.log(queryRes);
    let bf = response.decode();
    // console.log(bf.toString());
    console.log("got decode:", bf.toString());
  }

  checkQuery = async (query) => {
    if (!this.oracle) throw "Oracle not initialized";
    const res = await this.checkQuery(query);
    console.log(res);
    return res;
  }
}

const runExample = async () => {
  const example = new QueryUsingSDK();
  await example.initClient();
  await example.initOracle();

  const query = await example.queryAePrice("solana")
  console.log(query);
  await example.pollForResponse(query)
  // console.log(example);
  // let res = await example.checkQuery(query);
  // console.log(res);
}

runExample();
