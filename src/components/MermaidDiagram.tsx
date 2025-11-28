import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface MermaidDiagramProps {
  chart: string;
}

export const MermaidDiagram = ({ chart }: MermaidDiagramProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose",
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: "basis",
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
  const handleReset = () => setZoom(1);

  if (error) {
    return (
      <div className="w-full p-4 border border-destructive rounded-lg bg-destructive/10">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="border rounded-lg p-4 bg-card overflow-auto max-h-[600px]">
        <div
          ref={containerRef}
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
            transition: "transform 0.2s ease-in-out",
          }}
          className="mermaid-container"
        />
      </div>
    </div>
  );
};
