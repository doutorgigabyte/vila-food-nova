import { Navigate, useParams, useLocation } from "react-router-dom";

/**
 * Redirects from /lojista/:slug to /painel/:slug preserving the slug parameter
 */
export const LojistaToPanel = () => {
  const { slug } = useParams();
  const location = useLocation();
  
  // Extract any subpath after the slug
  const subPath = location.pathname.replace(/^\/lojista\/[^/]+/, '');
  
  if (slug) {
    return <Navigate to={`/painel/${slug}${subPath}`} replace />;
  }
  return <Navigate to="/painel" replace />;
};
