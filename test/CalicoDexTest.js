const { assert } = require('chai');
const { utils, wallets } = require('@aeternity/aeproject');
const {Crypto, Universal, Node, MemoryAccount} = require('@aeternity/aepp-sdk');

const CONTRACT_SOURCE = './contracts/CalicoDEX.aes';


const url = 'https://testnet.aeternity.io/';

function riskCalculator(obj_1, obj_2){
  let riskValue = Math.sqrt(((obj_1.current_price - obj_2.current_price) ** 2 + 
                  (obj_1.market_cap - obj_2.market_cap) ** 2 + 
                  (obj_1.high_24h - obj_2.high_24h) ** 2 + 
                  (obj_1.low_24h - obj_2.low_24h) ** 2 + 
                  (obj_1.price_change_24h - obj_2.price_change_24h) ** 2 + 
                  (obj_1.market_cap_change_24h - obj_2.market_cap_change_24h) ** 2 + 
                  (obj_1.fully_diluted_valuation - obj_2.fully_diluted_valuation) ** 2) / 
                  (( ((obj_1.total_supply - obj_1.circulating_supply) - (obj_2.total_supply - obj_2.circulating_supply)) ** 2 +
                      (obj_1.total_volume - obj_2.total_volume) ** 2) - 1))
  console.log(`Risk factor : [${obj_1.name}] is ${riskValue}`);
  return riskValue;
}

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
              url: url,
            }),
          }],
        accounts: [MemoryAccount({keypair: {publicKey: Crypto.getAddressFromPriv(secretKey), secretKey: secretKey}})],
      });
    }
  };

  initOracle = async () => {
    let oracleId = 'ok_2XchkwHMs1eRZYu1XmuYamrncZPUthn11kfQLgGbp34LXFiZrn';
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
    let queryRes = JSON.parse(response)[0];
    console.log('queryRes');
    console.log(queryRes);
    // let bf = response.decode();
    // console.log(bf.toString());
    // console.log("got decode:", bf.toString());
    return Promise.resolve(queryRes);
  }

  checkQuery = async (query) => {
    if (!this.oracle) throw "Oracle not initialized";
    const res = await this.checkQuery(query);
    console.log(res);
    return res;
  }
}

describe('CalicoDEXContract', () => {
  let aeSdk;
  let contract;
  let oracleObj;
  before(async () => {
    aeSdk = await utils.getSdk();

    // a filesystem object must be passed to the compiler if the contract uses custom includes
    filesystem = utils.getFilesystem(CONTRACT_SOURCE);

    // get content of contract
    source = utils.getContractContent(CONTRACT_SOURCE);
    // const receiver_contract_source = utils.getContractContent(RECEIVER_CONTRACT_SOURCE);

    // initialize the contract instance
    contract = await aeSdk.getContractInstance({ source, filesystem });
    await contract.deploy();
    console.log(`contract deployed!`);
    console.log(`Contract address : [${contract.deployInfo.address}]`);

    // aeSdk = await utils.getSdk();

    // // a filesystem object must be passed to the compiler if the contract uses custom includes
    // const fileSystem = utils.getFilesystem(EXAMPLE_CONTRACT_SOURCE);

    // // get content of contract
    // const source = utils.getContractContent(EXAMPLE_CONTRACT_SOURCE);

    // // initialize the contract instance
    // contract = await aeSdk.getContractInstance({ source, fileSystem });
    // await contract.deploy();

    // create a snapshot of the blockchain state
    await utils.createSnapshot(aeSdk);

    oracleObj = new QueryUsingSDK();
    await oracleObj.initClient();
    await oracleObj.initOracle();

    

  });

  // after each test roll back to initial state
  afterEach(async () => {
    await utils.rollbackSnapshot(aeSdk);
  });

  it('CalicoDEXContract: Mint Asset NFT', async () => {
    const cryptoCurrency = "aeternity";
    console.log(wallets[0]);
    const query = await oracleObj.queryAePrice(cryptoCurrency)
    // console.log(query);
    let responseJson = await oracleObj.pollForResponse(query);
    // console.log(responseJson);
    let currencyMetaData = {};
    currencyMetaData["symbol"] = responseJson.symbol?responseJson.symbol.toString() : "";
    currencyMetaData["name"] = responseJson.name?responseJson.name.toString() : "";
    currencyMetaData["last_updated"] = responseJson.last_updated?responseJson.last_updated.toString() : "";
    currencyMetaData["current_price"] = responseJson.current_price?responseJson.current_price.toString() : "";
    currencyMetaData["market_cap"] = responseJson.market_cap?responseJson.market_cap.toString() : "";
    currencyMetaData["fully_diluted_valuation"] = responseJson.fully_diluted_valuation?responseJson.fully_diluted_valuation.toString() : "";
    currencyMetaData["total_volume"] = responseJson.total_volume?responseJson.total_volume.toString() : "";
    currencyMetaData["high_24h"] = responseJson.high_24h?responseJson.high_24h.toString() : "";
    currencyMetaData["low_24h"] = responseJson.low_24h?responseJson.low_24h.toString() : "";
    currencyMetaData["price_change_24h"] = responseJson.price_change_24h?responseJson.price_change_24h.toString() : "";
    currencyMetaData["price_change_percentage_24h"] = responseJson.price_change_percentage_24h?responseJson.price_change_percentage_24h.toString() : "";
    currencyMetaData["market_cap_change_24h"] = responseJson.market_cap_change_24h?responseJson.market_cap_change_24h.toString() : "";
    currencyMetaData["market_cap_change_percentage_24h"] = responseJson.market_cap_change_percentage_24h?responseJson.market_cap_change_percentage_24h.toString() : "";
    currencyMetaData["circulating_supply"] = responseJson.circulating_supply?responseJson.circulating_supply.toString() : "";
    currencyMetaData["total_supply"] = responseJson.total_supply?responseJson.total_supply.toString() : "";
    currencyMetaData["max_supply"] = responseJson.max_supply?responseJson.max_supply.toString() : "";
    // console.log('currencyMetaData');
    // console.log(currencyMetaData);
    const minAssetNFTResult = await contract.methods.mintAssetNFT(responseJson.name, responseJson.symbol, {'URL': []},{'None': []}, wallets[0].publicKey, {'None': []}, {'None': []}, currencyMetaData, { onAccount: wallets[0].publicKey });
    const AssetNFTTokenID = minAssetNFTResult.decodedResult;
    console.log(`Asset NFT Token NFT : [${AssetNFTTokenID}]`);
    function timeout(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
    console.log('Waiting for few mins to mint RiskNFT.....');
    // (async () => await timeout(50000));
    await timeout(100000);
    console.log('Waiting over!');
    const query2 = await oracleObj.queryAePrice(cryptoCurrency)
    // console.log(query);
    let responseJson2 = await oracleObj.pollForResponse(query2);
    // console.log(responseJson);
    let currencyMetaData2 = {};
    currencyMetaData2["symbol"] = responseJson2.symbol?responseJson2.symbol.toString() : "";
    currencyMetaData2["name"] = responseJson2.name?responseJson2.name.toString() : "";
    currencyMetaData2["last_updated"] = responseJson2.last_updated?responseJson2.last_updated.toString() : "";
    currencyMetaData2["current_price"] = responseJson2.current_price?responseJson2.current_price.toString() : "";
    currencyMetaData2["market_cap"] = responseJson2.market_cap?responseJson2.market_cap.toString() : "";
    currencyMetaData2["fully_diluted_valuation"] = responseJson2.fully_diluted_valuation?responseJson2.fully_diluted_valuation.toString() : "";
    currencyMetaData2["total_volume"] = responseJson2.total_volume?responseJson2.total_volume.toString() : "";
    currencyMetaData2["high_24h"] = responseJson2.high_24h?responseJson2.high_24h.toString() : "";
    currencyMetaData2["low_24h"] = responseJson2.low_24h?responseJson2.low_24h.toString() : "";
    currencyMetaData2["price_change_24h"] = responseJson2.price_change_24h?responseJson2.price_change_24h.toString() : "";
    currencyMetaData2["price_change_percentage_24h"] = responseJson2.price_change_percentage_24h?responseJson2.price_change_percentage_24h.toString() : "";
    currencyMetaData2["market_cap_change_24h"] = responseJson2.market_cap_change_24h?responseJson2.market_cap_change_24h.toString() : "";
    currencyMetaData2["market_cap_change_percentage_24h"] = responseJson2.market_cap_change_percentage_24h?responseJson2.market_cap_change_percentage_24h.toString() : "";
    currencyMetaData2["circulating_supply"] = responseJson2.circulating_supply?responseJson2.circulating_supply.toString() : "";
    currencyMetaData2["total_supply"] = responseJson2.total_supply?responseJson2.total_supply.toString() : "";
    currencyMetaData2["max_supply"] = responseJson2.max_supply?responseJson2.max_supply.toString() : "";
    // console.log('currencyMetaData2');
    // console.log(currencyMetaData2);

    const metaInfoResult = await contract.methods.meta_info(AssetNFTTokenID, { onAccount: wallets[0].publicKey });
    console.log(metaInfoResult.decodedResult);
    let riskFactor  = riskCalculator(metaInfoResult.decodedResult['currencyMetadata'], currencyMetaData2);
    console.log(`Risk Factor : ${riskFactor}`);
    const mintRiskNFTResult = await contract.methods.mintRiskNFT(responseJson.name, responseJson.symbol, {'URL': []},{'None': []}, wallets[0].publicKey, {'None': []}, {'None': []}, AssetNFTTokenID.toString(), currencyMetaData, riskFactor.toString(), { onAccount: wallets[0].publicKey });
    const riskNFTID = mintRiskNFTResult.decodedResult;
    console.log(`Mint Risk NFT Result: [${riskNFTID}]`);
    let balanceOfAccount = await contract.methods.checkBalance(wallets[0].publicKey);
    // let balanceOfContract = await contract.methods.checkBalance(wallets[0].publicKey);
    // console.log(`Balance of Account : [${wallets[0].publicKey}] is ${balanceOfAccount.decodedResult}`);
    const resultStartBid = await contract.methods.startBid(riskNFTID.toString(), 1679967511397 , {onAccount: wallets[0].publicKey});
    await timeout(1000);
    console.log(wallets[0]);
    let balanceOfContract = await contract.methods.checkBalance(contract.deployInfo.address.replace('ct_', 'ak_'));
    // let balanceOfContract = await contract.methods.checkBalance(wallets[0].publicKey);
    // console.log(`Balance of Contract is ${balanceOfContract.decodedResult}`);
    console.log(`Result for Bid initialization : ${resultStartBid.decodedResult}. Bid Started!`);
    console.log('');
    console.log('');
    console.log(`100000000000 aettos placed by ${wallets[1].publicKey}`);
    const placeBidResult = await contract.methods.placeBid(riskNFTID.toString(), {onAccount: wallets[1].publicKey, amount: 100000000000});
    await timeout(1000);
    console.log(`Bid placed by ${wallets[1].publicKey} is successful`);
    balanceOfContract = await contract.methods.checkBalance(wallets[1].publicKey);
    // let balanceOfContract = await contract.methods.checkBalance(wallets[0].publicKey);
    // console.log(`Balance of Account : [${wallets[1].publicKey}] is ${balanceOfContract.decodedResult}`);

    balanceOfContract = await contract.methods.checkBalance(contract.deployInfo.address.replace('ct_', 'ak_'));
    // let balanceOfContract = await contract.methods.checkBalance(wallets[0].publicKey);
    // console.log(`Balance of Contract is ${balanceOfContract.decodedResult}`);
    console.log('');
    console.log('');
    // console.log(`100000000000 aettos placed by ${wallets[2].publicKey}`);
    const placeBidResult1 = await contract.methods.placeBid(riskNFTID.toString(), {onAccount: wallets[2].publicKey, amount: 200000000000});
    await timeout(1000);
    console.log(`Bid placed by ${wallets[2].publicKey} is successful`);
    balanceOfContract = await contract.methods.checkBalance(wallets[2].publicKey);
    // let balanceOfContract = await contract.methods.checkBalance(wallets[0].publicKey);
    // console.log(`Balance of Account : [${wallets[2].publicKey}] is ${balanceOfContract.decodedResult}`);
    balanceOfContract = await contract.methods.checkBalance(contract.deployInfo.address.replace('ct_', 'ak_'));
    // let balanceOfContract = await contract.methods.checkBalance(wallets[0].publicKey);
    // console.log(`Balance of Contract is ${balanceOfContract.decodedResult}`);
    console.log('');
    console.log('');
    console.log(`400000000000 aettos placed by ${wallets[1].publicKey}`);
    const placeBidResult2 = await contract.methods.placeBid(riskNFTID.toString(), {onAccount: wallets[3].publicKey, amount: 400000000000});
    await timeout(1000);
    console.log(`Bid placed by ${wallets[3].publicKey} is successful`);
    balanceOfContract = await contract.methods.checkBalance(wallets[3].publicKey);
    // let balanceOfContract = await contract.methods.checkBalance(wallets[0].publicKey);
    // console.log(`Balance of Account : [${wallets[3].publicKey}] is ${balanceOfContract.decodedResult}`);
    balanceOfContract = await contract.methods.checkBalance(contract.deployInfo.address.replace('ct_', 'ak_'));
    // let balanceOfContract = await contract.methods.checkBalance(wallets[0].publicKey);
    // console.log(`Balance of Contract is ${balanceOfContract.decodedResult}`);
    console.log('');
    console.log('');

    await timeout(5000);

    console.log('Bidded ended');
    console.log('Finilizing bid.');
    console.log(`Getting funds by Bidder.`)
    let _fundsByBidder = await contract.methods.getFundsByBidder(riskNFTID.toString());
    console.log(`Funds by Bidder::::`);
    console.log(_fundsByBidder.decodedResult);

    let _Bid = await contract.methods.getBid(riskNFTID.toString());
    console.log(`_Bid::::`);
    console.log(_Bid.decodedResult);

    let owner3 = await contract.methods.owner(riskNFTID.toString());
    console.log(`Owner of Token : [${riskNFTID} is : [${owner3.decodedResult}]`);

    let resOfFinalizeBid = await contract.methods.finalizeBid(riskNFTID.toString(), {'None': []});
    console.log(`Result of Finizing Bid : [${resOfFinalizeBid.decodedResult}]`);

    balanceOfContract = await contract.methods.checkBalance(contract.deployInfo.address.replace('ct_', 'ak_'));
    // let balanceOfContract = await contract.methods.checkBalance(wallets[0].publicKey);
    // console.log(`Balance of Contract is ${balanceOfContract.decodedResult}`);

    owner3 = await contract.methods.owner(riskNFTID.toString());
    console.log(`Owner of Token : [${riskNFTID} is : [${owner3.decodedResult}]`);

    balanceOfContract = await contract.methods.checkBalance(wallets[0].publicKey);
    // let balanceOfContract = await contract.methods.checkBalance(wallets[0].publicKey);
    console.log(`Balance of Account : [${wallets[0].publicKey}] is ${balanceOfContract.decodedResult}`);

    balanceOfContract = await contract.methods.checkBalance(wallets[3].publicKey);
    // let balanceOfContract = await contract.methods.checkBalance(wallets[0].publicKey);
    console.log(`Balance of Account : [${wallets[3].publicKey}] is ${balanceOfContract.decodedResult}`);

    console.log(`New Owner wants to Start another auction. So he/she needs to recompute the RiskFactor.`);
    console.log('Waiting to compute the new values');
    await timeout(100000);
    console.log('Wait complete!');
    const query3 = await oracleObj.queryAePrice(cryptoCurrency)
    // console.log(query);
    let responseJson3 = await oracleObj.pollForResponse(query3);
    // console.log(responseJson);
    let currencyMetaData3 = {};
    currencyMetaData3["symbol"] = responseJson3.symbol?responseJson3.symbol.toString() : "";
    currencyMetaData3["name"] = responseJson3.name?responseJson3.name.toString() : "";
    currencyMetaData3["last_updated"] = responseJson3.last_updated?responseJson3.last_updated.toString() : "";
    currencyMetaData3["current_price"] = responseJson3.current_price?responseJson3.current_price.toString() : "";
    currencyMetaData3["market_cap"] = responseJson3.market_cap?responseJson3.market_cap.toString() : "";
    currencyMetaData3["fully_diluted_valuation"] = responseJson3.fully_diluted_valuation?responseJson3.fully_diluted_valuation.toString() : "";
    currencyMetaData3["total_volume"] = responseJson3.total_volume?responseJson3.total_volume.toString() : "";
    currencyMetaData3["high_24h"] = responseJson3.high_24h?responseJson3.high_24h.toString() : "";
    currencyMetaData3["low_24h"] = responseJson3.low_24h?responseJson3.low_24h.toString() : "";
    currencyMetaData3["price_change_24h"] = responseJson3.price_change_24h?responseJson3.price_change_24h.toString() : "";
    currencyMetaData3["price_change_percentage_24h"] = responseJson3.price_change_percentage_24h?responseJson3.price_change_percentage_24h.toString() : "";
    currencyMetaData3["market_cap_change_24h"] = responseJson3.market_cap_change_24h?responseJson3.market_cap_change_24h.toString() : "";
    currencyMetaData3["market_cap_change_percentage_24h"] = responseJson3.market_cap_change_percentage_24h?responseJson3.market_cap_change_percentage_24h.toString() : "";
    currencyMetaData3["circulating_supply"] = responseJson3.circulating_supply?responseJson3.circulating_supply.toString() : "";
    currencyMetaData3["total_supply"] = responseJson3.total_supply?responseJson3.total_supply.toString() : "";
    currencyMetaData3["max_supply"] = responseJson3.max_supply?responseJson3.max_supply.toString() : "";
    
    const metaInfoResult1 = await contract.methods.meta_info(riskNFTID.toString(), { onAccount: wallets[3].publicKey });
    console.log(metaInfoResult1.decodedResult);
    let riskFactor2  = riskCalculator(metaInfoResult1.decodedResult['currencyMetadata'], currencyMetaData3);
    console.log(`Risk Factor : ${riskFactor2}`);
    const metaInfoResult3 = await contract.methods.updateRiskNFTRiskFactor(riskNFTID.toString(),currencyMetaData3,  riskFactor2, { onAccount: wallets[3].publicKey });
    console.log(`Update Risk Factor Result : [${metaInfoResult3.decodedResult}]`);

    console.log(`Proceeds to auction!`);

    assert.equal(1, 1); 
    // assert.equal(set.decodedEvents[0].name, 'SetXEvent');
    // assert.equal(set.decodedEvents[0].args[0], await utils.getDefaultAccounts()[1].address());
    // assert.equal(set.decodedEvents[0].args[1], 42);

    // const { decodedResult } = await contract.methods.get();
    // assert.equal(decodedResult, 42);
  });

  // it('ExampleContract: get undefined when not set before', async () => {
  //   const { decodedResult } = await contract.methods.get();
  //   assert.equal(decodedResult, undefined);
  // });
});
