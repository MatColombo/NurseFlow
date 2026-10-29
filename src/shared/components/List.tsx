import type { HTMLAttributes, LiHTMLAttributes } from 'react';

export function List({ className = '', ...props }: HTMLAttributes<HTMLUListElement>) {
  return <ul role="list" {...props} className={`nf-list ${className}`} />;
}
export function ListItem({ className = '', ...props }: LiHTMLAttributes<HTMLLIElement>) {
  return <li {...props} className={`nf-list-item ${className}`} />;
}
