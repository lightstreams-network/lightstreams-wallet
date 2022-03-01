import { MESSAGE_TYPE } from '../../../../../shared/constants/app'

const lsAuthToken = {
  methodNames: [MESSAGE_TYPE.LS_AUTH_TOKEN],
  implementation: lsAuthTokenHandler,
}
export default lsAuthToken

/**
 * @param {import('json-rpc-engine').JsonRpcRequest<WatchAssetParam>} req - The JSON-RPC request object.
 * @param {import('json-rpc-engine').JsonRpcResponse<true>} res - The JSON-RPC response object.
 * @param {Function} _next - The json-rpc-engine 'next' callback.
 * @param {Function} end - The json-rpc-engine 'end' callback.
 * @param {LsAuthTokenHandlerOptions} options
 */
async function lsAuthTokenHandler (
  req,
  res,
  _next,
  end,
  { handleLSTokenAuthRequest, origin, getProviderState, keyringController, provider },
) {
  try {
    res.result = {
      ...(await handleLSTokenAuthRequest(req, origin, getProviderState, keyringController, provider)),
    }
    return end()
  } catch (error) {
    return end(error)
  }
}
