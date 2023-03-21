#CalicoDEX#

The Decentralized EXchange is build on aeternity platform.
The functionalities currently possible for this contract includes:

1. Minting a Asset NFT using real world data of a cryptocurrency using Oracles of aeternity.
2. Minting the Risk Associated with the AssetNFT.
3. This project introduces a novel way to calculate the riskFactor using an algorithm.
4. Allows owner of the Risk NFT to trade it using auctioning system.
5. Auctioning is powered by the bid concept where users of the DEX are allowed to bid on the RiskNFT.
6. The RiskNFT can be further auctioned at a later point in time.

# How to run this project.

# 1. Deploy the Calico Pricefeed Oracle Contract.

1.A. npm run deployOracleConnector.js

NOTE: The contract is already deployed into aeternity's testnet. Contract ID - ok_2XchkwHMs1eRZYu1XmuYamrncZPUthn11kfQLgGbp34LXFiZrn.

# 2. Run the Oracle.

2.A. cd into the `backend` folder.
2.B. Run the docker command mention in the Readme file to run the oracle.

NOTE: This expects the same account's address which deployed the pricefeed Oracle as Oracles are linked to accounts.

# 3. Run the Calico DEX script.

3.A. Initializes the aeproject.
aeproject env

3.B. Run the script which mimics the steps in the demo video. (https://www.youtube.com/watch?v=aKH5WiL3VAY)
npm run CalicoDex

# Architecture

Arch_11.jpg showcases the architecture of the project. You can find it at `/Architecture`
