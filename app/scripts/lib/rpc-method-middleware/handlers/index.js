import getProviderState from './get-provider-state'
import logWeb3ShimUsage from './log-web3-shim-usage'
import watchAsset from './watch-asset'
import lsAuthToken from './ls-auth-token'
import connect from './connect'
import isConnected from './is-connected'
import nodeRegister from './node-register'

const handlers = [
  getProviderState,
  logWeb3ShimUsage,
  watchAsset,
  lsAuthToken,
  connect,
  isConnected,
  nodeRegister,
]
export default handlers
