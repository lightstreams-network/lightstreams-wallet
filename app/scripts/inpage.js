// need to make sure we aren't affected by overlapping namespaces
// and that we dont affect the app with our namespace
// mostly a fix for web3's BigNumber if AMD's "define" is defined...
let __define

/**
 * Caches reference to global define object and deletes it to
 * avoid conflicts with other global define objects, such as
 * AMD's define function
 */
const cleanContextForImports = () => {
  __define = global.define
  try {
    global.define = undefined
  } catch (_) {
    console.warn('Lightstreams Wallet - global.define could not be deleted.')
  }
}

/**
 * Restores global define object from cached reference
 */
const restoreContextAfterImports = () => {
  try {
    global.define = __define
  } catch (_) {
    console.warn('Lightstreams Wallet - global.define could not be overwritten.')
  }
}

cleanContextForImports()

import log from 'loglevel'
import LocalMessageDuplexStream from 'post-message-stream'
import { MetaMaskInpageProvider } from 'nifty-wallet-inpage-provider'

// TODO:deprecate:Q1-2020
import 'web3/dist/web3.min.js'

restoreContextAfterImports()

log.setDefaultLevel(process.env.METAMASK_DEBUG ? 'debug' : 'warn')

//
// setup plugin communication
//

// setup background connection
const stream = new LocalMessageDuplexStream({
  name: 'lightstreams-inpage',
  target: 'lightstreams-contentscript',
})

// compose the inpage provider
const inpageProvider = new MetaMaskInpageProvider(stream, {jsonRpcStreamName: 'lightstreams-provider'})

//
// end deprecate:Q1-2020
//

window.lightstreams = inpageProvider
