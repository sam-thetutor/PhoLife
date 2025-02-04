import { useEffect } from 'react'
import './App.css'
import Gallery from './components/Gallery'
import Upload from './components/Upload'
import ConnectWallet from './components/ConnectWallet'
import PrivateFolder from './components/PrivateFolder'
import { AppProvider, useApp } from './context/AppContext'

function AppContent() {
  const { 
    isInitializing,
    wallet,
    connectWallet,
    disconnectWallet,
  } = useApp()

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('chainChanged', () => {
        disconnectWallet()
        window.location.reload()
      })
      window.ethereum.on('accountsChanged', () => {
        disconnectWallet()
        window.location.reload()
      })
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', () => {})
        window.ethereum.removeListener('accountsChanged', () => {})
      }
    }
  }, [disconnectWallet])

  if (isInitializing) {
    return <div className="loading">Initializing storage...</div>
  }

  return (
    <div className="app-container">
      <header>
        <h1>Pholife 📸</h1>
        <ConnectWallet 
          account={wallet?.account} 
          onConnect={connectWallet}
          onDisconnect={disconnectWallet}
        />
      </header>

      {wallet?.account ? (
        <>
          <div className="upload-containers">
            <Upload />
            <PrivateFolder />
          </div>
          <Gallery />
        </>
      ) : (
        <div className="connect-prompt">
          Please connect your wallet to use Pholife
        </div>
      )}
    </div>
  )
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
