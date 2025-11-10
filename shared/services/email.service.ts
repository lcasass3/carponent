import { Repair } from "../types/repair.type";
import { BrevoAPI, BrevoEmailRequest } from "./brevo";
import {
  getDeliveryConfirmationEmailTemplate,
  getRepairCompletedEmailTemplate,
  getStatusChangeEmailTemplate,
} from "./email-templates";

export class EmailService {
  private static readonly FROM_NAME = "Reparaciones Fix Track";
  private static readonly FROM_EMAIL =
    process.env.EXPO_PUBLIC_FROM_EMAIL || "your-email@gmail.com";

  /**
   * Send email notification when repair is completed
   */
  static async sendRepairCompletedEmail(repair: Repair): Promise<void> {
    try {
      const htmlContent = getRepairCompletedEmailTemplate(repair);

      const emailData: BrevoEmailRequest = {
        sender: {
          name: this.FROM_NAME,
          email: this.FROM_EMAIL,
        },
        to: [
          {
            email: repair.customerEmail,
            name: repair.customerName,
          },
        ],
        subject: `✅ Tu reparación está lista - Folio ${repair.folio}`,
        htmlContent,
        textContent: `Hola ${repair.customerName}, tu reparación con folio ${repair.folio} está lista para recoger.`,
      };

      await BrevoAPI.sendTransactionalEmail(emailData);
      console.log(
        `Repair completed email sent to ${repair.customerEmail} for repair ${repair.folio}`
      );
    } catch (error) {
      console.error("Failed to send repair completed email:", error);
      // Don't throw - we don't want email failures to block the app
    }
  }

  /**
   * Send email notification when repair status changes
   */
  static async sendStatusChangeEmail(
    repair: Repair,
    previousStatus: string,
    newStatus: string
  ): Promise<void> {
    try {
      const htmlContent = getStatusChangeEmailTemplate(
        repair,
        previousStatus,
        newStatus
      );

      const statusTexts: Record<string, string> = {
        in_review: "En Revisión",
        repairing: "Reparando",
        waiting_parts: "Esperando Piezas",
        done: "Terminado",
        not_repaired: "No Reparado",
        delivered: "Entregado",
      };

      const emailData: BrevoEmailRequest = {
        sender: {
          name: this.FROM_NAME,
          email: this.FROM_EMAIL,
        },
        to: [
          {
            email: repair.customerEmail,
            name: repair.customerName,
          },
        ],
        subject: `� Actualización de tu reparación - ${
          statusTexts[newStatus] || newStatus
        }`,
        htmlContent,
        textContent: `Hola ${
          repair.customerName
        }, el estado de tu reparación con folio ${
          repair.folio
        } ha cambiado a: ${statusTexts[newStatus] || newStatus}.`,
      };

      await BrevoAPI.sendTransactionalEmail(emailData);
      console.log(
        `Status change email sent to ${repair.customerEmail} for repair ${repair.folio}`
      );
    } catch (error) {
      console.error("Failed to send status change email:", error);
      // Don't throw - we don't want email failures to block the app
    }
  }

  /**
   * Send email notification when repair is delivered
   */
  static async sendDeliveryConfirmationEmail(repair: Repair): Promise<void> {
    try {
      const htmlContent = getDeliveryConfirmationEmailTemplate(repair);

      const emailData: BrevoEmailRequest = {
        sender: {
          name: this.FROM_NAME,
          email: this.FROM_EMAIL,
        },
        to: [
          {
            email: repair.customerEmail,
            name: repair.customerName,
          },
        ],
        subject: `✅ Entrega confirmada - Folio ${repair.folio}`,
        htmlContent,
        textContent: `Hola ${repair.customerName}, confirmamos que tu ${repair.deviceModel} con folio ${repair.folio} ha sido entregado exitosamente. ¡Gracias por confiar en nosotros!`,
      };

      await BrevoAPI.sendTransactionalEmail(emailData);
      console.log(
        `Delivery confirmation email sent to ${repair.customerEmail} for repair ${repair.folio}`
      );
    } catch (error) {
      console.error("Failed to send delivery confirmation email:", error);
      // Don't throw - we don't want email failures to block the app
    }
  }
}
