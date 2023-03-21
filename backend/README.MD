# Aeternity Oracle

This is a sample Oracle to fetch live pricefeed and other metadata associated with a cryptocurrency using coingecko APIs.

The javascript file /user/queryUsingSDK.js` provides a sample of how you can query the Oracle.

NOTE: docker should already be installed in the system.

# build container

docker build -t ae-oracle-pricefeed .

# run, follow instructions to fund account, configure NODE_URL for other aeternity node

docker run -it --name pricefeed -v "$PWD/.data:/app/.data" -e NODE_URL=https://testnet.aeternity.io/ ae-oracle-pricefeed
