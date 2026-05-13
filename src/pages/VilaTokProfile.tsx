import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VilaTokProfileContent } from "@/components/vilatok/v2/VilaTokProfileContent";

/**
 * Rota full-page do perfil de estabelecimento no Vilatok.
 *
 * Refactor: o conteudo do perfil foi extraido pra VilaTokProfileContent
 * pra ser reusado tanto aqui (page) quanto no VilaTokProfileSheet (sheet
 * aberto via gesture edge-pull no feed).
 */
export default function VilaTokProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  if (!username) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <p className="text-lg">Perfil não encontrado</p>
        <Button variant="outline" onClick={() => navigate("/vilatok")}>
          Voltar ao VilaTok
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header sticky com voltar */}
      <header className="sticky top-0 z-50 vt-glass border-b border-white/10">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/10"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="font-semibold">@{username.replace(/^@/, "")}</span>
        </div>
      </header>

      <VilaTokProfileContent slug={username} mode="page" />
    </div>
  );
}
