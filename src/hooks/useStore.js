import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { create } from '@web3-storage/w3up-client'
import { ethers } from 'ethers'
import { getPhotos, getPrivateFolderHash, setPrivateFolderHash } from '../utils/contract'
import { hashPassword } from '../utils/encryption'

const SPACE_LOGIN = "did:key:z6MkqXuQNBGX3KJuvN5rRZjerfLvtBuUDWXGNiEH8wPP8cBq"
const VITE_WEB3STORAGE_EMAIL = "smartskillsweb3@gmail.com"

// Initialize web3.storage client
const initializeWeb3Storage = async () => {
  try {
    const web3Client = await create()
    await web3Client.login(VITE_WEB3STORAGE_EMAIL)
    await web3Client.setCurrentSpace(SPACE_LOGIN)
    return web3Client
  } catch (error) {
    console.error("Error initializing web3.storage:", error)
    throw error
  }
}

export function useWeb3Storage() {
  return useQuery({
    queryKey: ['web3Storage'],
    queryFn: initializeWeb3Storage,
    retry: 2,
  })
}

export function useWallet() {
  const queryClient = useQueryClient()

  const { data: wallet, ...rest } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => ({
      account: null,
      signer: null
    }),
    staleTime: Infinity,
  })

  const connectMutation = useMutation({
    mutationFn: async () => {
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
        const provider = new ethers.providers.Web3Provider(ethereum)
        await provider.send("eth_requestAccounts", [])
        
        const signer = provider.getSigner()
        
        return {
          account: accounts[0],
          signer
        }
      }
      throw new Error('No accounts found')
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['wallet'], data)
      queryClient.invalidateQueries(['photos'])
    },
  })

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      return { account: null, signer: null }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['wallet'], data)
      queryClient.setQueryData(['photos'], [])
    },
  })

  return {
    wallet,
    ...rest,
    connect: () => connectMutation.mutateAsync(),
    disconnect: () => disconnectMutation.mutateAsync(),
    isConnecting: connectMutation.isLoading,
    error: connectMutation.error
  }
}

export function usePrivateFolder() {
  const { wallet } = useWallet()
  const queryClient = useQueryClient()

  const { data: isSetup = false, ...rest } = useQuery({
    queryKey: ['privateFolder'],
    queryFn: async () => {
      if (!wallet?.signer) return false
      const hash = await getPrivateFolderHash(wallet.signer)
      return !!hash
    },
    enabled: !!wallet?.signer,
  })

  const setupMutation = useMutation({
    mutationFn: async ({ password }) => {
      if (!wallet?.signer) throw new Error('No wallet connected')
      if (password.length < 6) throw new Error('Password must be at least 6 characters')
      
      const hashedPassword = await hashPassword(password)
      await setPrivateFolderHash(wallet.signer, hashedPassword)
      return true
    },
    onSuccess: () => {
      queryClient.setQueryData(['privateFolder'], true)
    },
  })

  const unlockMutation = useMutation({
    mutationFn: async ({ password }) => {
      if (password.length < 6) throw new Error('Password must be at least 6 characters')
      // You might want to add password verification logic here
      return true
    },
  })

  return {
    isSetup,
    ...rest,
    setup: setupMutation.mutate,
    isSettingUp: setupMutation.isLoading,
    setupError: setupMutation.error,
    unlock: unlockMutation.mutate,
    isUnlocking: unlockMutation.isLoading,
    unlockError: unlockMutation.error,
  }
}

export function usePhotos() {
  const { wallet } = useWallet()
  const queryClient = useQueryClient()

  const { data: photos = [], ...rest } = useQuery({
    queryKey: ['photos'],
    queryFn: async () => {
      if (!wallet?.signer) return []
      return getPhotos(wallet.signer)
    },
    enabled: !!wallet?.signer,
  })

  const addPhotosMutation = useMutation({
    mutationFn: async (newPhotos) => {
      if (!wallet?.signer) throw new Error('No wallet connected')
      return newPhotos
    },
    onSuccess: (newPhotos) => {
      queryClient.setQueryData(['photos'], (old = []) => [...old, ...newPhotos])
    },
  })

  // Add function to get filtered photos
  const getFilteredPhotos = (showPrivate = false) => {
    return photos.filter(photo => photo.isPrivate === showPrivate)
  }

  return {
    photos,
    publicPhotos: getFilteredPhotos(false),
    privatePhotos: getFilteredPhotos(true),
    addPhotos: addPhotosMutation.mutate,
    isAdding: addPhotosMutation.isLoading,
    addError: addPhotosMutation.error,
    ...rest,
  }
} 