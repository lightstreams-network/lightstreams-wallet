import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import PersistentForm from '../../../lib/persistent-form'
import SendProfile from './send-profile'
import SendHeader from './send-header'
import ErrorComponent from '../error'
import * as Toast from '../toast'
import Select from 'react-select'
import actions from '../../../../ui/app/actions'
import abi from 'web3-eth-abi'
import Web3 from 'web3'
import Web3EthContract from 'web3-eth-contract'
import copyToClipboard from 'copy-to-clipboard'
import CopyButton from '../copy/copy-button'
import { normalizeEthStringToWei } from '../../util'
import ethNetProps from 'eth-net-props'

class SendTransactionField extends Component {
	constructor (props) {
		super(props)
		this.state = {
			val: props.defaultValue,
		}
	}

	static propTypes = {
		placeholder: PropTypes.string,
		defaultValue: PropTypes.oneOfType([
			PropTypes.string,
			PropTypes.number,
			PropTypes.bool,
		]),
		disabled: PropTypes.bool,
		value: PropTypes.string,
		onChange: PropTypes.func,
	}

	generateAttributes () {
		return {
			placeholder: this.props.placeholder,
			value: this.state.val,
			disabled: this.props.disabled,
			onChange: (e) => {
				this.setState({
					val: e.target.value,
				})
				this.props.onChange(e.target.value)
			},
		}
	}
}

class SendTransactionTextField extends SendTransactionField {
	render () {
		return (
			<input type="text"
				{...this.generateAttributes()}
				className="input large-input output"
				style={{ marginTop: '5px' }}
			/>
		)
	}
}

class SendTransactionTextArea extends SendTransactionField {
	render () {
		return (
			<textarea
				{...this.generateAttributes()}
				style={{
					marginTop: '5px',
					width: '100%',
					height: '50px',
					padding: '10px',
				}}
			/>
		)
	}
}

class SendTransactionInputSelect extends Component {
	constructor (props) {
		super(props)
		this.state = {
			val: props.defaultValue,
		}
	}

	static propTypes = {
		defaultValue: PropTypes.string,
		value: PropTypes.string,
		onChange: PropTypes.func,
	}

	render () {
		return (
			<Select
				clearable={false}
				value={this.state.val}
				options={[{
					label: 'false',
					value: 'false',
				}, {
					label: 'true',
					value: 'true',
				}]}
				onChange={(opt) => {
						this.setState({
							val: opt.value,
						})
						this.props.onChange(opt.value)
					}
				}
				style={{ marginTop: '5px' }}
			/>
		)
	}
}

class SendTransactionScreen extends PersistentForm {
	constructor (props) {
		super(props)
		this.state = {
			web3: new Web3(global.ethereumProvider),
			options: [],
			abi: [],
			methodSelected: props.methodSelected,
			methodABI: props.methodABI,
			methodInputs: [],
			methodOutputs: [],
			methodInputsView: [],
			methodOutputsView: [],
			isConstantMethod: false,
			inputValues: props.inputValues || {},
			txValue: props.txValue || '0x',
			outputValues: props.outputValues || {},
			copyDisabled: true,
		}

		let rpcUrl = props.RPC_URL || props.provider.rpcTarget
		if (rpcUrl === '') {
			rpcUrl = ethNetProps.RPCEndpoints(props.network)[0]
		}
		Web3EthContract.setProvider(rpcUrl)

		PersistentForm.call(this)
	}

	// eslint-disable-next-line camelcase
	UNSAFE_componentWillMount () {
		this.getContractMethods()
	}

	render () {
		this.persistentFormParentId = 'send-contract-tx-form'

		const {
			error,
		} = this.props
		return (
			<div className="send-screen flex-column flex-grow">
				<SendProfile />
				<SendHeader title="Execute Method" />
				<ErrorComponent error={error} />
				<Toast.ToastComponent type={Toast.TOAST_TYPE_SUCCESS} />
				<div style={{ padding: '0 30px' }}>
					<Select
						clearable={false}
						value={this.state.methodSelected}
						options={this.state.options}
						style={{ marginBottom: '10px' }}
						onChange={(opt) => {
							const isConstantMethod = opt.metadata && (opt.metadata.constant || opt.metadata.stateMutability === 'view')
							this.setState({
								methodSelected: opt.value,
								isConstantMethod: isConstantMethod,
								methodABI: opt.metadata,
								outputValues: {},
								inputValues: {},
								txValue: '0x',
							}, () => {
								this.generateMethodFieldsView(opt.metadata)
							})
						}}
					/>
				</div>
				<div style={{ padding: '0 30px', overflow: 'auto', 'maxHeight': '280px' }}>
					{this.state.methodInputsView}
					{this.state.isConstantMethod && this.methodOutput()}
					{this.buttonsSection()}
				</div>
			</div>
		)
	}

	componentDidMount () {
		if (this.props.methodSelected) {
			this.generateMethodFieldsView(this.props.methodABI)
		}
	}

	async getContractMethods () {
		const contractProps = await this.props.getContract(this.props.address)
		const abi = contractProps && contractProps.abi
		const options = abi && Array.isArray(abi) && abi.reduce((filtered, obj) => {
			if (obj.type === 'function') {
				filtered.push({ label: obj.name, value: obj.name, metadata: obj })
			}
			return filtered
		}, [])
		options.sort((option1, option2) => (option1.label).localeCompare(option2.label))
		this.setState({
			options,
			abi,
		})
	}

	generateMethodField (params, ind, isInput) {
		const { inputValues, outputValues, web3 } = this.state
		const paramName = isInput ? 'Input' : 'Output'
		const defaultInputValue = (inputValues && inputValues[ind]) || ''
		const defaultOutputValue = params.type === 'bool' ? outputValues && outputValues[ind] : (outputValues && outputValues[ind]) || ''
		let defaultValue = isInput ? defaultInputValue : defaultOutputValue
		if (Array.isArray(defaultValue)) {
			defaultValue = defaultValue.join(', ')
		} else if ((params.type.startsWith('uint') || params.type.startsWith('int')) && !isNaN(Number(defaultValue)) && Number(defaultValue) > 0) {
			defaultValue = web3.toBigNumber(defaultValue).toFixed()
		} else if (defaultValue) {
			defaultValue = defaultValue.toString()
		}
		const label = (
			<h3
				key={`method_label_${ind}`}
				style={{ marginTop: '10px' }}
			>
				{params.name || `${paramName} ${ind + 1}`}
				{!isInput ? <CopyButton
					value={defaultValue}
					style={{
						display: 'inline-block',
						marginLeft: '5px',
					}}
				/> : null}
			</h3>
		)
		// bytes field is not mandatory to fill: 0x is by default
		if (params.type.startsWith('bytes') && !Array.isArray(params.type) && isInput) {
			const inputValues = this.props.inputValues || {}
			if (!inputValues[ind]) {
				inputValues[ind] = '0x'
				this.setState({
					inputValues,
				})
			}
		}
		let field
		const allTypesProps = {
			ind,
			defaultValue,
			disabled: !isInput,
			onChange: val => isInput ? this.handleInputChange(val, params.type, ind) : null,
		}
		const textTypeProps = {
			key: Math.random(),
			placeholder: params.placeholder || params.type,
		}
		if (params.type === 'bool' && isInput) {
			field = (
				<SendTransactionInputSelect {...allTypesProps} />
			)
		} else if (params.type.includes('[]') && !isInput) {
			field = (
				<SendTransactionTextArea {...allTypesProps} {...textTypeProps} />
			)
		} else {
			field = (
				<SendTransactionTextField {...allTypesProps} {...textTypeProps} />
			)
		}
		const fieldObj = (
			<div key={`method_label_container_${ind}`}>
				{label}
				{field}
			</div>
		)
		return fieldObj
	}

	handleInputChange (val, type, ind) {
		const { inputValues } = this.state
		let { txValue } = this.state
		if (val) {
			if (type === 'bool') {
				inputValues[ind] = (val === 'true')
			} else if (type === 'value') {
				const valWei = normalizeEthStringToWei(val)
				txValue = '0x' + parseInt(valWei, 10).toString(16)
			} else {
				inputValues[ind] = val
			}
		} else {
			delete inputValues[ind]
			if (type === 'value') {
				txValue = '0x'
			}
		}
		this.setState({
			inputValues,
			txValue,
		})
	}

	generateMethodFieldsView (metadata) {
		this.setState({
			methodInputs: [],
			methodInputsView: [],
			methodOutputs: [],
			methodOutputsView: [],
		})
		const methodInputsView = []
		const methodInputs = metadata && metadata.inputs
		const methodOutputsView = []
		const methodOutputs = metadata && metadata.outputs
		if (metadata.stateMutability === 'payable') {
			methodInputsView.push(this.generateMethodField({'name': 'tx value', 'type': 'value', 'placeholder': 'tx value in Ether' }, methodInputs.length, true))
		}
		methodInputs.forEach((input, ind) => {
			methodInputsView.push(this.generateMethodField(input, ind, true))
		})

		methodOutputs.forEach((output, ind) => {
			methodOutputsView.push(this.generateMethodField(output, ind, false))
		})
		this.setState({
			methodInputs,
			methodInputsView,
			methodOutputs,
			methodOutputsView,
		})
	}

	updateOutputsView () {
		const methodOutputsView = []
		this.state.methodOutputs.forEach((output, ind) => {
			methodOutputsView.push(this.generateMethodField(output, ind, false))
		})
		this.setState({
			methodOutputsView,
		})
	}

	methodOutput () {
		return (
			<div>
				<h3
					className="flex-center"
					style={{ marginTop: '10px' }}
				>Output data</h3>
				{this.state.methodOutputsView}
			</div>
		)
	}

	buttonsSection () {
		const { isConstantMethod } = this.state
		const callButton = (
			<button disabled={!this.buttonEnabled()} onClick={() => this.callData()}>Call data</button>
		)
		const nextButton = (
			<div>
				<button
					disabled={!this.buttonEnabled()}
					style={{ marginRight: '20px' }}
					className="btn-grey"
					onClick={() => this.copyAbiEncoded()}
				>Copy ABI encoded
				</button>
				<button disabled={!this.buttonEnabled()} onClick={() => this.onSubmit()}>Next</button>
			</div>
		)
		const executeButton = isConstantMethod ? callButton : nextButton

		const buttonContainer = (
			<div
				className="section flex-row flex-right"
				style={{ margin: '20px 0' }}
			>
				{ executeButton }
			</div>
		)

		return buttonContainer
	}

	buttonEnabled = () => {
		const { methodSelected, methodInputs, inputValues } = this.state
		return methodSelected && (methodInputs.length === Object.keys(inputValues).length)
	}

	callData = () => {
		this.props.showLoadingIndication()
		const { abi, methodSelected, inputValues, methodInputs, methodOutputs, methodOutputsView, web3 } = this.state
		const { address } = this.props

		const inputValuesArray = Object.keys(inputValues).map(key => {
			let val
			if (this.isUintIntType(methodInputs[key].type)) {
				val = web3.toBigNumber(inputValues[key])
			} else {
				val = inputValues[key]
			}
			return val
		})
		try {
			const contract = new Web3EthContract(abi, address)
			contract.methods[methodSelected](...inputValuesArray).call()
			.then((result) => {
				this.props.hideLoadingIndication()

				const outputValues = {}
				if (methodOutputsView.length > 1) {
					if (typeof result === 'object') {
						for (var key in result) {
							const type = methodOutputs && methodOutputs[key] && methodOutputs[key].type
							outputValues[key] = this.setOutputValue(result[key], type)
						}
					} else {
						result.forEach((val, ind) => {
							const type = methodOutputs && methodOutputs[ind] && methodOutputs[ind].type
							outputValues[ind] = this.setOutputValue(val, type)
						})
					}
				} else {
					const type = methodOutputs && methodOutputs[0] && methodOutputs[0].type
					outputValues[0] = this.setOutputValue(result, type)
				}
				this.setState({
					outputValues,
				})
				this.updateOutputsView()
			})
			.catch((err) => {
				this.props.hideLoadingIndication()
				this.props.hideToast()
				return this.props.displayWarning(err)
			})
		} catch (e) {
			this.props.hideToast()
			return this.props.displayWarning(e)
		}
	}

	setOutputValue = (val, type) => {
		const { web3 } = this.state
		if (!type) {
			return val || ''
		}
		if (!val) {
			if (type === 'bool') {
				return val
			}
			return ''
		}
		if (this.isUintIntType(type)) {
			if (val && typeof val === 'string') {
				val = web3.toBigNumber(val)
			}
			return val.toFixed().toString()
		}
		return val
	}

	isUintIntType = (type) => {
		return (type.startsWith('uint') || type.startsWith('int')) && !type.includes('[')
	}

	encodeFunctionCall = () => {
		const { inputValues, methodABI } = this.state
		const { inputs } = methodABI
		const inputValuesArray = Object.keys(inputValues).map(key => {
			const input = inputs[key]
			const {type: inputType} = input
			let val = inputValues[key]
			if (this._isNonSpaceType(inputType)) { val = val.replace(/\s/g, '') }
			if (this._isAddressType(inputType)) {
				val = val.replaceAll('"', '')
			}
			if (this._isArrayType(inputType)) {
				if (val.startsWith('[') && val.endsWith(']')) {
					val = val.substring(1, val.length - 1)
				}
				if (val === '') {
					return []
				} else {
					return val.split(',')
				}
			} else {
				return val
			}
		})
		let txData
		try {
			txData = abi.encodeFunctionCall(methodABI, inputValuesArray)
			this.props.hideWarning()
		} catch (e) {
			this.props.hideToast()
			this.props.displayWarning(e)
		}

		return txData
	}

	_isArrayType = (type) => {
		return type && type.includes('[') && type.includes(']')
	}

	_isNonSpaceType (type) {
		return type && type.includes('address') || type.includes('int') || type.includes('bool')
	}

	_isAddressType (type) {
		return type && type.includes('address')
	}

	copyAbiEncoded = () => {
		const txData = this.encodeFunctionCall()
		if (txData) {
			copyToClipboard(txData)
			this.props.displayToast('Contract ABI encoded method call has been successfully copied to clipboard')
		}
	}

	onSubmit = () => {
		const { inputValues, txValue, methodABI, methodSelected } = this.state
		const { address } = this.props
		const txData = this.encodeFunctionCall()

		if (txData) {
			this.props.hideWarning()

			const txParams = {
				value: txValue,
				data: txData,
				to: address,
			}

			this.props.showChooseContractExecutorPage({methodSelected, methodABI, inputValues, txParams})
		}
	}
}

function mapStateToProps (state) {
	const contractAcc = state.appState.contractAcc
	const result = {
		address: state.metamask.selectedAddress,
		warning: state.appState.warning,
		methodSelected: contractAcc && contractAcc.methodSelected,
		methodABI: contractAcc && contractAcc.methodABI,
		inputValues: contractAcc && contractAcc.inputValues,
		provider: state.metamask.provider,
		RPC_URL: state.appState.RPC_URL,
		network: state.metamask.network,
	}

	result.error = result.warning && result.warning.message

	return result
}

function mapDispatchToProps (dispatch) {
	return {
		showLoadingIndication: () => dispatch(actions.showLoadingIndication()),
		hideLoadingIndication: () => dispatch(actions.hideLoadingIndication()),
		getContract: (addr) => dispatch(actions.getContract(addr)),
		displayToast: (msg) => dispatch(actions.displayToast(msg)),
		hideToast: () => dispatch(actions.hideToast()),
		displayWarning: (msg) => dispatch(actions.displayWarning(msg)),
		hideWarning: () => dispatch(actions.hideWarning()),
		showChooseContractExecutorPage: ({
			methodSelected,
			methodABI,
			inputValues,
			txParams,
		}) => dispatch(actions.showChooseContractExecutorPage({
			methodSelected,
			methodABI,
			inputValues,
			txParams,
		})),
	}
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(SendTransactionScreen)
