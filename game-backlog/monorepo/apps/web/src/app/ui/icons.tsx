import type { SVGProps } from 'react';

// Pixel-style icons from the GameLibrary design. Decorative: hidden from screen readers.
type IconProps = Omit<SVGProps<SVGSVGElement>, 'viewBox'>;

function Pixel({
  viewBox,
  size = 16,
  children,
  ...rest
}: IconProps & { viewBox: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="currentColor"
      shapeRendering="crispEdges"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function LogoIcon(props: IconProps) {
  return (
    <svg
      width="22"
      height="16"
      viewBox="0 0 11 8"
      fill="currentColor"
      shapeRendering="crispEdges"
      aria-hidden="true"
      {...props}
    >
      <path
        fillRule="evenodd"
        d="M1 1h9v1h1v4h-1v1H7V6H4v1H1V6H0V2h1zM2 3h1V2h1v1h1v1H4v1H3V4H2zM7 3h1v1H7zM8 4h1v1H8z"
      />
    </svg>
  );
}

export function StatsIcon(props: IconProps) {
  return (
    <Pixel viewBox="0 0 8 8" {...props}>
      <path d="M0 4h2v4H0zM3 1h2v7H3zM6 3h2v5H6z" />
    </Pixel>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Pixel viewBox="0 0 8 8" {...props}>
      <path d="M1 0h3v1H1zM0 1h1v3H0zM4 1h1v3H4zM1 4h3v1H1zM5 5h1v1H5zM6 6h1v1H6zM7 7h1v1H7z" />
    </Pixel>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Pixel viewBox="0 0 12 12" size={14} {...props}>
      <path d="M5 1h2v10H5zM1 5h10v2H1z" />
    </Pixel>
  );
}

export function TrashIcon(props: IconProps & { size?: number }) {
  return (
    <Pixel viewBox="0 0 8 9" size={14} {...props}>
      <path d="M3 0h2v1H3zM0 1h8v1H0zM1 2h1v7H1zM6 2h1v7H6zM2 8h4v1H2zM3 3h1v4H3zM4 3h1v4H4z" />
    </Pixel>
  );
}

export function BackIcon(props: IconProps) {
  return (
    <Pixel viewBox="0 0 7 7" size={14} {...props}>
      <path d="M4 0h2v1H4zM3 1h2v1H3zM2 2h2v1H2zM1 3h2v1H1zM2 4h2v1H2zM3 5h2v1H3zM4 6h2v1H4z" />
    </Pixel>
  );
}
