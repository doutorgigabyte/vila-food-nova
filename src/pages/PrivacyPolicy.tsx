import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Eye, Database, Share2, Lock, UserCheck, FileText } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const PrivacyPolicy = () => {
  return (
    <>
      <Helmet>
        <title>Política de Privacidade | VilaFood</title>
        <meta name="description" content="Política de Privacidade da plataforma VilaFood em conformidade com a LGPD." />
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
                  <Shield className="w-8 h-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl">Política de Privacidade</CardTitle>
              <p className="text-muted-foreground">
                Em conformidade com a Lei Geral de Proteção de Dados (LGPD) - Lei nº 13.709/2018
              </p>
              <p className="text-sm text-muted-foreground">
                Última atualização: {new Date().toLocaleDateString('pt-BR')}
              </p>
            </CardHeader>

            <CardContent>
              <Accordion type="single" collapsible className="w-full space-y-2">
                <AccordionItem value="coleta" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Database className="w-5 h-5 text-primary" />
                      <span className="font-semibold">1. Dados que Coletamos</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-4">
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Dados de Identificação</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Nome completo</li>
                        <li>E-mail</li>
                        <li>Telefone/WhatsApp</li>
                        <li>CPF/CNPJ (quando aplicável)</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Dados de Localização</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Endereço de entrega</li>
                        <li>CEP</li>
                        <li>Coordenadas GPS (com seu consentimento)</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Dados de Transação</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Histórico de pedidos</li>
                        <li>Métodos de pagamento utilizados</li>
                        <li>Avaliações realizadas</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Dados Técnicos</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Endereço IP</li>
                        <li>Tipo de dispositivo</li>
                        <li>Navegador utilizado</li>
                        <li>Cookies e identificadores</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="uso" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Eye className="w-5 h-5 text-primary" />
                      <span className="font-semibold">2. Como Utilizamos seus Dados</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-4">
                    <ul className="list-disc list-inside space-y-2">
                      <li><strong>Processamento de pedidos:</strong> Para criar, processar e entregar seus pedidos.</li>
                      <li><strong>Comunicação:</strong> Para enviar atualizações sobre pedidos via WhatsApp e e-mail.</li>
                      <li><strong>Melhorias:</strong> Para aprimorar nossa plataforma e experiência do usuário.</li>
                      <li><strong>Marketing:</strong> Para enviar ofertas personalizadas (com seu consentimento).</li>
                      <li><strong>Segurança:</strong> Para detectar fraudes e proteger a plataforma.</li>
                      <li><strong>Obrigações legais:</strong> Para cumprir exigências fiscais e regulatórias.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="compartilhamento" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Share2 className="w-5 h-5 text-primary" />
                      <span className="font-semibold">3. Compartilhamento de Dados</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-4">
                    <p>Compartilhamos seus dados apenas com:</p>
                    <ul className="list-disc list-inside space-y-2">
                      <li><strong>Estabelecimentos:</strong> Nome, telefone e endereço para processamento do pedido.</li>
                      <li><strong>Entregadores:</strong> Nome e endereço para realização da entrega.</li>
                      <li><strong>Processadores de pagamento:</strong> Mercado Pago e PagSeguro para processar transações.</li>
                      <li><strong>WhatsApp/Evolution API:</strong> Para comunicação de status de pedidos.</li>
                      <li><strong>Serviços de armazenamento:</strong> AWS S3 para armazenamento seguro de imagens.</li>
                      <li><strong>Autoridades:</strong> Quando exigido por lei ou ordem judicial.</li>
                    </ul>
                    <p className="mt-4 font-medium text-foreground">
                      Nunca vendemos seus dados pessoais para terceiros.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="cookies" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <span className="font-semibold">4. Cookies e Tecnologias</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-4">
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Cookies Essenciais</h4>
                      <p>Necessários para o funcionamento da plataforma (autenticação, sessão).</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Cookies de Análise</h4>
                      <p>Google Analytics, Facebook Pixel e TikTok Pixel para entender o uso da plataforma.</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Cookies de Marketing</h4>
                      <p>Para personalizar anúncios e ofertas (podem ser desativados).</p>
                    </div>
                    <p className="text-sm">
                      Você pode gerenciar cookies nas configurações do seu navegador.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="seguranca" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5 text-primary" />
                      <span className="font-semibold">5. Segurança dos Dados</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-4">
                    <p>Implementamos medidas de segurança robustas:</p>
                    <ul className="list-disc list-inside space-y-2">
                      <li>Criptografia SSL/TLS em todas as comunicações</li>
                      <li>Row Level Security (RLS) no banco de dados</li>
                      <li>Autenticação com tokens JWT</li>
                      <li>Logs de auditoria para rastrear acessos</li>
                      <li>Detecção de anomalias em transações</li>
                      <li>Backup regular dos dados</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="direitos" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <UserCheck className="w-5 h-5 text-primary" />
                      <span className="font-semibold">6. Seus Direitos (LGPD)</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-4">
                    <p>Você tem direito a:</p>
                    <ul className="list-disc list-inside space-y-2">
                      <li><strong>Confirmação:</strong> Saber se tratamos seus dados.</li>
                      <li><strong>Acesso:</strong> Obter cópia dos seus dados.</li>
                      <li><strong>Correção:</strong> Atualizar dados incompletos ou incorretos.</li>
                      <li><strong>Anonimização:</strong> Solicitar anonimização de dados desnecessários.</li>
                      <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado.</li>
                      <li><strong>Eliminação:</strong> Solicitar exclusão dos dados (quando aplicável).</li>
                      <li><strong>Revogação:</strong> Retirar consentimento a qualquer momento.</li>
                    </ul>
                    <p className="mt-4">
                      Para exercer seus direitos, entre em contato pelo WhatsApp ou e-mail disponíveis na plataforma.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="retencao" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Database className="w-5 h-5 text-primary" />
                      <span className="font-semibold">7. Retenção de Dados</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-4">
                    <ul className="list-disc list-inside space-y-2">
                      <li><strong>Conta ativa:</strong> Dados mantidos enquanto a conta estiver ativa.</li>
                      <li><strong>Após exclusão:</strong> Dados fiscais mantidos por 5 anos (obrigação legal).</li>
                      <li><strong>Logs de segurança:</strong> Mantidos por 6 meses.</li>
                      <li><strong>Dados anonimizados:</strong> Podem ser mantidos indefinidamente para estatísticas.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="mt-8 pt-6 border-t border-border">
                <div className="bg-primary/5 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Encarregado de Proteção de Dados (DPO)</h4>
                  <p className="text-sm text-muted-foreground">
                    Para questões relacionadas à privacidade e proteção de dados, entre em contato com nosso 
                    Encarregado de Proteção de Dados através do e-mail ou WhatsApp disponíveis na plataforma.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;
