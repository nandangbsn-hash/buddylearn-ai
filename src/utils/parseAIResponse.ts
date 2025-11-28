interface Flashcard {
  front: string;
  back: string;
}

export const parseFlashcards = (content: string): Flashcard[] | null => {
  const flashcards: Flashcard[] = [];
  
  // Match pattern: FLASHCARD N:\n**Front:** text\n**Back:** text
  const flashcardRegex = /FLASHCARD\s+\d+:\s*\n\*\*Front:\*\*\s*(.+?)\s*\n\*\*Back:\*\*\s*(.+?)(?=\n\nFLASHCARD|\n*$)/gs;
  
  let match;
  while ((match = flashcardRegex.exec(content)) !== null) {
    flashcards.push({
      front: match[1].trim(),
      back: match[2].trim(),
    });
  }
  
  return flashcards.length > 0 ? flashcards : null;
};

export const parseMermaidDiagram = (content: string): string | null => {
  // Extract mermaid code block
  const mermaidRegex = /```mermaid\n([\s\S]+?)```/;
  const match = content.match(mermaidRegex);
  
  return match ? match[1].trim() : null;
};
