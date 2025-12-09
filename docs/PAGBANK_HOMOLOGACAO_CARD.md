# PagBank Homologação - Pagamento com Cartão

## APIs Utilizadas

- ✅ API de Pedidos e Pagamentos (Order)
- ✅ Split de Pagamentos (Order)
- ✅ API Connect (OAuth)
- ✅ API de Cadastro (Account)
- ✅ API PIX
- ✅ Checkout PagBank

---

## Instruções de Acesso para Validação

```
PLATAFORMA: VilaFood - Marketplace de Delivery Regional

URL DE PRODUÇÃO: https://vilafood.delivery
URL DE TESTE: https://preview--vilafood-delivery.lovable.app

FLUXO DE TESTE - CARTÃO DE CRÉDITO:
1. Acesse https://vilafood.delivery
2. Selecione um estabelecimento e adicione produtos ao carrinho
3. Prossiga para o checkout
4. Selecione "Cartão de Crédito" como forma de pagamento
5. Os dados do cartão são criptografados via SDK PagBank no browser
6. O pagamento é processado via API de Orders com capture automático

FLUXO DE TESTE - PIX:
1. Acesse https://vilafood.delivery  
2. Adicione produtos e vá para checkout
3. Selecione "PIX" como forma de pagamento
4. QR Code é gerado via API de Orders

FLUXO SPLIT DE PAGAMENTO:
- Plataforma: 5% do valor do pedido
- Lojista: 95% do valor (recebe direto via split)
- Configurado via receivers no payload da cobrança

FLUXO OAUTH CONNECT:
1. Lojista acessa painel do estabelecimento
2. Clica em "Conectar PagBank" 
3. Redireciona para autorização OAuth PagBank
4. Retorna com code para troca por access_token

ENDPOINTS EDGE FUNCTIONS:
- POST /functions/v1/pagseguro-card (Cartão Transparente)
- POST /functions/v1/pagseguro-pix (PIX QR Code)
- POST /functions/v1/pagseguro-oauth (OAuth Connect)
- POST /functions/v1/pagseguro-webhook (Notificações)

CONTATO TÉCNICO: suporte@vilafood.delivery
```

---

## Recursos de Segurança

**Sim** - Utilizamos os seguintes recursos de segurança:

1. **Criptografia SDK PagBank**: Dados do cartão são criptografados no browser usando o SDK oficial do PagBank (pagseguro.min.js) com algoritmo RSA, reduzindo escopo PCI.

2. **JWT Authentication**: Todas as Edge Functions validam JWT token do usuário autenticado.

3. **Validação de Propriedade**: Verificamos que o order_id pertence ao establishment_id antes de processar.

4. **Rate Limiting**: Implementado via Supabase Edge Functions.

5. **CORS Headers**: Configurados para aceitar apenas origens permitidas.

6. **Idempotency Key**: Cada requisição inclui chave única para evitar duplicações.

7. **Webhook Validation**: Validação de assinatura HMAC nas notificações.

---

## Exemplo Request/Response - Criar Pedido com Cartão

### Request

```bash
curl --location --request POST 'https://api.pagseguro.com/orders' \
--header 'Authorization: Bearer {{ACCESS_TOKEN}}' \
--header 'Content-Type: application/json' \
--header 'x-idempotency-key: {{UNIQUE_KEY}}' \
--data-raw '{
    "reference_id": "order-uuid-123",
    "customer": {
        "name": "Jose da Silva",
        "email": "cliente@email.com",
        "tax_id": "12345678909",
        "phones": [
            {
                "country": "55",
                "area": "11",
                "number": "999999999",
                "type": "MOBILE"
            }
        ]
    },
    "items": [
        {
            "reference_id": "order-uuid-123",
            "name": "Pedido Pizzaria Bella",
            "quantity": 1,
            "unit_amount": 5990
        }
    ],
    "notification_urls": [
        "https://gyagfsjbdaacgmmofqip.supabase.co/functions/v1/pagseguro-webhook"
    ],
    "charges": [
        {
            "reference_id": "charge-order-uuid-123",
            "description": "Pagamento do Pedido - Pizzaria Bella",
            "amount": {
                "value": 5990,
                "currency": "BRL"
            },
            "payment_method": {
                "type": "CREDIT_CARD",
                "installments": 1,
                "capture": true,
                "card": {
                    "encrypted": "V++53ir0qvoK/rUSzNjCqP8Hz9ZTa+HohR779n63CV+NvCeYj4J4lQevL4NKN7Di3BxKQGqfQW5cfS7/4rHw4w8URuOV/j/mGau2GXxkKQ6/szJ6BQr//C4e4XgfCHDwcONQhuPDHMdOB1C+4lzyBbsPJUZ/8TUQrxhMMiMFjwGeg62uf7cUqdFjp+Q5dqJXwhLgH3d1EoX+JKStBLqVzF0lW3gHtFOyfvFhuxxBgB0xrzTKfbTqnL5aSYBoGXRFM0gLodMm6knx7bW+syThxyQffnaigCwj2aNohsu+fuXII+3WnlgrHQxaBx3ChRuWKy+loV2L2USiGulp/bPEcg==",
                    "security_code": "123",
                    "holder": {
                        "name": "JOSE DA SILVA",
                        "tax_id": "12345678909"
                    },
                    "store": false
                }
            },
            "splits": {
                "method": "FIXED",
                "receivers": [
                    {
                        "account": {
                            "id": "ACC_PLATAFORMA_ID"
                        },
                        "amount": {
                            "value": 300
                        },
                        "reason_code": 2,
                        "fee_share": {
                            "mode": "AGREED",
                            "value": 0
                        }
                    }
                ]
            }
        }
    ]
}'
```

### Response (Sucesso)

```json
{
    "id": "ORDE_123ABC456DEF",
    "reference_id": "order-uuid-123",
    "created_at": "2025-01-15T10:30:00.000-03:00",
    "customer": {
        "name": "Jose da Silva",
        "email": "cliente@email.com",
        "tax_id": "12345678909",
        "phones": [
            {
                "country": "55",
                "area": "11",
                "number": "999999999",
                "type": "MOBILE"
            }
        ]
    },
    "items": [
        {
            "reference_id": "order-uuid-123",
            "name": "Pedido Pizzaria Bella",
            "quantity": 1,
            "unit_amount": 5990
        }
    ],
    "charges": [
        {
            "id": "CHAR_789XYZ",
            "reference_id": "charge-order-uuid-123",
            "status": "PAID",
            "created_at": "2025-01-15T10:30:00.000-03:00",
            "paid_at": "2025-01-15T10:30:02.000-03:00",
            "description": "Pagamento do Pedido - Pizzaria Bella",
            "amount": {
                "value": 5990,
                "summary": {
                    "total": 5990,
                    "paid": 5990,
                    "refunded": 0
                }
            },
            "payment_response": {
                "code": "20000",
                "message": "SUCESSO"
            },
            "payment_method": {
                "type": "CREDIT_CARD",
                "installments": 1,
                "capture": true,
                "card": {
                    "brand": "visa",
                    "first_digits": "424242",
                    "last_digits": "4242",
                    "exp_month": "12",
                    "exp_year": "2030",
                    "holder": {
                        "name": "JOSE DA SILVA",
                        "tax_id": "***456789**"
                    }
                }
            },
            "splits": [
                {
                    "account": {
                        "id": "ACC_PLATAFORMA_ID"
                    },
                    "amount": {
                        "value": 300
                    },
                    "status": "RELEASED"
                },
                {
                    "account": {
                        "id": "ACC_LOJISTA_ID"
                    },
                    "amount": {
                        "value": 5690
                    },
                    "status": "RELEASED"
                }
            ]
        }
    ],
    "notification_urls": [
        "https://gyagfsjbdaacgmmofqip.supabase.co/functions/v1/pagseguro-webhook"
    ],
    "links": [
        {
            "rel": "SELF",
            "href": "https://api.pagseguro.com/orders/ORDE_123ABC456DEF",
            "method": "GET"
        }
    ]
}
```

---

## Exemplo Webhook Notification

### Request (PagBank → VilaFood)

```json
{
    "id": "ORDE_123ABC456DEF",
    "reference_id": "order-uuid-123",
    "charges": [
        {
            "id": "CHAR_789XYZ",
            "status": "PAID",
            "paid_at": "2025-01-15T10:30:02.000-03:00",
            "amount": {
                "value": 5990,
                "currency": "BRL"
            },
            "payment_response": {
                "code": "20000",
                "message": "SUCESSO"
            }
        }
    ]
}
```

### Response (VilaFood → PagBank)

```json
{
    "success": true,
    "message": "Webhook processed successfully"
}
```

---

## Fluxo de Criptografia (SDK Browser)

```javascript
// 1. Carregar SDK
<script src="https://assets.pagseguro.com.br/checkout-sdk-js/rc/dist/browser/pagseguro.min.js"></script>

// 2. Criptografar cartão
const card = PagSeguro.encryptCard({
    publicKey: "CHAVE_PUBLICA_ESTABLISHMENT",
    holder: "JOSE DA SILVA",
    number: "4242424242424242",
    expMonth: "12",
    expYear: "2030",
    securityCode: "123"
});

// 3. Verificar erros
if (card.hasErrors) {
    console.error(card.errors);
    return;
}

// 4. Enviar encrypted card para backend
const encryptedCard = card.encryptedCard;
// Enviar para /functions/v1/pagseguro-card
```

---

## URLs de Configuração

| Ambiente | URL |
|----------|-----|
| Produção | https://vilafood.delivery |
| Webhook | https://gyagfsjbdaacgmmofqip.supabase.co/functions/v1/pagseguro-webhook |
| OAuth Redirect | https://vilafood.delivery/painel/callback/pagseguro |

---

## Checklist de Homologação

- [x] Criptografia de cartão via SDK browser
- [x] Criação de pedido com cartão (capture: true)
- [x] Split de pagamento configurado
- [x] Webhook para notificações
- [x] OAuth Connect para onboarding de lojistas
- [x] PIX dinâmico com QR Code
- [x] Tratamento de erros granular
- [x] Logs de transação para auditoria
