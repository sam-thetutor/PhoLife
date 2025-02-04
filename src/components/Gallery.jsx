import { useState, useMemo } from 'react'
import PropTypes from 'prop-types'
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns'
import { useApp } from '../context/AppContext'

const Gallery = () => {
  const { 
    photos, 
    isLoadingPhotos, 
    isPrivateFolderUnlocked 
  } = useApp()
  const [sortOrder, setSortOrder] = useState('desc') // 'desc' or 'asc'
  const [showPrivate, setShowPrivate] = useState(false)

  // Group images by time period
  const groupedImages = useMemo(() => {
    let filteredPhotos = photos.filter(photo => {
      // Only show private photos if the folder is unlocked
      if (photo.isPrivate) {
        return showPrivate && isPrivateFolderUnlocked
      }
      return !showPrivate
    })

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

  const renderSection = (title, images) => {
    if (images.length === 0) return null

    return (
      <div className="gallery-section">
        <h2 className="section-title">{title}</h2>
        <div className="gallery-grid">
          {images.map((image) => (
            <div key={image.id} className="gallery-item">
              <img 
                src={image.url} 
                alt={image.name}
                loading="lazy"
              />
              <div className="image-info">
                <span className="image-name">{image.name}</span>
                <span className="image-date">
                  {format(new Date(image.timestamp), 'MMM d, yyyy h:mm a')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isLoadingPhotos) {
    return <div className="loading">Loading your gallery...</div>
  }

  if (Object.values(groupedImages).every(group => group.length === 0)) {
    return (
      <div className="empty-gallery">
        No images uploaded yet
      </div>
    )
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

      {renderSection('Today', groupedImages.today)}
      {renderSection('Yesterday', groupedImages.yesterday)}
      {renderSection('This Week', groupedImages.thisWeek)}
      {renderSection('This Month', groupedImages.thisMonth)}
      {renderSection('Older', groupedImages.older)}
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