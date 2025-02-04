import log from 'loglevel'
import BigNumber from 'bignumber.js'
import contractMapETH from '@metamask/contract-metadata'
import contractMapRSK from '@rsksmart/rsk-contract-metadata'
import contractMapRSKTest from '@rsksmart/rsk-testnet-contract-metadata'
const util = require('./util')

const casedContractMapETH = Object.keys(contractMapETH).reduce((acc, base) => {
  return {
    ...acc,
    [base.toLowerCase()]: contractMapETH[base],
  }
}, {})

const casedContractMapRSK = Object.keys(contractMapRSK).reduce((acc, base) => {
  return {
    ...acc,
    [base.toLowerCase()]: contractMapRSK[base],
  }
}, {})

const casedContractMapRSKTest = Object.keys(contractMapRSKTest).reduce((acc, base) => {
  return {
    ...acc,
    [base.toLowerCase()]: contractMapRSKTest[base],
  }
}, {})

const casedContractMap = Object.assign(casedContractMapETH, casedContractMapRSK, casedContractMapRSKTest)

const DEFAULT_SYMBOL = ''
const DEFAULT_DECIMALS = '0'

async function getSymbolFromContract (tokenAddress) {
  const token = util.getContractAtAddress(tokenAddress)

  try {
    const result = await token.symbol()
    return result[0]
  } catch (error) {
    log.warn(`symbol() call for token at address ${tokenAddress} resulted in error:`, error)
  }
}

async function getDecimalsFromContract (tokenAddress) {
  const token = util.getContractAtAddress(tokenAddress)

  try {
    const result = await token.decimals()
    const decimalsBN = result[0]
    return decimalsBN && decimalsBN.toString()
  } catch (error) {
    log.warn(`decimals() call for token at address ${tokenAddress} resulted in error:`, error)
  }
}

function getContractMetadata (tokenAddress) {
  return tokenAddress && casedContractMap[tokenAddress.toLowerCase()]
}

async function getSymbol (tokenAddress) {
  let symbol = await getSymbolFromContract(tokenAddress)

  if (!symbol) {
    const contractMetadataInfo = getContractMetadata(tokenAddress)

    if (contractMetadataInfo) {
      symbol = contractMetadataInfo.symbol
    }
  }

  return symbol
}

async function getDecimals (tokenAddress) {
  let decimals = await getDecimalsFromContract(tokenAddress)

  if (!decimals || decimals === '0') {
    const contractMetadataInfo = getContractMetadata(tokenAddress)

    if (contractMetadataInfo) {
      decimals = contractMetadataInfo.decimals
    }
  }

  return decimals
}

export async function getSymbolAndDecimals (tokenAddress, existingTokens = []) {
  const existingToken = existingTokens.find(({ address }) => tokenAddress === address)

  if (existingToken) {
    return {
      symbol: existingToken.symbol,
      decimals: existingToken.decimals,
    }
  }

  let symbol, decimals

  try {
    symbol = await getSymbol(tokenAddress)
    decimals = await getDecimals(tokenAddress)
  } catch (error) {
    log.warn(`symbol() and decimal() calls for token at address ${tokenAddress} resulted in error:`, error)
  }

  return {
    symbol: symbol || DEFAULT_SYMBOL,
    decimals: decimals || DEFAULT_DECIMALS,
  }
}

export function tokenInfoGetter () {
  const tokens = {}

  return async (address) => {
    if (tokens[address]) {
      return tokens[address]
    }

    tokens[address] = await getSymbolAndDecimals(address)

    return tokens[address]
  }
}

export function calcTokenAmount (value, decimals) {
  const multiplier = Math.pow(10, Number(decimals || 0))
  return new BigNumber(String(value)).div(multiplier).toNumber()
}

export function calcTokenAmountWithDec (valueWithoutDec, decimals) {
  const multiplier = Math.pow(10, Number(decimals || 0))
  return new BigNumber(valueWithoutDec).mul(multiplier).toNumber()
}

export function getTokenValue (tokenParams = []) {
  const valueData = tokenParams.find(param => param.name === '_value')
  return valueData && valueData.value
}
