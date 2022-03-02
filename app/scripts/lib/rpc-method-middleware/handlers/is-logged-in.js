import { MESSAGE_TYPE } from '../../../../../shared/constants/app'

const isLoggedIn = {
  methodNames: [MESSAGE_TYPE.NODE_IS_LOGGEDIN],
  implementation: isLoggedInHandler,
}
export default isLoggedIn

async function isLoggedInHandler (
  req,
  res,
  next,
  end,
  { handleIsLoggedInRequest, origin },
) {
  try {
    res.result = await handleIsLoggedInRequest(origin, req)
    return end()
  } catch (error) {
    return end(error)
  }
}
