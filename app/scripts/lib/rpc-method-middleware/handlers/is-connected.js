import { MESSAGE_TYPE } from '../../../../../shared/constants/app'

const isConnected = {
  methodNames: [MESSAGE_TYPE.IS_CONNECTED],
  implementation: isConnectedHandler,
}
export default isConnected

async function isConnectedHandler (
  req,
  res,
  next,
  end,
  { handleIsConnectedRequest, origin },
) {
  try {
    res.result = {
      ...(await handleIsConnectedRequest(origin)),
    }
    return end()
  } catch (error) {
    return end(error)
  }
}
