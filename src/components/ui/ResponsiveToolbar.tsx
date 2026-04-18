import React from 'react'
import { useDeviceType } from '../../hooks/useDeviceType'
import { useI18n } from '../../i18n/I18nProvider'
import { IconButton } from './Button'

export interface ToolbarGroup {
  id: string
  label?: string
  items: ToolbarItem[]
}

interface ToolbarItem {
  id: string
  icon: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
}

interface ResponsiveToolbarProps {
  groups: ToolbarGroup[]
  orientation?: 'horizontal' | 'vertical'
  alignment?: 'start' | 'center' | 'end'
}

/**
 * Responsive toolbar that adapts to device type and orientation
 *
 * Desktop: Horizontal layout with grouped items
 * Tablet: Horizontal with optional grouping
 * Mobile: Vertical stacked or tab-based interface
 */
export const ResponsiveToolbar: React.FC<ResponsiveToolbarProps> = ({
  groups,
  alignment = 'start',
}) => {
  const { t } = useI18n()
  const deviceType = useDeviceType()

  const isDesktop = deviceType === 'desktop'
  const isMobile = deviceType === 'mobile'

  // Mobile: compact horizontal scroller for quick access without deep scrolling
  if (isMobile) {
    const items = groups.flatMap((group) =>
      group.items.map((item) => ({ ...item, groupId: group.id }))
    )

    return (
      <div className="responsive-toolbar responsive-toolbar--mobile-compact">
        <div className="responsive-toolbar__mobile-scroll" role="toolbar" aria-label={t('controls.playbackToolsAria')}>
          {items.map((item) => (
            <IconButton
              key={`${item.groupId}-${item.id}`}
              icon={item.icon}
              label={item.label}
              onClick={item.onClick}
              disabled={item.disabled}
              className={`responsive-toolbar__mobile-item ${item.active ? 'active' : ''}`}
              variant={item.variant}
              size="md"
            />
          ))}
        </div>
      </div>
    )
  }

  // Desktop/Tablet: Horizontal layout
  return (
    <div
      className={`responsive-toolbar responsive-toolbar--${isDesktop ? 'desktop' : 'tablet'}`}
      style={{ justifyContent: alignment }}
    >
      {groups.map((group, groupIndex) => (
        <div key={group.id} className="responsive-toolbar__group">
          {groupIndex > 0 && <div className="responsive-toolbar__separator" />}

          <div className="responsive-toolbar__items">
            {group.items.map((item) => (
              <IconButton
                key={item.id}
                icon={item.icon}
                label={isDesktop ? item.label : undefined}
                onClick={item.onClick}
                disabled={item.disabled}
                className={item.active ? 'active' : ''}
                variant={item.variant}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ResponsiveToolbar
