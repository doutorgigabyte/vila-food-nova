import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { gatewayEmailSend, isGatewayEnabled } from "../_shared/gateway.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  resetLink: string;
}

const FROM_ADDRESS = "VilaFood <noreply@vilafood.delivery>";
const SUBJECT = "Redefinir sua senha - VilaFood";

function buildHtml(resetLink: string): string {
  return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Redefinir Senha</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-width: 100%; background-color: #f4f4f5;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="padding: 40px 32px; text-align: center;">
                      <div style="margin-bottom: 24px;">
                        <span style="font-size: 32px; font-weight: 700; color: #ea580c;">🍽️ VilaFood</span>
                      </div>
                      <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #18181b;">
                        Redefinir sua senha
                      </h1>
                      <p style="margin: 0 0 32px; font-size: 16px; line-height: 24px; color: #52525b;">
                        Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha.
                      </p>
                      <a href="${resetLink}" target="_blank" style="display: inline-block; padding: 14px 32px; background-color: #ea580c; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px; transition: background-color 0.2s;">
                        Redefinir Senha
                      </a>
                      <p style="margin: 32px 0 0; font-size: 14px; color: #71717a;">
                        Se o botão não funcionar, copie e cole este link no seu navegador:
                      </p>
                      <p style="margin: 8px 0 0; font-size: 12px; color: #a1a1aa; word-break: break-all;">
                        ${resetLink}
                      </p>
                      <div style="margin-top: 32px; padding: 16px; background-color: #fef3c7; border-radius: 8px;">
                        <p style="margin: 0; font-size: 14px; color: #92400e;">
                          ⚠️ Se você não solicitou esta redefinição, ignore este e-mail. Sua senha permanecerá inalterada.
                        </p>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 24px 32px; border-top: 1px solid #e4e4e7; text-align: center;">
                      <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                        Este e-mail foi enviado automaticamente pelo VilaFood.<br>
                        © ${new Date().getFullYear()} VilaFood. Todos os direitos reservados.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, resetLink }: PasswordResetRequest = await req.json();

    if (!email || !resetLink) {
      console.error("Missing email or resetLink");
      return new Response(
        JSON.stringify({ error: "Email e link de reset são obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending password reset email to: ${email}`);

    const html = buildHtml(resetLink);

    if (isGatewayEnabled()) {
      const gatewayResult = await gatewayEmailSend({
        from: FROM_ADDRESS,
        to: [email],
        subject: SUBJECT,
        html,
      });

      if (gatewayResult.success) {
        console.log("Email sent via gateway:", gatewayResult.data);
        return new Response(
          JSON.stringify({ success: true, data: gatewayResult.data }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      console.warn("Gateway email failed, falling back to direct Resend:", gatewayResult.error);
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured and gateway unavailable");
    }
    const resend = new Resend(resendApiKey);

    const emailResponse = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [email],
      subject: SUBJECT,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending password reset email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
