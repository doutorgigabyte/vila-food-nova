import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import RoadmapProgress from "@/components/admin/RoadmapProgress";

const Roadmap = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">Roadmap de Desenvolvimento</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <RoadmapProgress />
      </main>
    </div>
  );
};

export default Roadmap;
