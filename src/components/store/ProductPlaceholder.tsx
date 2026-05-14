import { useMemo } from "react";

interface ProductPlaceholderProps {
  name: string;
  /** Categoria/segmento para influenciar a paleta — opcional. */
  category?: string | null;
  /** Tamanho do componente. Pequeno (card), médio, grande (modal). */
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Placeholder visual exibido quando um produto nao tem foto cadastrada.
 *
 * Em vez de um icone generico (Package), gera um gradient deterministico
 * baseado no nome + iniciais, dando identidade visual unica para cada produto.
 *
 * Por que: pesquisas de UX em catalogos delivery mostram que usuarios olham
 * a foto antes de qualquer outra coisa. Quando ela falta, um icone igual
 * em todos os cards faz o cardapio parecer "vazio" / amador. Um placeholder
 * com cor + iniciais transmite intencionalidade e mantém o card legivel.
 */
export const ProductPlaceholder = ({
  name,
  category,
  size = "sm",
  className = "",
}: ProductPlaceholderProps) => {
  const { gradient, initials, fontSize } = useMemo(() => {
    const palettes: Array<[string, string]> = [
      ["from-orange-400", "to-red-500"],
      ["from-amber-400", "to-orange-500"],
      ["from-yellow-400", "to-amber-500"],
      ["from-lime-400", "to-green-500"],
      ["from-emerald-400", "to-teal-500"],
      ["from-cyan-400", "to-blue-500"],
      ["from-blue-400", "to-indigo-500"],
      ["from-violet-400", "to-purple-500"],
      ["from-fuchsia-400", "to-pink-500"],
      ["from-rose-400", "to-red-500"],
    ];
    // Hash deterministico por nome + categoria para garantir consistência entre renders
    const seed = `${name || ""}::${category || ""}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) | 0;
    }
    const idx = Math.abs(hash) % palettes.length;
    const [from, to] = palettes[idx];

    const cleaned = (name || "").trim();
    const words = cleaned.split(/\s+/).filter(Boolean);
    const init = (words[0]?.[0] || "?") + (words.length > 1 ? words[words.length - 1][0] : "");

    const fontSizeMap = { sm: "text-xl", md: "text-3xl", lg: "text-5xl" };

    return {
      gradient: `bg-gradient-to-br ${from} ${to}`,
      initials: init.toUpperCase().slice(0, 2),
      fontSize: fontSizeMap[size],
    };
  }, [name, category, size]);

  return (
    <div
      className={`w-full h-full flex items-center justify-center ${gradient} ${className}`}
      role="img"
      aria-label={`Imagem ilustrativa de ${name}`}
    >
      <span
        className={`${fontSize} font-bold text-white/90 drop-shadow-sm select-none tracking-tight`}
      >
        {initials}
      </span>
    </div>
  );
};
