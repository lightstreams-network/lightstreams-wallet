import { MESSAGE_TYPE } from '../../../../../shared/constants/app'

const lsAuthToken = {
  methodNames: [MESSAGE_TYPE.CONNECT],
  implementation: connectHandler,
}
export default lsAuthToken

async function connectHandler (
  req,
  res,
  next,
  end,
  { handleConnectRequest, origin },
) {
  try {
    res.result = await handleConnectRequest(origin)
    return end()
  } catch (error) {
    return end(error)
  }
}
