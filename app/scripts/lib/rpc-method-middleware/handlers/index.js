import getProviderState from './get-provider-state'
import logWeb3ShimUsage from './log-web3-shim-usage'
import watchAsset from './watch-asset'
import lsAuthToken from './ls-auth-token'
import connect from './connect'
import isConnected from './is-connected'
import nodeRegister from './node-register'
import nodeLogin from './node-login'

const handlers = [
  getProviderState,
  logWeb3ShimUsage,
  watchAsset,
  lsAuthToken,
  connect,
  isConnected,
  nodeRegister,
  nodeLogin,
]
export default handlers
