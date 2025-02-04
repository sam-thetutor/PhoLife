import PropTypes from 'prop-types'

const ConnectWallet = ({ account, onConnect, onDisconnect }) => {
  const handleConnect = async () => {
    try {
      await onConnect()
    } catch (error) {
      console.error('Failed to connect:', error)
      alert(error.message)
    }
  }

  return (
    <div className="wallet-container">
      {account ? (
        <div className="account-info">
          <span>{`${account.slice(0, 6)}...${account.slice(-4)}`}</span>
          <button onClick={onDisconnect}>Disconnect</button>
        </div>
      ) : (
        <button onClick={handleConnect}>
          Connect Wallet
        </button>
      )}
    </div>
  )
}

ConnectWallet.propTypes = {
  account: PropTypes.string,
  onConnect: PropTypes.func.isRequired,
  onDisconnect: PropTypes.func.isRequired
}

export default ConnectWallet 