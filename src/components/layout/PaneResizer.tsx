import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface PaneResizerProps {
  /**
   * The pane being resized ('list' or 'pop')
   */
  pane: 'list' | 'pop';
  
  /**
   * Callback when resize starts
   */
  onResizeStart?: () => void;
  
  /**
   * Callback during resize with new width
   */
  onResize: (width: number) => void;
  
  /**
   * Callback when resize ends
   */
  onResizeEnd?: () => void;
  
  /**
   * Minimum width constraint
   */
  minWidth: number;
  
  /**
   * Maximum width constraint
   */
  maxWidth: number;
  
  /**
   * Current width of the pane
   */
  currentWidth: number;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function PaneResizer({
  pane,
  onResizeStart,
  onResize,
  onResizeEnd,
  minWidth,
  maxWidth,
  currentWidth,
  className,
}: PaneResizerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [previewWidth, setPreviewWidth] = useState<number | null>(null);
  const [isAtConstraint, setIsAtConstraint] = useState<'min' | 'max' | null>(null);
  
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  // Handle mouse down to start dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = currentWidth;
    
    if (onResizeStart) {
      onResizeStart();
    }
  }, [currentWidth, onResizeStart]);

  // Handle mouse move during drag
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      
      const deltaX = pane === 'list' 
        ? e.clientX - startXRef.current  // List pane: positive delta = wider
        : startXRef.current - e.clientX; // Pop pane: negative delta = wider (resizing from right edge)
      
      const newWidth = startWidthRef.current + deltaX;
      
      // Clamp to constraints
      const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      
      // Check if at constraint
      if (constrainedWidth === minWidth) {
        setIsAtConstraint('min');
      } else if (constrainedWidth === maxWidth) {
        setIsAtConstraint('max');
      } else {
        setIsAtConstraint(null);
      }
      
      // Update preview width for visual feedback
      setPreviewWidth(constrainedWidth);
      
      // Call resize callback
      onResize(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setPreviewWidth(null);
      setIsAtConstraint(null);
      
      if (onResizeEnd) {
        onResizeEnd();
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, pane, minWidth, maxWidth, onResize, onResizeEnd]);

  // Prevent text selection during drag
  useEffect(() => {
    if (isDragging) {
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    } else {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging]);

  return (
    <div
      className={cn(
        "relative group",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Resize handle */}
      <div
        className={cn(
          "absolute top-0 bottom-0 w-1 cursor-col-resize transition-colors",
          "hover:bg-primary/20",
          isDragging && "bg-primary/30",
          isHovered && !isDragging && "bg-border",
          pane === 'list' ? "right-0" : "left-0"
        )}
        onMouseDown={handleMouseDown}
        role="separator"
        aria-orientation="vertical"
        aria-label={`Resize ${pane} pane`}
        aria-valuenow={currentWidth}
        aria-valuemin={minWidth}
        aria-valuemax={maxWidth}
      >
        {/* Wider hit area for easier interaction */}
        <div className="absolute inset-y-0 -left-1 -right-1 w-3" />
      </div>

      {/* Visual feedback for hover state */}
      {isHovered && !isDragging && (
        <div
          className={cn(
            "absolute top-0 bottom-0 w-0.5 bg-primary/40 pointer-events-none transition-opacity",
            pane === 'list' ? "right-0" : "left-0"
          )}
        />
      )}

      {/* Preview guide during drag */}
      {isDragging && previewWidth !== null && (
        <div
          className={cn(
            "absolute top-0 bottom-0 w-0.5 bg-primary pointer-events-none z-50",
            pane === 'list' ? "right-0" : "left-0"
          )}
        >
          {/* Constraint feedback indicator */}
          {isAtConstraint && (
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2 px-2 py-1 rounded text-xs font-medium",
                "bg-primary text-primary-foreground shadow-lg whitespace-nowrap",
                pane === 'list' ? "-right-20" : "-left-20"
              )}
            >
              {isAtConstraint === 'min' ? `Min: ${minWidth}px` : `Max: ${maxWidth}px`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
