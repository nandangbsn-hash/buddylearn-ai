import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, RotateCw } from "lucide-react";

interface Flashcard {
  front: string;
  back: string;
}

interface FlashcardViewerProps {
  flashcards: Flashcard[];
}

export const FlashcardViewer = ({ flashcards }: FlashcardViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  if (flashcards.length === 0) return null;

  const current = flashcards[currentIndex];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>Flashcard {currentIndex + 1} of {flashcards.length}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleFlip}
          className="gap-2"
        >
          <RotateCw className="h-4 w-4" />
          Flip Card
        </Button>
      </div>

      <Card 
        className="relative min-h-[300px] cursor-pointer transition-all duration-300 hover:shadow-lg"
        onClick={handleFlip}
      >
        <CardContent className="flex items-center justify-center p-8 min-h-[300px]">
          <div className="text-center space-y-4">
            <div className="text-xs font-semibold text-primary uppercase">
              {isFlipped ? "Back" : "Front"}
            </div>
            <div className="text-lg leading-relaxed">
              {isFlipped ? current.back : current.front}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={flashcards.length <= 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        <div className="flex gap-2">
          {flashcards.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all ${
                idx === currentIndex
                  ? "w-8 bg-primary"
                  : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>

        <Button
          variant="outline"
          onClick={handleNext}
          disabled={flashcards.length <= 1}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};
