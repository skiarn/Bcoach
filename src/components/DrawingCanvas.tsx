import React, { useRef, useState, useEffect } from "react";

type Tool = "line" | "circle" | "none";

interface DrawingCanvasProps {
  width: number;
  height: number;
  tool: Tool;
  shapes: Shape[];
  onShapesChange: (shapes: Shape[]) => void;
}

interface Shape {
  type: "line" | "circle";
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ width, height, tool, shapes, onShapesChange }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);

  // Rita allt
  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, width, height);

    [...shapes, currentShape]
      .filter(Boolean)
      .forEach((shape) => {
        if (!shape) return;

        ctx.beginPath();
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;

        if (shape.type === "line") {
          ctx.moveTo(shape.startX, shape.startY);
          ctx.lineTo(shape.endX, shape.endY);
        }

        if (shape.type === "circle") {
          const radius = Math.sqrt(
            Math.pow(shape.endX - shape.startX, 2) +
              Math.pow(shape.endY - shape.startY, 2)
          );
          ctx.arc(shape.startX, shape.startY, radius, 0, Math.PI * 2);
        }

        ctx.stroke();
      });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    draw(ctx);
  }, [shapes, currentShape]);

  // Mouse events
  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Touch events
  const getTouchPos = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0] || e.changedTouches[0];
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === "none") return;

    const { x, y } = getMousePos(e);

    setIsDrawing(true);
    setCurrentShape({
      type: tool,
      startX: x,
      startY: y,
      endX: x,
      endY: y,
    });
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (tool === "none") return;
    e.preventDefault(); // Prevent scrolling

    const { x, y } = getTouchPos(e);

    setIsDrawing(true);
    setCurrentShape({
      type: tool,
      startX: x,
      startY: y,
      endX: x,
      endY: y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentShape) return;

    const { x, y } = getMousePos(e);

    setCurrentShape({
      ...currentShape,
      endX: x,
      endY: y,
    });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentShape) return;
    e.preventDefault(); // Prevent scrolling

    const { x, y } = getTouchPos(e);

    setCurrentShape({
      ...currentShape,
      endX: x,
      endY: y,
    });
  };

  const handleMouseUp = () => {
    if (!currentShape) return;

    onShapesChange([...shapes, currentShape]);
    setCurrentShape(null);
    setIsDrawing(false);
  };

  const handleTouchEnd = () => {
    if (!currentShape) return;

    onShapesChange([...shapes, currentShape]);
    setCurrentShape(null);
    setIsDrawing(false);
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 10,
        backgroundColor: "transparent",
        touchAction: "none",
        pointerEvents: tool === "none" ? "none" : "auto",
        border: "none"
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
};

export default DrawingCanvas;