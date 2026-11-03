import { useId, type ButtonHTMLAttributes, type Ref } from 'react';
import { Icon, type IconName } from './Icon';

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> & {
  variant?: 'primary' | 'secondary' | 'danger'; action?: boolean; icon?: IconName;
  purpose?: 'view' | 'preview' | 'action';
  ref?: Ref<HTMLButtonElement>;
} & ({ disabled?: false; disabledReason?: never } | { disabled: boolean; disabledReason: string });

export function Button({ variant = 'secondary', purpose = 'action', action = false, icon, disabledReason, children,
  className = '', type = 'button', ...props }: Props) {
  const reasonId = useId();
  const describedBy = [props['aria-describedby'], props.disabled && disabledReason ? reasonId : ''].filter(Boolean).join(' ') || undefined;
  return (
    <>
      <button {...props} type={type} data-purpose={purpose} aria-describedby={describedBy}
        className={`nf-button nf-button--${variant} ${action ? 'nf-button--action' : ''} ${className}`}>
        {icon && <Icon name={icon} />}{children && <span>{children}</span>}
      </button>
      {props.disabled && disabledReason && <span className="nf-note" id={reasonId}>{disabledReason}</span>}
    </>
  );
}
