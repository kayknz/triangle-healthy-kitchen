import { useState } from 'react';

export default function SafeImage({ src, alt, className }: { src: string, alt: string, className?: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <img
      src={src}
      alt={alt}
      onLoad={() => setLoaded(true)}
      className={`reveal-image ${loaded ? 'loaded' : ''} ${className}`}
      loading="lazy"
    />
  );
}
