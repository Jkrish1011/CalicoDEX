const {Crypto, Universal, Node, MemoryAccount, AmountFormatter} = require('@aeternity/aepp-sdk');
const fs = require('fs');
const path = require('path');

const getContractContent = (contractSource) => {
    return fs.readFileSync(contractSource, 'utf8');
}

const getFilesystem = (contractSource) => {
    console.log(`Creating filesystem by checking includes for: ${contractSource}`);
    const defaultIncludes = [
        'List.aes', 'Option.aes', 'String.aes',
        'Func.aes', 'Pair.aes', 'Triple.aes',
        'BLS12_381.aes', 'Frac.aes'
    ];
    const rgx = /^include\s+\"([\d\w\/\.\-\_]+)\"/gmi;
    const rgxIncludePath = /"([\d\w\/\.\-\_]+)\"/gmi;
    const rgxMainPath = /.*\//g;

    const contractContent = getContractContent(contractSource);
    let filesystem = {};

    const match = rgx.exec(contractContent);
    if(!match) {
        return filesystem;
    }
    let rootIncludes = contractContent.match(rgx);
    for (let i=0; i<rootIncludes.length; i++) {
        const contractPath = rgxMainPath.exec(contractSource);
        rgxMainPath.lastIndex = 0;
        const includeRelativePath = rgxIncludePath.exec(rootIncludes[i]);
        rgxIncludePath.lastIndex = 0;
        if(defaultIncludes.includes(includeRelativePath[1])){
            console.log(`=> Skipping default include: ${includeRelativePath[1]}`);
            continue;
        }
        console.log(`=> Adding include: ${includeRelativePath[1]}`);
        const includePath = path.resolve(`${contractPath[0]}/${includeRelativePath[1]}`);
        try {
            const includeContent = fs.readFileSync(includePath, 'utf-8');
            filesystem[includeRelativePath[1]] = includeContent;
        } catch (error) {
            throw Error(`File to include '${includeRelativePath[1]}' not found.`);
        }
        console.log(``);
        Object.assign(filesystem, getFilesystem(includePath));
    }
    console.log(``);
    return filesystem;
}

// **Note**:
//
//  - You need to have the SDK installed via `npm i @aetenity/aepp-sdk -g` to run that example code.

// ## 2. Define constants
// The following constants are used in the subsequent code snippets.
// typically you read the source code from a separate .aes file

const ACCOUNT_KEYPAIR = {
  publicKey: 'ak_2XchkwHMs1eRZYu1XmuYamrncZPUthn11kfQLgGbp34LXFiZrn',
  secretKey: '177a354bbd05d403485a9062524da7d41532546168bd4270b48527c59b9526c0c9366503150afa0eb5ace5e12d5e11c6e0e92fe17473c034fdfebf64546b50dc',
};
const NODE_URL = 'https://testnet.aeternity.io';
const COMPILER_URL = 'https://compiler.aepps.com';
let NETWORK_NAME = 'testnet';
// Note:
//
//  - The keypair of the account is pre-funded and only used for demonstration purpose
//      - You should replace it with your own keypair (see
//        [Create a Keypair](../../quick-start.md#2-create-a-keypair))
//  - In case the account runs out of funds you can always request AE using the [Faucet](https://faucet.aepps.com/)

// ## 3. Open async codeblock
// Most functions of the SDK return _Promises_, so the recommended way of
// dealing with subsequent actions is running them one by one using `await`.
// Therefore you need to put the logic into an `async` code block
(async () => {
    
    //let address = null;
    let client = null;
    const node = {
        nodes: [
            {
            name: NETWORK_NAME,
            instance: await new Node({
                url: 'https://testnet.aeternity.io',
                internalUrl: 'https://testnet.aeternity.io/mdw',
            }),
            }
        ],
        compilerUrl: 'https://latest.compiler.aepps.com',
        };
    
        
    client = await Universal({
        /*nodes: [
            { name: NETWORK_NAME, instance: await Node({ url: NETWORKS[NETWORK_NAME].nodeUrl }) },
        ],
        compilerUrl: NETWORKS[NETWORK_NAME].compilerUrl,*/
        ...node,
        accounts: [new MemoryAccount({ keypair: ACCOUNT_KEYPAIR })],
        address: ACCOUNT_KEYPAIR.publicKey
    });
    let resultOut = {};
    // console.log(client);
    resultOut['client'] = client;
    let balance = await client.balance(ACCOUNT_KEYPAIR.publicKey, {
        format: AmountFormatter.AE_AMOUNT_FORMATS.AE
    });
    resultOut['address'] = ACCOUNT_KEYPAIR.publicKey;
    resultOut['balance'] = balance + AmountFormatter.AE_AMOUNT_FORMATS.AE;
    console.log("Current Address:",  ACCOUNT_KEYPAIR.publicKey);
    console.log("Current Balance:", balance + AmountFormatter.AE_AMOUNT_FORMATS.AE);	
    
    try{
        console.log('getting contract instance');
        const EXAMPLE_CONTRACT_SOURCE = '/Users/jk/Documents/GaussGlobalMachines/CalicoDEX/contracts/CalicoOracleConnector.aes';
        const filesystem = getFilesystem(EXAMPLE_CONTRACT_SOURCE);
		
		// get content of contract
		
		const contract_content = getContractContent(EXAMPLE_CONTRACT_SOURCE);
        // const contract = await client.getContractInstance({ source: CONTRACT_SOURCE });
        // console.log(filesystem);
        // console.log(contract_content);
        const contract = await client.getContractInstance({ source: contract_content , filesystem});
        console.log('compiling the contract');
        const bytecode = await contract.compile();
        console.log(`Obtained bytecode ${bytecode}`);

        console.log('deploying the contract!');
        const deployInfo = await contract.deploy([]);
        console.log(`Contract deployed at ${deployInfo.address}`);

        let aci = contract._aci; // obtain and save the ACI
        let contractAddress = contract.deployInfo.address; 
        console.log(aci);
        console.log(contractAddress);
        // ct_YhJqGUxjmRYcMxPL7XKMsdostkprQkHHinmq39d3eBfchGhSe - deployed at 
        fs.writeFileSync('/Users/jk/Documents/GaussGlobalMachines/CalicoDEX/contracts/aci.json', JSON.stringify(aci));
    }
    catch(error){
        console.log(error);
    }
})();