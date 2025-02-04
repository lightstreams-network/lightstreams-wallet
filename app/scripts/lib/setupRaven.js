const Raven = require('raven-js')
const METAMASK_DEBUG = process.env.METAMASK_DEBUG
import extractEthjsErrorMessage from './extractEthjsErrorMessage'
const PROD = 'https://9985e4264db147229115b184478132b8@sentry.io/5688761'
const DEV = 'https://9985e4264db147229115b184478132b8@sentry.io/5688761'

module.exports = setupRaven

// Setup raven / sentry remote error reporting
function setupRaven (opts) {
  const { release } = opts
  let ravenTarget
  // detect brave
  const isBrave = Boolean(window.chrome.ipcRenderer)

  if (METAMASK_DEBUG) {
    console.log('Setting up Sentry Remote Error Reporting: DEV')
    ravenTarget = DEV
  } else {
    console.log('Setting up Sentry Remote Error Reporting: PROD')
    ravenTarget = PROD
  }

  const client = Raven.config(ravenTarget, {
    release,
    transport: function (opts) {
      opts.data.extra.isBrave = isBrave
      const report = opts.data

      try {
        // handle error-like non-error exceptions
        rewriteErrorLikeExceptions(report)
        // simplify certain complex error messages (e.g. Ethjs)
        simplifyErrorMessages(report)
        // modify report urls
        rewriteReportUrls(report)
      } catch (err) {
        console.warn(err)
      }
      // make request normally
      client._makeRequest(opts)
    },
  })
  client.install()

  return Raven
}

function rewriteErrorLikeExceptions (report) {
  // handle errors that lost their error-ness in serialization (e.g. dnode)
  rewriteErrorMessages(report, (errorMessage) => {
    if (!errorMessage.includes('Non-Error exception captured with keys:')) return errorMessage
    if (!(report.extra && report.extra.__serialized__ && report.extra.__serialized__.message)) return errorMessage
    return `Non-Error Exception: ${report.extra.__serialized__.message}`
  })
}

function simplifyErrorMessages (report) {
  rewriteErrorMessages(report, (errorMessage) => {
    // simplify ethjs error messages
    errorMessage = extractEthjsErrorMessage(errorMessage)
    // simplify 'Transaction Failed: known transaction'
    if (errorMessage.indexOf('Transaction Failed: known transaction') === 0) {
      // cut the hash from the error message
      errorMessage = 'Transaction Failed: known transaction'
    }
    return errorMessage
  })
}

function rewriteErrorMessages (report, rewriteFn) {
  // rewrite top level message
  if (typeof report.message === 'string') report.message = rewriteFn(report.message)
  // rewrite each exception message
  if (report.exception && report.exception.values) {
    report.exception.values.forEach(item => {
      if (typeof item.value === 'string') item.value = rewriteFn(item.value)
    })
  }
}

function rewriteReportUrls (report) {
  // update request url
  report.request.url = toMetamaskUrl(report.request.url)
  // update exception stack trace
  if (report.exception && report.exception.values) {
    report.exception.values.forEach(item => {
      item.stacktrace.frames.forEach(frame => {
        frame.filename = toMetamaskUrl(frame.filename)
      })
    })
  }
}

function toMetamaskUrl (origUrl) {
  const filePath = origUrl.split(location.origin)[1]
  if (!filePath) return origUrl
  const metamaskUrl = `metamask${filePath}`
  return metamaskUrl
}
