const BREVO_API_KEY = process.env.EXPO_PUBLIC_BREVO_API_KEY!;
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export interface BrevoEmailRequest {
  sender: {
    name: string;
    email: string;
  };
  to: {
    email: string;
    name?: string;
  }[];
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export interface BrevoEmailResponse {
  messageId: string;
}

export class BrevoAPI {
  static async sendTransactionalEmail(
    emailData: BrevoEmailRequest
  ): Promise<BrevoEmailResponse> {
    try {
      const response = await fetch(BREVO_API_URL, {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": BREVO_API_KEY,
          "content-type": "application/json",
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Brevo API error: ${response.status} - ${JSON.stringify(errorData)}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error sending email via Brevo:", error);
      throw error;
    }
  }
}