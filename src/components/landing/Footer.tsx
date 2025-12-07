import { Link } from "react-router-dom";
import { MapPin, Mail, Phone, Instagram, Facebook, Store } from "lucide-react";
import logoHorizontalWhite from "@/assets/logo-horizontal-white.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const links = {
    product: [
      { label: "Recursos", href: "/conheca#features" },
      { label: "Planos", href: "/conheca#pricing" },
      { label: "Integrações", href: "/conheca" },
      { label: "API", href: "/conheca" },
    ],
    company: [
      { label: "Sobre", href: "/conheca" },
      { label: "Blog", href: "#" },
      { label: "Carreiras", href: "#" },
      { label: "Parceiros", href: "#" },
    ],
    support: [
      { label: "Central de Ajuda", href: "#" },
      { label: "Documentação", href: "#" },
      { label: "Status", href: "#" },
      { label: "Contato", href: "/conheca#contact" },
    ],
    legal: [
      { label: "Termos de Uso", href: "#" },
      { label: "Privacidade", href: "#" },
      { label: "Cookies", href: "#" },
    ],
  };

  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-block mb-4">
              <img src={logoHorizontalWhite} alt="VilaFood" className="h-10" />
            </Link>
            <p className="text-background/70 mb-6 max-w-xs">
              A plataforma completa de delivery para seu estabelecimento crescer online.
            </p>
            <div className="space-y-3">
              <a href="mailto:contato@vilafood.delivery" className="flex items-center gap-2 text-background/70 hover:text-background transition-colors">
                <Mail size={16} />
                contato@vilafood.delivery
              </a>
              <a href="tel:+5581983655465" className="flex items-center gap-2 text-background/70 hover:text-background transition-colors">
                <Phone size={16} />
                +55 81 98365-5465
              </a>
              <div className="flex items-center gap-2 text-background/70">
                <MapPin size={16} />
                Tamandaré, PE - Brasil
              </div>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">Produto</h4>
            <ul className="space-y-3">
              {links.product.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-background/70 hover:text-background transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Empresa</h4>
            <ul className="space-y-3">
              {links.company.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-background/70 hover:text-background transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Suporte</h4>
            <ul className="space-y-3">
              {links.support.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-background/70 hover:text-background transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              {links.legal.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-background/70 hover:text-background transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA for business owners */}
        <div className="mb-12 p-6 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Store className="text-white" size={24} />
            </div>
            <div>
              <h4 className="font-semibold text-background">Tem um restaurante?</h4>
              <p className="text-background/70 text-sm">Conheça nossa plataforma e comece a vender mais!</p>
            </div>
          </div>
          <Link to="/conheca" className="shrink-0">
            <button className="px-6 py-3 bg-accent text-foreground font-semibold rounded-xl hover:bg-accent/90 transition-colors">
              Conhecer Plataforma
            </button>
          </Link>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-background/60 text-sm">
            © {currentYear} VilaFood. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4">
            <a href="https://instagram.com/vilafood" target="_blank" rel="noopener noreferrer" className="text-background/60 hover:text-background transition-colors" aria-label="Instagram">
              <Instagram size={20} />
            </a>
            <a href="https://facebook.com/vilafood" target="_blank" rel="noopener noreferrer" className="text-background/60 hover:text-background transition-colors" aria-label="Facebook">
              <Facebook size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
