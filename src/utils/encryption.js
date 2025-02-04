// This is a simple encryption implementation
// In production, you might want to use a more robust encryption library
export async function encrypt(data, password) {
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)
  
  // Generate key from password
  const key = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )

  // Generate encryption key
  const encryptionKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new Uint8Array(16),
      iterations: 100000,
      hash: 'SHA-256'
    },
    key,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )

  // Generate IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12))

  // Encrypt the data
  const encryptedContent = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    encryptionKey,
    data
  )

  // Combine IV and encrypted content
  const encryptedData = new Uint8Array(iv.length + encryptedContent.byteLength)
  encryptedData.set(iv)
  encryptedData.set(new Uint8Array(encryptedContent), iv.length)

  return encryptedData
}

export async function decrypt(encryptedData, password) {
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)

  // Extract IV
  const iv = encryptedData.slice(0, 12)
  const data = encryptedData.slice(12)

  // Generate key from password
  const key = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )

  // Generate decryption key
  const decryptionKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new Uint8Array(16),
      iterations: 100000,
      hash: 'SHA-256'
    },
    key,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )

  // Decrypt the data
  const decryptedContent = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    decryptionKey,
    data
  )

  return decryptedContent
}

export const hashPassword = async (password) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export const verifyPassword = async (password, savedHash) => {
  const hashedPassword = await hashPassword(password)
  return hashedPassword === savedHash
} 