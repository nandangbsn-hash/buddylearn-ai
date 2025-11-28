interface Flashcard {
  front: string;
  back: string;
}

export const parseFlashcards = (content: string): Flashcard[] | null => {
  const flashcards: Flashcard[] = [];
  
  // Match pattern: FLASHCARD N: or just the Front/Back pattern
  // More flexible regex to handle various formats
  const flashcardRegex = /(?:FLASHCARD\s+\d+:\s*\n)?(?:\*\*Front:\*\*|\*\*Front:\*\*)\s*(.+?)\s*\n\*\*Back:\*\*\s*(.+?)(?=\n\n(?:FLASHCARD|\*\*Front:\*\*)|$)/gis;
  
  let match;
  while ((match = flashcardRegex.exec(content)) !== null) {
    const front = match[1].trim().replace(/^\*+/, '').trim();
    const back = match[2].trim();
    
    if (front && back) {
      flashcards.push({
        front,
        back,
      });
    }
  }
  
  return flashcards.length > 0 ? flashcards : null;
};

export const parseMermaidDiagram = (content: string): string | null => {
  // Extract mermaid code block - handle both \n and actual newlines
  const mermaidRegex = /```mermaid\s*([\s\S]+?)\s*```/;
  const match = content.match(mermaidRegex);
  
  if (!match) return null;
  
  // Clean up the mermaid code
  let mermaidCode = match[1].trim();
  
  // Ensure proper line breaks
  mermaidCode = mermaidCode.replace(/\\n/g, '\n');
  
  return mermaidCode;
};
