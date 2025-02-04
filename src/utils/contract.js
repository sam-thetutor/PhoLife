import { ethers } from 'ethers'
import PhotoStorageABI from '../contracts/PhotoStorage.json'

const CONTRACT_ADDRESS = '0x0246A2f0CDf19bFf7C4f9EBa0fD72dD947A11D48'

export const getContract = (signer) => {
  // Create contract instance directly with ABI
  return new ethers.Contract(
    CONTRACT_ADDRESS,
    PhotoStorageABI, // The ABI is already in the correct format
    signer
  )
}

export const addPhoto = async (signer, url, name, size, isPrivate) => {
  try {
   // upload photo to smart contract
   console.log('uploading photo to smart contract')
    if (!signer?.provider) {
      throw new Error('No provider attached to signer')
    }
    
    const contract = getContract(signer)
    const tx = await contract.addPhoto(url, name, size, isPrivate)
    console.log('tx', tx)
    await tx.wait() // Wait for transaction to be mined
    return true
  } catch (error) {
    console.error('Error adding photo to contract:', error)
    throw error
  }
}

export const setPrivateFolderHash = async (signer, hash) => {
  try {
    if (!signer?.provider) {
      throw new Error('No provider attached to signer')
    }

    const contract = getContract(signer)
    const tx = await contract.setPrivateFolderHash(hash)
    await tx.wait()
    return true
  } catch (error) {
    console.error('Error setting private folder hash:', error)
    throw error
  }
}

export const getPhotos = async (signer) => {
  try {
    const contract = getContract(signer)
    const photos = await contract.getPhotos()
    console.log('Raw photos from contract:', photos)
    
    const mappedPhotos = photos.map(photo => ({
      url: photo.url,
      name: photo.name,
      timestamp: new Date(Number(photo.timestamp) * 1000).toISOString(),
      size: Number(photo.size),
      isPrivate: photo.isPrivate
    }))
    console.log('Mapped photos:', mappedPhotos)
    
    return mappedPhotos
  } catch (error) {
    console.error('Error getting photos:', error)
    throw error
  }
}

export const getPrivateFolderHash = async (signer) => {
  try {
    const contract = getContract(signer)
    return await contract.getPrivateFolderHash()
  } catch (error) {
    console.error('Error getting private folder hash:', error)
    throw error
  }
} 