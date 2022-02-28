const ethers = require("ethers")

class LSAuthTokenController {
  constructor (opts = {}) {

  }

  async requestLSTokenAuth (req, getProviderState, keyringController, provider) {
    let stateProvider = await getProviderState()
    if (!stateProvider.isUnlocked) { // || !stateProvider.isConnected) {
      return {}
    }

    const { peerId } = req.params

    if (req.method === 'wallet_lsAuthToken') {
      let token = await this._handleLSTokenAuth(keyringController, stateProvider, provider, peerId)
      return {token}
    }

    return {}
  }

  async _handleLSTokenAuth (keyringController, stateProvider, web3, peerId) {
    let selectedAddress = stateProvider.selectedAddress
    let networkVersion = stateProvider.networkVersion

    let privateKey = await keyringController.exportAccount(selectedAddress, networkVersion)

    const provider = new ethers.providers.Web3Provider(web3, 'any')
    const wallet = new ethers.Wallet(privateKey, provider)
    let blockCount = await provider.getBlockNumber()
    const expirationBlock = blockCount + 10 ** 6

    const claims = {
      blockchain: "PHT",
      peer_id: peerId,
      eth_address: selectedAddress,
      iat: blockCount,
      eat: expirationBlock,
      timestamp: Date.now(),
    }

    const marshalledClaims = JSON.stringify(claims)

    let data = Buffer.from(marshalledClaims)
    let dataHex = data.toString("hex")
    let hash = ethers.utils.keccak256("0x" + dataHex)
    let key = new ethers.utils.SigningKey(wallet.privateKey)
    let signed = ethers.utils.joinSignature(key.signDigest(hash))

    const marshalledClaimsHexBuffer = new Buffer(marshalledClaims, 'ascii')
    const encodedClaimsBase64 = marshalledClaimsHexBuffer.toString('base64')

    const encodedClaimsBase64URLSafe = encodedClaimsBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
    const sigHexBuffer = new Buffer(signed.replace(/^0x/, ""), 'hex')

    const encodedSigBase64 = sigHexBuffer.toString('base64')
    const encodedSigBase64URLSafe = encodedSigBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')

    const token = encodedClaimsBase64URLSafe + "." + encodedSigBase64URLSafe

    return new Promise(function executor(resolve) {
      resolve(token)
    })
  }
}

module.exports = LSAuthTokenController
