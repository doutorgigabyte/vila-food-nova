import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check, X, MapPin } from "lucide-react";

export interface CepData {
  cep: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  ibge?: string;
}

interface CepAutocompleteProps {
  value: string;
  onChange: (cep: string) => void;
  onAddressFound: (data: CepData) => void;
  onError?: (error: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export const CepAutocomplete = ({
  value,
  onChange,
  onAddressFound,
  onError,
  label = "CEP",
  placeholder = "00000-000",
  className = "",
}: CepAutocompleteProps) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const formatCep = (cep: string): string => {
    const numbers = cep.replace(/\D/g, "");
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const searchCep = useCallback(async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    
    if (cleanCep.length !== 8) {
      setStatus("idle");
      return;
    }

    setLoading(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        setStatus("error");
        setErrorMessage("CEP não encontrado");
        onError?.("CEP não encontrado");
        return;
      }

      const addressData: CepData = {
        cep: cleanCep,
        address: data.logradouro || "",
        neighborhood: data.bairro || "",
        city: data.localidade || "",
        state: data.uf || "",
        ibge: data.ibge,
      };

      setStatus("success");
      onAddressFound(addressData);
    } catch (error) {
      setStatus("error");
      setErrorMessage("Erro ao buscar CEP");
      onError?.("Erro ao buscar CEP");
    } finally {
      setLoading(false);
    }
  }, [onAddressFound, onError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    onChange(formatted);

    const clean = formatted.replace(/\D/g, "");
    if (clean.length === 8) {
      searchCep(formatted);
    } else {
      setStatus("idle");
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="cep">{label}</Label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          id="cep"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className="pl-10 pr-10"
          maxLength={9}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          {status === "success" && <Check className="w-4 h-4 text-green-500" />}
          {status === "error" && <X className="w-4 h-4 text-destructive" />}
        </div>
      </div>
      {status === "error" && errorMessage && (
        <p className="text-xs text-destructive">{errorMessage}</p>
      )}
      {status === "success" && (
        <p className="text-xs text-green-600">Endereço encontrado!</p>
      )}
    </div>
  );
};