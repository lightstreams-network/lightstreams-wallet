const ENVIRONMENT_TYPE_POPUP = 'popup'
const ENVIRONMENT_TYPE_NOTIFICATION = 'notification'
const ENVIRONMENT_TYPE_FULLSCREEN = 'fullscreen'
const ENVIRONMENT_TYPE_BACKGROUND = 'background'

const PLATFORM_BRAVE = 'Brave'
const PLATFORM_CHROME = 'Chrome'
const PLATFORM_EDGE = 'Edge'
const PLATFORM_FIREFOX = 'Firefox'
const PLATFORM_OPERA = 'Opera'

const MESSAGE_TYPE = {
  ETH_DECRYPT: 'eth_decrypt',
  ETH_GET_ENCRYPTION_PUBLIC_KEY: 'eth_getEncryptionPublicKey',
  ETH_SIGN: 'eth_sign',
  ETH_SIGN_TYPED_DATA: 'eth_signTypedData',
  CONNECT_APP: 'connect_app',
  LOG_WEB3_USAGE: 'metamask_logInjectedWeb3Usage',
  PERSONAL_SIGN: 'personal_sign',
}

export {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_BACKGROUND,
  MESSAGE_TYPE,
  PLATFORM_BRAVE,
  PLATFORM_CHROME,
  PLATFORM_EDGE,
  PLATFORM_FIREFOX,
  PLATFORM_OPERA,
}
