import { zenShotAsset } from "./zen-shots";

interface ZenPictureProps {
  /** Key into the shot manifest, e.g. "windows/dashboard.png". */
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  /** Renders a <button> instead of a bare <img> wrapper, for the lightbox trigger. */
  onClick?: () => void;
  /** Crop to a fixed aspect ratio (e.g. "aspect-video") instead of the
   *  image's intrinsic ratio — for thumbnail grids where every tile must be
   *  the same height. The wrapper still carries width/height via CSS
   *  aspect-ratio, so there's still no layout shift. */
  aspectClassName?: string;
}

/**
 * <picture> with a WebP 1x/2x source (density descriptors — these are fixed
 * device-surface sizes, not viewport-relative, so `sizes` doesn't apply) and
 * the original PNG as the no-WebP fallback. Explicit width/height on the
 * <img> come from the manifest, so there's no layout shift either way.
 */
export function ZenPicture({
  src,
  alt,
  className = "",
  imgClassName = "",
  priority = false,
  onClick,
  aspectClassName,
}: ZenPictureProps) {
  const asset = zenShotAsset(src);

  // Static export (images.unoptimized) plus a hand-authored <picture> for
  // WebP 1x/2x with a PNG fallback; next/image can't express that source
  // set, so this deliberately stays a plain <img>.
  const imgEl = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={asset.png}
      alt={alt}
      width={asset.width}
      height={asset.height}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding={priority ? "sync" : "async"}
      className={
        aspectClassName
          ? `absolute inset-0 h-full w-full object-cover ${imgClassName}`
          : `block h-auto w-full ${imgClassName}`
      }
    />
  );

  const picture = (
    <picture>
      <source type="image/webp" srcSet={`${asset.webp1x} 1x, ${asset.webp2x} 2x`} />
      {imgEl}
    </picture>
  );

  const wrapped = aspectClassName ? (
    <div className={`relative w-full overflow-hidden ${aspectClassName}`}>{picture}</div>
  ) : (
    picture
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`block w-full cursor-zoom-in text-left ${className}`}
        aria-label={`View larger: ${alt}`}
      >
        {wrapped}
      </button>
    );
  }

  return <div className={className}>{wrapped}</div>;
}
