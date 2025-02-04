import { useState, useMemo, useEffect } from 'react'
import PropTypes from 'prop-types'
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns'
import { useApp } from '../context/AppContext'
import { decrypt } from '../utils/encryption'
import { FiDownload } from 'react-icons/fi'

const Gallery = () => {
  const { 
    photos, 
    isLoadingPhotos, 
    isPrivateFolderUnlocked,
    currentPassword
  } = useApp()

  const [sortOrder, setSortOrder] = useState('desc') // 'desc' or 'asc'
  const [showPrivate, setShowPrivate] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)
  const [downloadError, setDownloadError] = useState(null)
  const [decryptedUrls, setDecryptedUrls] = useState({}) // Store decrypted image URLs

  // Decrypt private photos when they're loaded
  useEffect(() => {
    const decryptPhotos = async () => {
      const newDecryptedUrls = {}  // Create new object instead of spreading existing
      
      for (const photo of photos) {
        if (photo.isPrivate && currentPassword) {
          try {
            const urls = JSON.parse(photo.url)
            const response = await fetch(urls.encrypted)
            const encryptedData = await response.arrayBuffer()
            const decryptedData = await decrypt(new Uint8Array(encryptedData), currentPassword)
            
            // Create unique blob URL for each decrypted image
            const blob = new Blob([decryptedData], { type: 'image/jpeg' })
            const blobUrl = URL.createObjectURL(blob)
            newDecryptedUrls[photo.id] = blobUrl

            console.log(`Decrypted photo ${photo.id}:`, {
              originalUrl: photo.url,
              decryptedUrl: blobUrl
            })
          } catch (error) {
            console.error(`Error decrypting photo ${photo.id}:`, error)
          }
        }
      }

      // Clean up old blob URLs before setting new ones
      Object.values(decryptedUrls).forEach(url => URL.revokeObjectURL(url))
      setDecryptedUrls(newDecryptedUrls)
    }

    if (isPrivateFolderUnlocked && currentPassword) {
      decryptPhotos()
    } else {
      // Clean up all blob URLs when folder is locked
      Object.values(decryptedUrls).forEach(url => URL.revokeObjectURL(url))
      setDecryptedUrls({})
    }

    // Cleanup on unmount
    return () => {
      Object.values(decryptedUrls).forEach(url => URL.revokeObjectURL(url))
    }
  }, [photos, isPrivateFolderUnlocked, currentPassword])

  // Group images by time period
  const groupedImages = useMemo(() => {
    console.log('All photos:', photos)
    console.log('Private folder unlocked:', isPrivateFolderUnlocked)
    console.log('Show private:', showPrivate)

    let filteredPhotos = photos.filter(photo => {
      if (showPrivate) {
        // Show private photos only when folder is unlocked
        return photo.isPrivate && isPrivateFolderUnlocked
      } else {
        // Show public photos
        return !photo.isPrivate
      }
    })

    console.log('Filtered photos:', filteredPhotos)

    const groups = {
      today: [],
      yesterday: [],
      thisWeek: [],
      thisMonth: [],
      older: []
    }

    const sortedImages = [...filteredPhotos].sort((a, b) => {
      const comparison = new Date(a.timestamp) - new Date(b.timestamp)
      return sortOrder === 'desc' ? -comparison : comparison
    })

    sortedImages.forEach(image => {
      const date = new Date(image.timestamp)
      if (isToday(date)) {
        groups.today.push(image)
      } else if (isYesterday(date)) {
        groups.yesterday.push(image)
      } else if (isThisWeek(date)) {
        groups.thisWeek.push(image)
      } else if (isThisMonth(date)) {
        groups.thisMonth.push(image)
      } else {
        groups.older.push(image)
      }
    })

    return groups
  }, [photos, sortOrder, showPrivate, isPrivateFolderUnlocked])

  const handleDownload = async (image) => {
    if (!image.isPrivate || !currentPassword) return
    
    setDownloadingId(image.id)
    setDownloadError(null)

    try {
      let encryptedUrl
      try {
        const urls = JSON.parse(image.url)
        encryptedUrl = urls.encrypted
      } catch (error) {
        console.error('Error parsing URLs:', error)
        encryptedUrl = image.url
      }
      
      // Fetch encrypted file
      const response = await fetch(encryptedUrl)
      const encryptedData = await response.arrayBuffer()
      
      // Decrypt the file
      const decryptedData = await decrypt(new Uint8Array(encryptedData), currentPassword)
      
      // Create and trigger download
      const blob = new Blob([decryptedData])
      const downloadUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = image.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Error downloading file:', error)
      setDownloadError('Failed to download file. Please check your password.')
    } finally {
      setDownloadingId(null)
    }
  }

  const renderSection = (title, images) => {
    if (images.length === 0) return null

    return (
      <div className="gallery-section">
        <h2 className="section-title">{title}</h2>
        {downloadError && (
          <div className="error-message">{downloadError}</div>
        )}
        <div className="gallery-grid">
          {images.map((image) => {
            let displayUrl = image.url

            if (image.isPrivate) {
              if (decryptedUrls[image.id]) {
                // Use decrypted URL if available
                displayUrl = decryptedUrls[image.id]
                console.log(`Using decrypted URL for ${image.id}:`, displayUrl)
              } else {
                // Fallback to thumbnail while decrypting
                try {
                  const urls = JSON.parse(image.url)
                  displayUrl = urls.thumbnail
                  console.log(`Using thumbnail for ${image.id}:`, displayUrl)
                } catch (error) {
                  console.error(`Error parsing URLs for ${image.id}:`, error)
                }
              }
            }

            return (
              <div key={`${image.id}-${displayUrl}`} className="gallery-item">
                <img 
                  src={displayUrl}
                  alt={image.name}
                  loading="lazy"
                />
                <div className="image-info">
                  <div className="image-details">
                    <span className="image-name">{image.name}</span>
                    <span className="image-date">
                      {format(new Date(image.timestamp), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  {image.isPrivate && (
                    <div className="image-actions">
                      <span className="private-badge">Private</span>
                      <button
                        className="download-button"
                        onClick={() => handleDownload(image)}
                        disabled={downloadingId === image.id}
                      >
                        {downloadingId === image.id ? (
                          'Decrypting...'
                        ) : (
                          <>
                            <FiDownload /> Download Original
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (isLoadingPhotos) {
    return <div className="loading">Loading your gallery...</div>
  }

  return (
    <div className="gallery-container">
      <div className="gallery-controls">
        <div className="gallery-toggles">
          <button 
            className={`toggle-button ${!showPrivate ? 'active' : ''}`}
            onClick={() => setShowPrivate(false)}
          >
            Public Photos
          </button>
          <button 
            className={`toggle-button ${showPrivate ? 'active' : ''}`}
            onClick={() => setShowPrivate(true)}
            disabled={!isPrivateFolderUnlocked}
          >
            Private Photos
          </button>
        </div>
        <select 
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>

      {Object.values(groupedImages).every(group => group.length === 0) ? (
        <div className="empty-gallery">
          {showPrivate ? (
            isPrivateFolderUnlocked ? 
              'No private photos uploaded yet' : 
              'Unlock your private folder to view private photos'
          ) : (
            'No public photos uploaded yet'
          )}
        </div>
      ) : (
        <>
          {renderSection('Today', groupedImages.today)}
          {renderSection('Yesterday', groupedImages.yesterday)}
          {renderSection('This Week', groupedImages.thisWeek)}
          {renderSection('This Month', groupedImages.thisMonth)}
          {renderSection('Older', groupedImages.older)}
        </>
      )}
    </div>
  )
}

Gallery.propTypes = {
  photos: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      timestamp: PropTypes.string.isRequired,
      isPrivate: PropTypes.bool.isRequired
    })
  ).isRequired,
  loading: PropTypes.bool.isRequired
}

export default Gallery 