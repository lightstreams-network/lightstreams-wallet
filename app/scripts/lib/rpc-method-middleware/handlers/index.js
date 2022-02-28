import getProviderState from './get-provider-state'
import logWeb3ShimUsage from './log-web3-shim-usage'
import watchAsset from './watch-asset'
import lsAuthToken from './ls-auth-token'

const handlers = [getProviderState, logWeb3ShimUsage, watchAsset, lsAuthToken]
export default handlers
