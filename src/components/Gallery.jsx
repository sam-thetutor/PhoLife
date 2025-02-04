import { useState } from 'react'
import PropTypes from 'prop-types'

const Gallery = ({ images, loading }) => {
  const [sortOrder, setSortOrder] = useState('desc') // 'desc' or 'asc'

  const sortedImages = [...images].sort((a, b) => {
    const comparison = new Date(a.timestamp) - new Date(b.timestamp)
    return sortOrder === 'desc' ? -comparison : comparison
  })

  if (loading) {
    return <div className="loading">Loading your gallery...</div>
  }

  return (
    <div className="gallery-container">
      <div className="gallery-controls">
        <select 
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>

      {sortedImages.length === 0 ? (
        <div className="empty-gallery">
          No images uploaded yet
        </div>
      ) : (
        <div className="gallery-grid">
          {sortedImages.map((image) => (
            <div key={image.id} className="gallery-item">
              <img 
                src={image.url} 
                alt={image.name}
                loading="lazy"
              />
              <div className="image-info">
                <span>{image.name}</span>
                <span>{new Date(image.timestamp).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

Gallery.propTypes = {
  images: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      timestamp: PropTypes.string.isRequired
    })
  ).isRequired,
  loading: PropTypes.bool.isRequired
}

export default Gallery 