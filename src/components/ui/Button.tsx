import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

/**
 * Unified button component with variants
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseClass = 'ui-button'
  const variantClass = `${baseClass}--${variant}`
  const sizeClass = `${baseClass}--${size}`
  const classes = `${baseClass} ${variantClass} ${sizeClass} ${className}`

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode
  label?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
}

/**
 * Icon button component - for toolbar and minimal UI
 */
export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  label,
  size = 'md',
  variant = 'ghost',
  className = '',
  title,
  ...props
}) => {
  const baseClass = 'icon-button'
  const variantClass = `${baseClass}--${variant}`
  const sizeClass = `${baseClass}--${size}`
  const labelClass = label ? `${baseClass}--with-label` : ''
  const classes = `${baseClass} ${variantClass} ${sizeClass} ${labelClass} ${className}`

  return (
    <button className={classes} title={label || title} {...props}>
      <span className="icon-button__icon">{icon}</span>
      {label && <span className="icon-button__label">{label}</span>}
    </button>
  )
}

interface TooltipProps {
  content: string
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

/**
 * Tooltip component for additional context
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  side = 'top',
  delay = 200,
}) => {
  const [isVisible, setIsVisible] = React.useState(false)

  return (
    <div className={`tooltip tooltip--${side}`}>
      <div
        onMouseEnter={() => setTimeout(() => setIsVisible(true), delay)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && <div className="tooltip__content">{content}</div>}
    </div>
  )
}
