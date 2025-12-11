import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { ArrowLeft, Scale, Users, Truck, Handshake } from "lucide-react";
import { Helmet } from "react-helmet-async";

const TermsOfUse = () => {
  return (
    <>
      <Helmet>
        <title>Termos de Uso | VilaFood</title>
        <meta name="description" content="Termos de Uso da plataforma VilaFood para clientes, lojistas, entregadores e afiliados." />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao início
          </Link>

          <Card className="glass border-border/50">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Scale className="w-8 h-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl">Termos de Uso</CardTitle>
              <p className="text-muted-foreground">
                Última atualização: {new Date().toLocaleDateString('pt-BR')}
              </p>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="cliente" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="cliente" className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span className="hidden sm:inline">Cliente</span>
                  </TabsTrigger>
                  <TabsTrigger value="lojista" className="flex items-center gap-1">
                    <Scale className="w-4 h-4" />
                    <span className="hidden sm:inline">Lojista</span>
                  </TabsTrigger>
                  <TabsTrigger value="entregador" className="flex items-center gap-1">
                    <Truck className="w-4 h-4" />
                    <span className="hidden sm:inline">Entregador</span>
                  </TabsTrigger>
                  <TabsTrigger value="afiliado" className="flex items-center gap-1">
                    <Handshake className="w-4 h-4" />
                    <span className="hidden sm:inline">Afiliado</span>
                  </TabsTrigger>
                </TabsList>

                {/* Cliente */}
                <TabsContent value="cliente" className="space-y-6">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <h3 className="text-lg font-semibold">1. Aceitação dos Termos</h3>
                    <p className="text-muted-foreground">
                      Ao utilizar a plataforma VilaFood como cliente, você concorda integralmente com estes Termos de Uso. 
                      Se não concordar com qualquer disposição, não utilize nossos serviços.
                    </p>

                    <h3 className="text-lg font-semibold">2. Cadastro e Conta</h3>
                    <p className="text-muted-foreground">
                      Você deve fornecer informações verdadeiras, completas e atualizadas ao criar sua conta. 
                      É sua responsabilidade manter a confidencialidade de suas credenciais de acesso.
                    </p>

                    <h3 className="text-lg font-semibold">3. Pedidos e Pagamentos</h3>
                    <p className="text-muted-foreground">
                      Ao realizar um pedido, você se compromete a efetuar o pagamento conforme as condições apresentadas. 
                      Todos os preços incluem taxas aplicáveis. Cancelamentos devem seguir a política do estabelecimento.
                    </p>

                    <h3 className="text-lg font-semibold">4. Entregas</h3>
                    <p className="text-muted-foreground">
                      Os prazos de entrega são estimativas e podem variar. Você deve fornecer endereço correto e estar disponível 
                      para receber o pedido. Em caso de ausência, o pedido poderá ser devolvido ao estabelecimento.
                    </p>

                    <h3 className="text-lg font-semibold">5. Avaliações</h3>
                    <p className="text-muted-foreground">
                      Suas avaliações devem ser honestas e baseadas em experiências reais. É proibido publicar conteúdo 
                      ofensivo, difamatório ou falso.
                    </p>

                    <h3 className="text-lg font-semibold">6. Limitação de Responsabilidade</h3>
                    <p className="text-muted-foreground">
                      A VilaFood é uma plataforma de intermediação. A responsabilidade sobre a qualidade dos produtos 
                      é do estabelecimento. A responsabilidade sobre a entrega é do entregador ou estabelecimento.
                    </p>
                  </div>
                </TabsContent>

                {/* Lojista */}
                <TabsContent value="lojista" className="space-y-6">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <h3 className="text-lg font-semibold">1. Natureza da Relação</h3>
                    <p className="text-muted-foreground">
                      A VilaFood é um software de intermediação (SaaS). Não há vínculo empregatício entre a plataforma 
                      e o lojista. Você é responsável por todas as obrigações fiscais, trabalhistas e regulatórias 
                      do seu estabelecimento.
                    </p>

                    <h3 className="text-lg font-semibold">2. Comissões e Taxas</h3>
                    <p className="text-muted-foreground">
                      A plataforma cobra 5% sobre o valor dos produtos vendidos via marketplace. 
                      Para vendas diretas via cardápio digital, não há cobrança. A taxa de entrega é 100% do 
                      estabelecimento.
                    </p>

                    <h3 className="text-lg font-semibold">3. Pagamentos</h3>
                    <p className="text-muted-foreground">
                      Pagamentos via PIX/cartão são processados com split automático. Pagamentos em dinheiro geram dívida 
                      de comissão que será cobrada mensalmente ou deduzida de futuros pagamentos online.
                    </p>

                    <h3 className="text-lg font-semibold">4. Produtos e Serviços</h3>
                    <p className="text-muted-foreground">
                      Você é integralmente responsável pela qualidade, descrição, preço e disponibilidade dos produtos 
                      cadastrados. É proibido comercializar produtos ilegais ou regulados sem autorização.
                    </p>

                    <h3 className="text-lg font-semibold">5. Entregadores</h3>
                    <p className="text-muted-foreground">
                      Você pode utilizar entregadores próprios ou parceiros da plataforma. Em ambos os casos, não há 
                      vínculo empregatício entre a VilaFood e os entregadores. O pagamento aos entregadores é de 
                      sua responsabilidade.
                    </p>

                    <h3 className="text-lg font-semibold">6. Cancelamento e Suspensão</h3>
                    <p className="text-muted-foreground">
                      A VilaFood pode suspender ou cancelar contas que violem estes termos, acumulem dívidas superiores 
                      a R$100, ou recebam reclamações recorrentes de clientes.
                    </p>
                  </div>
                </TabsContent>

                {/* Entregador */}
                <TabsContent value="entregador" className="space-y-6">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <h3 className="text-lg font-semibold">1. Natureza da Relação</h3>
                    <p className="text-muted-foreground">
                      Você atua como prestador de serviço autônomo. Não há vínculo empregatício com a VilaFood ou 
                      com os estabelecimentos parceiros. Você é responsável por suas obrigações fiscais e previdenciárias.
                    </p>

                    <h3 className="text-lg font-semibold">2. Requisitos</h3>
                    <p className="text-muted-foreground">
                      Para atuar na plataforma, você deve possuir veículo em boas condições, documentação regular, 
                      e dispositivo móvel compatível com o aplicativo.
                    </p>

                    <h3 className="text-lg font-semibold">3. Ganhos</h3>
                    <p className="text-muted-foreground">
                      Seus ganhos são definidos por cada estabelecimento (taxa fixa ou percentual). O pagamento é 
                      realizado diretamente pelo estabelecimento. A VilaFood não processa pagamentos aos entregadores.
                    </p>

                    <h3 className="text-lg font-semibold">4. Responsabilidades</h3>
                    <p className="text-muted-foreground">
                      Você é responsável pela integridade dos pedidos durante o transporte, pelo cumprimento dos 
                      prazos, e pelo tratamento respeitoso aos clientes e estabelecimentos.
                    </p>

                    <h3 className="text-lg font-semibold">5. Desativação</h3>
                    <p className="text-muted-foreground">
                      Sua conta pode ser desativada por reclamações recorrentes, não cumprimento de entregas, 
                      comportamento inadequado, ou violação destes termos.
                    </p>
                  </div>
                </TabsContent>

                {/* Afiliado */}
                <TabsContent value="afiliado" className="space-y-6">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <h3 className="text-lg font-semibold">1. Programa de Afiliados</h3>
                    <p className="text-muted-foreground">
                      Como afiliado, você pode indicar novos estabelecimentos para a plataforma e receber comissões 
                      sobre as vendas desses estabelecimentos.
                    </p>

                    <h3 className="text-lg font-semibold">2. Comissões</h3>
                    <p className="text-muted-foreground">
                      A comissão varia de 10% a 40% sobre a comissão que a plataforma recebe dos estabelecimentos 
                      indicados. O percentual é definido individualmente e pode ser ajustado pela plataforma.
                    </p>

                    <h3 className="text-lg font-semibold">3. Pagamentos</h3>
                    <p className="text-muted-foreground">
                      Pagamentos são realizados via PIX quando o saldo atinge o mínimo de R$50. Você deve manter 
                      sua chave PIX atualizada no sistema.
                    </p>

                    <h3 className="text-lg font-semibold">4. Gestão de Lojas</h3>
                    <p className="text-muted-foreground">
                      Afiliados com permissão podem gerenciar as lojas indicadas. Essa permissão é concedida 
                      caso a caso pela administração da plataforma.
                    </p>

                    <h3 className="text-lg font-semibold">5. Vedações</h3>
                    <p className="text-muted-foreground">
                      É proibido fazer promessas falsas aos estabelecimentos, utilizar práticas enganosas de 
                      marketing, ou criar contas falsas para receber comissões indevidas.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-8 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground text-center">
                  Em caso de dúvidas, entre em contato conosco pelo WhatsApp ou e-mail disponíveis na plataforma.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default TermsOfUse;
