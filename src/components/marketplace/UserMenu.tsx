import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { 
  User, 
  Settings, 
  ShoppingBag, 
  MapPin, 
  LogOut,
  Moon,
  Sun,
  ChevronDown
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";

export const UserMenu = () => {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link to="/auth" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">Entrar</span>
        </Link>
      </div>
    );
  }

  const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuário";
  const userInitials = userName.substring(0, 2).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity">
          <Avatar className="w-7 h-7">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline max-w-[100px] truncate font-medium">
            {userName}
          </span>
          <ChevronDown className="w-3 h-3 hidden sm:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="font-medium">{userName}</span>
            <span className="text-xs text-muted-foreground font-normal">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link to="/pedidos" className="cursor-pointer">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Meus pedidos
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link to="/checkout" className="cursor-pointer">
            <MapPin className="w-4 h-4 mr-2" />
            Meus endereços
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link to="/conta" className="cursor-pointer">
            <User className="w-4 h-4 mr-2" />
            Minha conta
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem 
          onClick={(e) => {
            e.preventDefault();
            toggleTheme();
          }}
          className="cursor-pointer"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 mr-2" />
          ) : (
            <Moon className="w-4 h-4 mr-2" />
          )}
          <span className="flex-1">Tema {theme === "dark" ? "claro" : "escuro"}</span>
          <Switch 
            checked={theme === "dark"} 
            onCheckedChange={toggleTheme}
            className="ml-2"
          />
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem 
          onClick={handleSignOut}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
