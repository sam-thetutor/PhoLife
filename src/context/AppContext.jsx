import { createContext, useContext, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { create } from '@web3-storage/w3up-client'
import { ethers } from 'ethers'
import { getPhotos, getPrivateFolderHash, setPrivateFolderHash } from '../utils/contract'
import { hashPassword, verifyPassword } from '../utils/encryption'

const SPACE_LOGIN = "did:key:z6MkqXuQNBGX3KJuvN5rRZjerfLvtBuUDWXGNiEH8wPP8cBq"
const VITE_WEB3STORAGE_EMAIL = "smartskillsweb3@gmail.com"

const AppContext = createContext()

export function AppProvider({ children }) {
  // Web3.storage state
  const [web3Client, setWeb3Client] = useState(null)
  const [isInitializing, setIsInitializing] = useState(true)

  // Wallet state
  const [wallet, setWallet] = useState({ account: null, signer: null })
  const [isConnecting, setIsConnecting] = useState(false)
  const [walletError, setWalletError] = useState(null)

  // Photos state
  const [photos, setPhotos] = useState([])
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false)

  // Private folder state
  const [isPrivateFolderSetup, setIsPrivateFolderSetup] = useState(false)
  const [isSettingUpFolder, setIsSettingUpFolder] = useState(false)
  const [privateFolderError, setPrivateFolderError] = useState(null)
  const [isPrivateFolderUnlocked, setIsPrivateFolderUnlocked] = useState(false)
  const [currentPassword, setCurrentPassword] = useState(null)

  // Initialize web3.storage
  useEffect(() => {
    async function initWeb3Storage() {
      try {
        const client = await create()
        await client.login(VITE_WEB3STORAGE_EMAIL)
        await client.setCurrentSpace(SPACE_LOGIN)
        setWeb3Client(client)
      } catch (error) {
        console.error("Error initializing web3.storage:", error)
      } finally {
        setIsInitializing(false)
      }
    }
    initWeb3Storage()
  }, [])

  // Check for existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          // Get connected accounts
          const accounts = await window.ethereum.request({ 
            method: 'eth_accounts' 
          })
          
          if (accounts.length > 0) {
            console.log('Found existing connection:', accounts[0])
            // Create provider and signer
            const provider = new ethers.BrowserProvider(window.ethereum)
            const signer = await provider.getSigner()
            
            // Set wallet state
            setWallet({
              account: accounts[0],
              signer
            })
          }
        } catch (error) {
          console.error('Error checking existing connection:', error)
        }
      }
    }

    checkConnection()
  }, [])

  // Load photos and check private folder when wallet changes
  useEffect(() => {
    if (wallet.signer) {
      loadPhotos()
      checkPrivateFolderSetup()
    }
  }, [wallet.signer])

  // Listen for account/chain changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          // User disconnected
          disconnectWallet()
        } else if (accounts[0] !== wallet.account) {
          // Account changed, reconnect with new account
          connectWallet()
        }
      }

      const handleChainChanged = () => {
        // Reload the page on chain change as recommended by MetaMask
        window.location.reload()
      }

      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [wallet.account])

  // Wallet functions
  const connectWallet = async () => {
    try {
      setIsConnecting(true)
      setWalletError(null)

      const { ethereum } = window
      if (!ethereum) {
        throw new Error('Please install MetaMask!')
      }

      console.log('ethereum wallet connecting')
      const accounts = await ethereum.request({ 
        method: 'eth_requestAccounts'
      })
      console.log('accounts', accounts)
      
      if (accounts.length > 0) {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()
        
        setWallet({
          account: accounts[0],
          signer
        })
      } else {
        throw new Error('No accounts found')
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      setWalletError(error.message)
      throw error
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setWallet({ account: null, signer: null })
    setPhotos([])
    setIsPrivateFolderUnlocked(false) // Lock private folder on disconnect
  }

  // Photos functions
  const loadPhotos = async () => {
    if (!wallet.signer) return
    
    setIsLoadingPhotos(true)
    try {
      const loadedPhotos = await getPhotos(wallet.signer)
      setPhotos(loadedPhotos)
    } catch (error) {
      console.error('Error loading photos:', error)
    } finally {
      setIsLoadingPhotos(false)
    }
  }

  const addPhotos = (newPhotos) => {
    setPhotos(prev => [...prev, ...newPhotos])
  }

  // Private folder functions
  const checkPrivateFolderSetup = async () => {
    if (!wallet.signer) return
    try {
      const hash = await getPrivateFolderHash(wallet.signer)
      setIsPrivateFolderSetup(!!hash)
    } catch (error) {
      console.error('Error checking private folder setup:', error)
    }
  }

  const setupPrivateFolder = async (password) => {
    if (!wallet.signer) throw new Error('No wallet connected')
    if (password.length < 6) throw new Error('Password must be at least 6 characters')
    
    setIsSettingUpFolder(true)
    setPrivateFolderError(null)
    
    try {
      const hashedPassword = await hashPassword(password)
      await setPrivateFolderHash(wallet.signer, hashedPassword)
      setIsPrivateFolderSetup(true)
    } catch (error) {
      setPrivateFolderError(error.message)
      throw error
    } finally {
      setIsSettingUpFolder(false)
    }
  }

  const verifyPrivateFolderAccess = async (password) => {
    if (!wallet.signer) throw new Error('No wallet connected')
    
    try {
      const savedHash = await getPrivateFolderHash(wallet.signer)
      if (!savedHash) {
        throw new Error('Private folder not set up')
      }

      const isValid = await verifyPassword(password, savedHash)
      if (!isValid) {
        throw new Error('Incorrect password')
      }

      setIsPrivateFolderUnlocked(true)
      setCurrentPassword(password)
      return true
    } catch (error) {
      console.error('Error verifying password:', error)
      throw error
    }
  }

  const lockPrivateFolder = () => {
    setIsPrivateFolderUnlocked(false)
    setCurrentPassword(null)
  }

  const value = {
    // Web3.storage
    web3Client,
    isInitializing,

    // Wallet
    wallet,
    isConnecting,
    walletError,
    connectWallet,
    disconnectWallet,

    // Photos
    photos,
    isLoadingPhotos,
    addPhotos,
    publicPhotos: photos.filter(p => !p.isPrivate),
    privatePhotos: photos.filter(p => p.isPrivate),

    // Private folder
    isPrivateFolderSetup,
    isSettingUpFolder,
    privateFolderError,
    setupPrivateFolder,
    isPrivateFolderUnlocked,
    verifyPrivateFolderAccess,
    lockPrivateFolder,
    currentPassword,
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

AppProvider.propTypes = {
  children: PropTypes.node.isRequired
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
} 