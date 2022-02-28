class LSAuthTokenController {
  constructor (opts = {}) {

  }

  async requestLSTokenAuth (req) {
    if (req.method === 'wallet_lsAuthToken') {
      const { options } = req.params
      let token = await this._handleLSTokenAuth(options)
      return {token}
    }
  }

  async _handleLSTokenAuth (options) {
    return new Promise(function executor(resolve) {
      resolve('OK')
    })
  }
}

module.exports = LSAuthTokenController
