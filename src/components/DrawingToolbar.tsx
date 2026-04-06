import React, { useState } from 'react'
import { useDeviceType } from '../hooks/useDeviceType'
import { IconButton } from './ui/Button'
import * as Icons from './ui/Icons'

type DrawingTool = 'line' | 'circle' | 'rectangle' | 'arrow' | 'eraser' | 'none'

interface DrawingToolbarProps {
  selectedTool: DrawingTool
  onToolChange: (tool: DrawingTool) => void
  onDeleteSelected?: () => void
  canDeleteSelected?: boolean
  color?: string
  onColorChange?: (color: string) => void
  strokeWidth?: number
  onStrokeWidthChange?: (width: number) => void
  opacity?: number
  onOpacityChange?: (opacity: number) => void
}

const COLORS = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#000000', '#ffffff']
const STROKE_WIDTHS = [1, 2, 3, 5, 8]

/**
 * Professional drawing toolbar with responsive design
 * Desktop: Vertical sidebar or horizontal toolbar
 * Tablet: Horizontal with tabs
 * Mobile: Floating button or bottom drawer
 */
export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  selectedTool,
  onToolChange,
  onDeleteSelected,
  canDeleteSelected = false,
  color = '#ff0000',
  onColorChange,
  strokeWidth = 2,
  onStrokeWidthChange,
  opacity = 1,
  onOpacityChange,
}) => {
  const deviceType = useDeviceType()
  const [expandedSection, setExpandedSection] = useState<'tools' | 'properties' | null>('tools')

  const isMobile = deviceType === 'mobile'
  const isDesktop = deviceType === 'desktop'

  const toolOptions: Array<{ id: DrawingTool; icon: React.ReactNode; label: string }> = [
    { id: 'line', icon: <Icons.LineIcon />, label: 'Line' },
    { id: 'circle', icon: <Icons.CircleIcon />, label: 'Circle' },
    { id: 'rectangle', icon: <Icons.RectangleIcon />, label: 'Rectangle' },
    { id: 'arrow', icon: <Icons.ArrowIcon />, label: 'Arrow' },
    { id: 'eraser', icon: <Icons.EraserIcon />, label: 'Eraser' },
  ]

  // Mobile: Bottom drawer interface
  if (isMobile) {
    return (
      <div className="drawing-toolbar drawing-toolbar--mobile">
        {/* Tabs */}
        <div className="drawing-toolbar__mobile-tabs">
          <button
            className={`drawing-toolbar__tab ${expandedSection === 'tools' ? 'active' : ''}`}
            onClick={() => setExpandedSection(expandedSection === 'tools' ? null : 'tools')}
          >
            🎨 Tools
          </button>
          <button
            className={`drawing-toolbar__tab ${expandedSection === 'properties' ? 'active' : ''}`}
            onClick={() => setExpandedSection(expandedSection === 'properties' ? null : 'properties')}
          >
            ⚙️ Properties
          </button>
        </div>

        {/* Tools Section */}
        {expandedSection === 'tools' && (
          <div className="drawing-toolbar__mobile-panel">
            <div className="drawing-toolbar__tool-grid">
              {toolOptions.map((tool) => (
                <button
                  key={tool.id}
                  className={`drawing-toolbar__tool-button ${selectedTool === tool.id ? 'active' : ''}`}
                  onClick={() => {
                    onToolChange(tool.id)
                    setExpandedSection(null)
                  }}
                  title={tool.label}
                >
                  <span className="drawing-toolbar__tool-icon">{tool.icon}</span>
                  <span className="drawing-toolbar__tool-label">{tool.label}</span>
                </button>
              ))}
            </div>

            {/* Action buttons */}
            {onDeleteSelected && (
              <div className="drawing-toolbar__actions">
                <IconButton
                  icon={<Icons.TrashIcon />}
                  label="Delete"
                  size="md"
                  onClick={onDeleteSelected}
                  disabled={!canDeleteSelected}
                  variant="danger"
                />
              </div>
            )}
          </div>
        )}

        {/* Properties Section */}
        {expandedSection === 'properties' && (
          <div className="drawing-toolbar__mobile-panel">
            {/* Color picker */}
            {onColorChange && (
              <div className="drawing-toolbar__property">
                <label className="drawing-toolbar__property-label">Color</label>
                <div className="drawing-toolbar__color-grid">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      className={`drawing-toolbar__color-swatch ${color === c ? 'active' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => {
                        onColorChange(c)
                      }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Stroke width */}
            {onStrokeWidthChange && (
              <div className="drawing-toolbar__property">
                <label className="drawing-toolbar__property-label">Stroke Width: {strokeWidth}px</label>
                <div className="drawing-toolbar__slider-container">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={strokeWidth}
                    onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
                    className="drawing-toolbar__slider"
                  />
                </div>
                <div className="drawing-toolbar__quick-widths">
                  {STROKE_WIDTHS.map((w) => (
                    <button
                      key={w}
                      className={`drawing-toolbar__width-button ${strokeWidth === w ? 'active' : ''}`}
                      onClick={() => onStrokeWidthChange(w)}
                      title={`${w}px`}
                    >
                      <div className="drawing-toolbar__width-preview" style={{ height: `${w}px` }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Opacity */}
            {onOpacityChange && (
              <div className="drawing-toolbar__property">
                <label className="drawing-toolbar__property-label">Opacity: {Math.round(opacity * 100)}%</label>
                <div className="drawing-toolbar__slider-container">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={opacity}
                    onChange={(e) => onOpacityChange(Number(e.target.value))}
                    className="drawing-toolbar__slider"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Desktop/Tablet: Sidebar or horizontal toolbar
  return (
    <div className={`drawing-toolbar drawing-toolbar--${isDesktop ? 'desktop' : 'tablet'}`}>
      {/* Tool selection */}
      <div className="drawing-toolbar__section">
        <h3 className="drawing-toolbar__section-title">Tools</h3>
        <div className={`drawing-toolbar__tools ${isDesktop ? 'vertical' : 'horizontal'}`}>
          {toolOptions.map((tool) => (
            <IconButton
              key={tool.id}
              icon={tool.icon}
              label={isDesktop ? tool.label : undefined}
              size={isDesktop ? 'md' : 'sm'}
              onClick={() => onToolChange(tool.id)}
              className={selectedTool === tool.id ? 'active' : ''}
              variant={selectedTool === tool.id ? 'primary' : 'secondary'}
            />
          ))}
        </div>
      </div>

      {/* Color and properties */}
      <div className="drawing-toolbar__section">
        <h3 className="drawing-toolbar__section-title">Properties</h3>

        {onColorChange && (
          <div className="drawing-toolbar__property">
            <label className="drawing-toolbar__property-label">Color</label>
            <div className={`drawing-toolbar__color-grid ${isDesktop ? 'vertical' : ''}`}>
              {COLORS.map((c) => (
                <button
                  key={c}
                  className={`drawing-toolbar__color-swatch ${color === c ? 'active' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => onColorChange(c)}
                  title={c}
                />
              ))}
            </div>
          </div>
        )}

        {onStrokeWidthChange && (
          <div className="drawing-toolbar__property">
            <label className="drawing-toolbar__property-label">Stroke: {strokeWidth}px</label>
            <div className="drawing-toolbar__quick-widths">
              {STROKE_WIDTHS.map((w) => (
                <button
                  key={w}
                  className={`drawing-toolbar__width-button ${strokeWidth === w ? 'active' : ''}`}
                  onClick={() => onStrokeWidthChange(w)}
                  title={`${w}px`}
                >
                  <div className="drawing-toolbar__width-preview" style={{ height: `${w}px` }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {onOpacityChange && (
          <div className="drawing-toolbar__property">
            <label className="drawing-toolbar__property-label">Opacity: {Math.round(opacity * 100)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={opacity}
              onChange={(e) => onOpacityChange(Number(e.target.value))}
              className="drawing-toolbar__slider"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      {onDeleteSelected && (
        <div className="drawing-toolbar__section">
          <h3 className="drawing-toolbar__section-title">Actions</h3>
          <div className={`drawing-toolbar__actions ${isDesktop ? 'vertical' : ''}`}>
            <IconButton
              icon={<Icons.TrashIcon />}
              label="Delete"
              size={isDesktop ? 'md' : 'sm'}
              onClick={onDeleteSelected}
              disabled={!canDeleteSelected}
              variant="danger"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default DrawingToolbar
