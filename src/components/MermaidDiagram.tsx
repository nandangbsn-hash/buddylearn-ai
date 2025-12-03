import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2, AlertCircle } from "lucide-react";

interface MermaidDiagramProps {
  chart: string;
}

// Sanitize mermaid chart to avoid common syntax errors
const sanitizeMermaidChart = (chart: string): string => {
  let sanitized = chart.trim();
  
  // Replace problematic characters in node labels
  // Match node definitions like A[text] or A{text} or A(text)
  sanitized = sanitized.replace(/\[([^\]]+)\]/g, (match, content) => {
    let cleaned = content
      .replace(/\(/g, '') // Remove opening parentheses
      .replace(/\)/g, '') // Remove closing parentheses
      .replace(/'/g, '')  // Remove apostrophes
      .replace(/"/g, '')  // Remove quotes
      .replace(/=/g, ' equals ') // Replace equals signs
      .replace(/[<>]/g, '') // Remove angle brackets
      .trim();
    return `[${cleaned}]`;
  });
  
  // Same for {} nodes (diamond/decision)
  sanitized = sanitized.replace(/\{([^}]+)\}/g, (match, content) => {
    let cleaned = content
      .replace(/\(/g, '')
      .replace(/\)/g, '')
      .replace(/'/g, '')
      .replace(/"/g, '')
      .replace(/=/g, ' equals ')
      .replace(/[<>]/g, '')
      .trim();
    return `{${cleaned}}`;
  });
  
  // Clean up edge labels |text|
  sanitized = sanitized.replace(/\|([^|]+)\|/g, (match, content) => {
    let cleaned = content
      .replace(/\(/g, '')
      .replace(/\)/g, '')
      .replace(/'/g, '')
      .replace(/"/g, '')
      .trim();
    return `|${cleaned}|`;
  });
  
  return sanitized;
};

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
        
        // Sanitize the chart before rendering
        const cleanChart = sanitizeMermaidChart(chart);
        
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        
        // Clear container first
        containerRef.current.innerHTML = '';
        
        const { svg } = await mermaid.render(id, cleanChart);
        containerRef.current.innerHTML = svg;
      } catch (err: any) {
        console.error("Mermaid render error:", err);
        // Don't show the error to users - just hide the broken diagram
        setError("Could not render diagram");
      }
    };

    renderDiagram();
  }, [chart]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.5));
  const handleReset = () => setZoom(1);

  // If there's an error, don't show anything (the text explanation will still show)
  if (error) {
    return (
      <div className="w-full p-4 border border-muted rounded-lg bg-muted/30 flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Diagram could not be rendered. See explanation below.</p>
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
