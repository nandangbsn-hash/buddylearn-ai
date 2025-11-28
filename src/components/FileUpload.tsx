import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, Loader2, Link as LinkIcon } from "lucide-react";

interface FileUploadProps {
  onUploadComplete: (fileUrl: string, fileType: string, extractedText?: string) => void;
}

export const FileUpload = ({ onUploadComplete }: FileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [url, setUrl] = useState("");

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('study-materials')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('study-materials')
        .getPublicUrl(fileName);

      // Determine file type
      let fileType = 'file';
      if (file.type.startsWith('image/')) {
        fileType = 'image';
      } else if (file.type === 'application/pdf') {
        fileType = 'pdf';
      } else if (file.type.includes('document') || file.type.includes('text')) {
        fileType = 'document';
      }

      toast.success("File uploaded! Extracting content...");
      
      // Extract content from the uploaded file
      const { data: extractData, error: extractError } = await supabase.functions.invoke('extract-content', {
        body: { url: publicUrl, fileType }
      });

      if (extractError) {
        console.error('Extract error:', extractError);
        toast.warning("File uploaded but couldn't extract text automatically. Please add detailed notes about what's in this image.");
        onUploadComplete(publicUrl, fileType);
      } else if (extractData.content && extractData.content.length > 100) {
        toast.success("Content extracted successfully from image!");
        onUploadComplete(publicUrl, fileType, extractData.content);
      } else {
        toast.warning("File uploaded. Please add detailed notes about what's in this image.");
        onUploadComplete(publicUrl, fileType, extractData.content || '');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!url) return;
    
    try {
      new URL(url); // Validate URL
      setIsUploading(true);
      toast.info("Fetching content from link...");
      
      // Extract content from the URL
      const { data: extractData, error: extractError } = await supabase.functions.invoke('extract-content', {
        body: { url, fileType: 'link' }
      });

      if (extractError) {
        console.error('Extract error:', extractError);
        toast.warning("Link added but couldn't extract content. You can add notes manually.");
        onUploadComplete(url, 'link');
      } else {
        toast.success("Content extracted from link!");
        onUploadComplete(url, 'link', extractData.content);
      }
      setUrl("");
    } catch (error) {
      toast.error("Please enter a valid URL");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="file-upload">Upload File (PDF, Image, Doc)</Label>
        <div className="flex gap-2">
          <Input
            id="file-upload"
            type="file"
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="flex-1"
          />
          {isUploading && <Loader2 className="h-5 w-5 animate-spin" />}
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="url-input">Add Link</Label>
        <div className="flex gap-2">
          <Input
            id="url-input"
            type="url"
            placeholder="https://example.com/article"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button type="button" onClick={handleUrlSubmit} variant="outline">
            <LinkIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
