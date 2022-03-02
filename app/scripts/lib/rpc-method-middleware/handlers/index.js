import getProviderState from './get-provider-state'
import logWeb3ShimUsage from './log-web3-shim-usage'
import watchAsset from './watch-asset'
import nodeAuthToken from './node-auth-token'
import connect from './connect'
import isConnected from './is-connected'
import nodeRegister from './node-register'
import nodeLogin from './node-login'
import isLoggedIn from './is-logged-in'

const handlers = [
  getProviderState,
  logWeb3ShimUsage,
  watchAsset,
  nodeAuthToken,
  connect,
  isConnected,
  nodeRegister,
  nodeLogin,
  isLoggedIn,
]
export default handlers
