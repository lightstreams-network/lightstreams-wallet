import { MESSAGE_TYPE } from '../../../../../shared/constants/app'

const nodeAuthToken = {
  methodNames: [MESSAGE_TYPE.NODE_AUTH_TOKEN],
  implementation: nodeAuthTokenHandler,
}
export default nodeAuthToken

async function nodeAuthTokenHandler (
  req,
  res,
  _next,
  end,
  { handleNodeAuthTokenRequest, origin, getProviderState, keyringController, provider },
) {
  try {
    res.result = {
      ...(await handleNodeAuthTokenRequest(req, origin, getProviderState, keyringController, provider)),
    }
    return end()
  } catch (error) {
    return end(error)
  }
}
