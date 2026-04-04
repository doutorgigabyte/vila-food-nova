import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
  className?: string;
  variant?: "ghost" | "outline" | "default";
  size?: "sm" | "default" | "icon";
}

export const ShareButton = ({ 
  title, 
  text, 
  url, 
  className,
  variant = "ghost",
  size = "icon"
}: ShareButtonProps) => {
  const handleShare = async () => {
    const shareUrl = url || window.location.href;
    const shareData = {
      title,
      text: text || title,
      url: shareUrl,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copiado para a área de transferência!");
      }
    } catch (error) {
      // User cancelled or error
      if ((error as Error).name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(shareUrl);
          toast.success("Link copiado para a área de transferência!");
        } catch {
          toast.error("Não foi possível compartilhar");
        }
      }
    }
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleShare}
      className={className}
      title="Compartilhar"
    >
      <Share2 className="w-4 h-4" />
    </Button>
  );
};
