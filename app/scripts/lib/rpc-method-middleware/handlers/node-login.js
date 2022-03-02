import { MESSAGE_TYPE } from '../../../../../shared/constants/app'

const nodeLogin = {
  methodNames: [MESSAGE_TYPE.NODE_LOGIN],
  implementation: nodeLoginHandler,
}
export default nodeLogin

async function nodeLoginHandler (
  req,
  res,
  next,
  end,
  { handleNodeLoginRequest, origin },
) {
  try {
    res.result = await handleNodeLoginRequest(origin, req)
    return end()
  } catch (error) {
    return end(error)
  }
}
