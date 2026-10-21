import { CSSProperties, ElementType, ReactNode } from 'react';
import './StarBorder.css';

type StarBorderProps<T extends ElementType = 'button'> = {
  as?: T;
  children: ReactNode;
  className?: string;
  color?: string;
  speed?: string;
  style?: CSSProperties;
  [key: string]: unknown;
};

export function StarBorder<T extends ElementType = 'button'>({
  as,
  children,
  className = '',
  color = '#60A5FA',
  speed = '6s',
  style,
  ...rest
}: StarBorderProps<T>) {
  const Tag = (as ?? 'button') as ElementType;
  return (
    <Tag
      className={`star-border-wrapper ${className}`}
      style={{ '--star-color': color, '--star-speed': speed, ...style } as CSSProperties}
      {...rest}
    >
      <span className="star-border-track star-border-top" />
      <span className="star-border-track star-border-bottom" />
      <span className="star-border-content">{children}</span>
    </Tag>
  );
}
