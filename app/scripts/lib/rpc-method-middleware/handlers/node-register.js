import { MESSAGE_TYPE } from '../../../../../shared/constants/app'

const nodeRegister = {
  methodNames: [MESSAGE_TYPE.NODE_REGISTER],
  implementation: nodeRegisterHandler,
}
export default nodeRegister

async function nodeRegisterHandler (
  req,
  res,
  next,
  end,
  { handleNodeRegisterRequest, origin },
) {
  try {
    res.result = await handleNodeRegisterRequest(origin, req)
    return end()
  } catch (error) {
    return end(error)
  }
}
