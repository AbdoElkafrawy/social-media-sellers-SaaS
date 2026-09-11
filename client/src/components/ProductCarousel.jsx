import { useState } from 'react';

function ProductCarousel({ images, name, height = '200px' }) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="card-image-placeholder">
        <span>🛍️ Photo Coming Soon</span>
      </div>
    );
  }

  const handleNext = (e) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev + 1) % images.length);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="card-image-gallery" style={{ height }}>
      <img
        src={images[activeIdx]}
        alt={`${name} - photo ${activeIdx + 1}`}
        className="card-main-image"
        loading="lazy"
        onError={(e) => {
          e.currentTarget.onerror = null; // prevent infinite loop
          e.currentTarget.src = '';
          e.currentTarget.style.display = 'none';
          const placeholder = e.currentTarget.nextElementSibling;
          if (placeholder) placeholder.style.display = 'flex';
        }}
      />
      <div className="card-image-placeholder" style={{ display: 'none' }}>
        <span>🛍️ Photo Unavailable</span>
      </div>

      {images.length > 1 && (
        <>
          <span className="image-count-badge">
            📸 {activeIdx + 1}/{images.length}
          </span>
          <button type="button" className="carousel-btn prev" onClick={handlePrev} title="Previous photo">
            ‹
          </button>
          <button type="button" className="carousel-btn next" onClick={handleNext} title="Next photo">
            ›
          </button>
          <div className="carousel-dots">
            {images.map((_, i) => (
              <span
                key={i}
                className={`carousel-dot ${i === activeIdx ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIdx(i);
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default ProductCarousel;
