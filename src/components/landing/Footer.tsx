import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { MapPin, Mail, Phone, Instagram, Facebook, Store, Cookie } from "lucide-react";
import logoHorizontalWhite from "@/assets/logo-horizontal-white.png";
import { readConsent, revokeConsent, type ConsentRecord } from "@/components/CookieConsentBanner";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [consent, setConsent] = useState<ConsentRecord | null>(null);

  // Re-checa consent quando o footer renderiza (ex: voltar pra home apos aceitar)
  useEffect(() => {
    setConsent(readConsent());
  }, []);

  const links = {
    product: [
      { label: "Recursos", href: "/conheca#features" },
      { label: "Planos", href: "/conheca#pricing" },
    ],
    company: [
      { label: "Sobre", href: "/conheca" },
      { label: "Seja Parceiro", href: "/cadastro-estabelecimento" },
    ],
    support: [
      { label: "Contato", href: "/conheca#contact" },
      { label: "WhatsApp", href: "https://wa.me/5581983655465", external: true },
      { label: "Status do sistema", href: "/saude" },
    ],
    legal: [
      { label: "Termos de Uso", href: "/termos" },
      { label: "Política de privacidade", href: "/privacidade" },
      { label: "Privacidade & meus dados", href: "/membro/privacidade" },
    ],
  };

  return (
    <footer className="bg-card text-card-foreground border-t border-border py-8 md:py-16">
      <div className="container mx-auto px-4">
        {/* Mobile: Compact layout */}
        <div className="md:hidden">
          {/* Brand */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-block mb-3">
              <img src={logoHorizontalWhite} alt="VilaFood" className="h-8 mx-auto" />
            </Link>
            <p className="text-card-foreground/70 text-sm">
              Plataforma completa de delivery
            </p>
          </div>

          {/* Links Grid - 2 columns on mobile */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <h4 className="font-semibold mb-2 text-xs uppercase tracking-wider text-muted-foreground">Produto</h4>
              <ul className="space-y-1.5">
                {links.product.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-card-foreground/70 hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-xs uppercase tracking-wider text-muted-foreground">Empresa</h4>
              <ul className="space-y-1.5">
                {links.company.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-card-foreground/70 hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-xs uppercase tracking-wider text-muted-foreground">Suporte</h4>
              <ul className="space-y-1.5">
                {links.support.map((link) => (
                  <li key={link.label}>
                    {'external' in link && link.external ? (
                      <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-card-foreground/70 hover:text-foreground transition-colors">
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.href} className="text-card-foreground/70 hover:text-foreground transition-colors">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-xs uppercase tracking-wider text-muted-foreground">Legal</h4>
              <ul className="space-y-1.5">
                {links.legal.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-card-foreground/70 hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
                {consent && (
                  <li>
                    <button
                      onClick={revokeConsent}
                      className="text-card-foreground/70 hover:text-foreground transition-colors inline-flex items-center gap-1"
                      title={`Aceito em ${new Date(consent.accepted_at).toLocaleDateString('pt-BR')} · nível "${consent.level === 'all' ? 'todos' : 'essenciais'}"`}
                    >
                      <Cookie size={12} /> Revogar consentimento
                    </button>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* CTA compact */}
          <Link to="/conheca" className="block mb-6">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <Store className="text-white" size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-card-foreground">Tem um restaurante?</p>
                <p className="text-card-foreground/70 text-xs truncate">Comece a vender mais!</p>
              </div>
            </div>
          </Link>

          {/* Bottom */}
          <div className="pt-4 border-t border-border flex justify-between items-center">
            <p className="text-muted-foreground text-xs">
              © {currentYear} VilaFood
            </p>
            <div className="flex items-center gap-3">
              <a href="https://instagram.com/vilafood" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Instagram">
                <Instagram size={18} />
              </a>
              <a href="https://facebook.com/vilafood" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Facebook">
                <Facebook size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* Desktop: Original layout */}
        <div className="hidden md:block">
          <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-12 mb-12">
            {/* Brand */}
            <div className="lg:col-span-2">
              <Link to="/" className="inline-block mb-4">
                <img src={logoHorizontalWhite} alt="VilaFood" className="h-10" />
              </Link>
              <p className="text-card-foreground/70 mb-6 max-w-xs">
                A plataforma completa de delivery para seu estabelecimento crescer online.
              </p>
              <div className="space-y-3">
                <a href="mailto:contato@vilafood.delivery" className="flex items-center gap-2 text-card-foreground/70 hover:text-foreground transition-colors">
                  <Mail size={16} />
                  contato@vilafood.delivery
                </a>
                <a href="tel:+5581983655465" className="flex items-center gap-2 text-card-foreground/70 hover:text-foreground transition-colors">
                  <Phone size={16} />
                  +55 81 98365-5465
                </a>
                <div className="flex items-center gap-2 text-card-foreground/70">
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
                    <Link to={link.href} className="text-card-foreground/70 hover:text-foreground transition-colors">
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
                    <Link to={link.href} className="text-card-foreground/70 hover:text-foreground transition-colors">
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
                    {'external' in link && link.external ? (
                      <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-card-foreground/70 hover:text-foreground transition-colors">
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.href} className="text-card-foreground/70 hover:text-foreground transition-colors">
                        {link.label}
                      </Link>
                    )}
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
                    <Link to={link.href} className="text-card-foreground/70 hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
                {consent && (
                  <li>
                    <button
                      onClick={revokeConsent}
                      className="text-card-foreground/70 hover:text-foreground transition-colors inline-flex items-center gap-1.5"
                      title={`Aceito em ${new Date(consent.accepted_at).toLocaleDateString('pt-BR')} · nível "${consent.level === 'all' ? 'todos' : 'essenciais'}"`}
                    >
                      <Cookie size={14} /> Revogar consentimento
                    </button>
                  </li>
                )}
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
                <h4 className="font-semibold text-card-foreground">Tem um restaurante?</h4>
                <p className="text-card-foreground/70 text-sm">Conheça nossa plataforma e comece a vender mais!</p>
              </div>
            </div>
            <Link to="/conheca" className="shrink-0">
              <button className="px-6 py-3 bg-accent text-foreground font-semibold rounded-xl hover:bg-accent/90 transition-colors">
                Conhecer Plataforma
              </button>
            </Link>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-card-foreground/60 text-sm">
              © {currentYear} VilaFood. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://instagram.com/vilafood" target="_blank" rel="noopener noreferrer" className="text-card-foreground/60 hover:text-foreground transition-colors" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="https://facebook.com/vilafood" target="_blank" rel="noopener noreferrer" className="text-card-foreground/60 hover:text-foreground transition-colors" aria-label="Facebook">
                <Facebook size={20} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
