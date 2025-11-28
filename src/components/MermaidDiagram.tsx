import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2, Move } from "lucide-react";

interface MermaidDiagramProps {
  chart: string;
}

export const MermaidDiagram = ({ chart }: MermaidDiagramProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      securityLevel: "loose",
      themeVariables: {
        primaryColor: "#4F46E5",
        primaryTextColor: "#E0E7FF",
        primaryBorderColor: "#6366F1",
        lineColor: "#818CF8",
        secondaryColor: "#10B981",
        tertiaryColor: "#F59E0B",
        background: "#1E293B",
        mainBkg: "#334155",
        textColor: "#E2E8F0",
        fontSize: "14px",
      },
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: "basis",
        padding: 20,
      },
    });
  }, []);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) return;

      try {
        setError(null);
        
        // Clean up the chart text - remove any extra whitespace and ensure proper formatting
        const cleanChart = chart.trim();
        
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        
        // Clear container first
        containerRef.current.innerHTML = '';
        
        const { svg } = await mermaid.render(id, cleanChart);
        containerRef.current.innerHTML = svg;
      } catch (err: any) {
        console.error("Mermaid render error:", err);
        setError(err.message || "Failed to render diagram. The diagram syntax may be invalid.");
      }
    };

    renderDiagram();
  }, [chart]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setStartPan({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPanOffset({
      x: e.clientX - startPan.x,
      y: e.clientY - startPan.y,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  if (error) {
    return (
      <div className="w-full p-4 border border-destructive rounded-lg bg-destructive/10">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex gap-2 justify-start">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleZoomIn}
          className="h-9 w-9 bg-slate-800 border-slate-700 hover:bg-slate-700"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleZoomOut}
          className="h-9 w-9 bg-slate-800 border-slate-700 hover:bg-slate-700"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleReset}
          className="h-9 w-9 bg-slate-800 border-slate-700 hover:bg-slate-700"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 text-xs text-muted-foreground ml-2">
          <Move className="h-3 w-3" />
          <span>Click and drag to pan</span>
        </div>
      </div>
      
      <div 
        className="relative rounded-lg overflow-hidden bg-slate-900 border border-slate-800"
        style={{ height: "600px" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          ref={containerRef}
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: isPanning ? "none" : "transform 0.2s ease-in-out",
            cursor: isPanning ? "grabbing" : "grab",
            minHeight: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          className="mermaid-container p-8"
        />
      </div>
    </div>
  );
};
