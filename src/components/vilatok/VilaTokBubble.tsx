import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface VideoPreview {
  id: string;
  thumbnail_url: string | null;
  video_url: string;
  title: string | null;
}

const VilaTokBubble = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<VideoPreview[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Fetch videos
  useEffect(() => {
    const fetchVideos = async () => {
      const { data } = await supabase
        .from("establishment_videos")
        .select("id, thumbnail_url, video_url, title")
        .eq("is_active", true)
        .order("views_count", { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        setVideos(data);
      }
    };

    fetchVideos();
  }, []);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (videos.length <= 1) return;

    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % videos.length);
        setIsAnimating(false);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, [videos.length]);

  const handleClick = () => {
    navigate("/vilatok");
  };

  const hasVideos = videos.length > 0;
  const currentVideo = hasVideos ? videos[currentIndex] : null;

  

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-[76px] right-4 z-40 group"
      aria-label="Ver VilaTok Stories"
    >
      {/* Outer glow ring - Stories style */}
      <div className="absolute inset-0 rounded-full animate-pulse" 
        style={{
          background: "linear-gradient(45deg, #00ff88, #00cc6a, #00ff88)",
          padding: "3px",
          filter: "blur(2px)",
        }}
      />
      
      {/* Stories ring gradient */}
      <div 
        className="relative w-16 h-16 rounded-full p-[3px]"
        style={{
          background: "linear-gradient(135deg, #00ff88 0%, #00cc6a 50%, #00ff88 100%)",
        }}
      >
        {/* Inner content */}
        <div className="w-full h-full rounded-full bg-background p-[2px]">
          <div className={`
            w-full h-full rounded-full overflow-hidden bg-muted
            transition-all duration-300
            ${isAnimating ? 'scale-90 opacity-50' : 'scale-100 opacity-100'}
          `}>
            {hasVideos && currentVideo?.thumbnail_url ? (
              <img
                src={currentVideo.thumbnail_url}
                alt={currentVideo.title || "VilaTok"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/40">
                <Play className="h-6 w-6 text-primary fill-primary" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Play indicator */}
      <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-background shadow-lg">
        <Play className="h-2.5 w-2.5 text-white fill-white" />
      </div>

      {/* Progress ring animation */}
      <svg
        className="absolute inset-0 w-16 h-16 -rotate-90"
        viewBox="0 0 64 64"
      >
        <circle
          cx="32"
          cy="32"
          r="30"
          fill="none"
          stroke="rgba(0, 255, 136, 0.3)"
          strokeWidth="2"
        />
        <circle
          cx="32"
          cy="32"
          r="30"
          fill="none"
          stroke="#00ff88"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={`${(188.5 * ((5000 - ((Date.now() % 5000))) / 5000))} 188.5`}
          className="transition-all duration-100"
          style={{
            animation: "progress 5s linear infinite",
          }}
        />
      </svg>

      {/* Tooltip on hover */}
      <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-foreground text-background text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
          VilaTok Stories
          <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-foreground" />
        </div>
      </div>

      <style>{`
        @keyframes progress {
          from {
            stroke-dasharray: 188.5 188.5;
          }
          to {
            stroke-dasharray: 0 188.5;
          }
        }
      `}</style>
    </button>
  );
};

export default VilaTokBubble;
