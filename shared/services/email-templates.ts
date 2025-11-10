import { Repair } from "../types/repair.type";

export const getRepairCompletedEmailTemplate = (repair: Repair) => {
  const formattedDate = repair.updatedAt.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reparación Completada</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      line-height: 1.6;
      color: #1F2937;
      background-color: #F9FAFB;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #FFFFFF;
    }
    .header {
      background: linear-gradient(135deg, #FFB74D 0%, #FFA726 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .header-icon {
      width: 80px;
      height: 80px;
      background-color: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }
    .header-title {
      color: #FFFFFF;
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .header-subtitle {
      color: rgba(255, 255, 255, 0.9);
      font-size: 16px;
    }
    .content {
      padding: 40px 30px;
    }
    .status-badge {
      display: inline-block;
      background-color: #D1FAE5;
      color: #065F46;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 24px;
      border: 2px solid #10B981;
    }
    .greeting {
      font-size: 18px;
      color: #1F2937;
      margin-bottom: 16px;
    }
    .message {
      font-size: 16px;
      color: #4B5563;
      margin-bottom: 32px;
      line-height: 1.8;
    }
    .info-card {
      background-color: #F9FAFB;
      border: 2px solid #E5E7EB;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .info-row {
      display: flex;
      padding: 12px 0;
      border-bottom: 1px solid #E5E7EB;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-size: 14px;
      color: #6B7280;
      font-weight: 600;
      min-width: 140px;
      display: flex;
      align-items: center;
    }
    .info-value {
      font-size: 15px;
      color: #1F2937;
      font-weight: 500;
      flex: 1;
    }
    .cost-section {
      background: linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%);
      border: 2px solid #FFB74D;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 32px;
    }
    .cost-title {
      font-size: 16px;
      color: #1F2937;
      font-weight: 700;
      margin-bottom: 16px;
      text-align: center;
    }
    .cost-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 15px;
      color: #4B5563;
    }
    .cost-total {
      display: flex;
      justify-content: space-between;
      padding: 16px 0;
      margin-top: 12px;
      border-top: 2px solid #FFB74D;
      font-size: 20px;
      font-weight: bold;
      color: #1F2937;
    }
    .cost-total-value {
      color: #F59E0B;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #FFB74D 0%, #FFA726 100%);
      color: #FFFFFF;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: bold;
      text-align: center;
      margin: 24px 0;
      box-shadow: 0 4px 6px rgba(255, 183, 77, 0.3);
    }
    .cta-container {
      text-align: center;
    }
    .note {
      background-color: #EFF6FF;
      border-left: 4px solid #3B82F6;
      padding: 16px;
      border-radius: 8px;
      margin: 24px 0;
    }
    .note-title {
      font-size: 14px;
      font-weight: 700;
      color: #1E40AF;
      margin-bottom: 8px;
    }
    .note-text {
      font-size: 14px;
      color: #1E40AF;
      line-height: 1.6;
    }
    .footer {
      background-color: #F9FAFB;
      padding: 30px;
      text-align: center;
      border-top: 2px solid #E5E7EB;
    }
    .footer-text {
      font-size: 14px;
      color: #6B7280;
      margin-bottom: 8px;
    }
    .footer-link {
      color: #FFB74D;
      text-decoration: none;
      font-weight: 600;
    }
    .divider {
      height: 2px;
      background: linear-gradient(90deg, transparent, #E5E7EB, transparent);
      margin: 32px 0;
    }
    @media only screen and (max-width: 600px) {
      .header {
        padding: 30px 20px;
      }
      .content {
        padding: 30px 20px;
      }
      .header-title {
        font-size: 24px;
      }
      .info-row {
        flex-direction: column;
      }
      .info-label {
        margin-bottom: 4px;
        min-width: auto;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <div class="header-icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h1 class="header-title">¡Reparación Completada! ✓</h1>
      <p class="header-subtitle">Tu dispositivo está listo para ser recogido</p>
    </div>

    <!-- Content -->
    <div class="content">
      <div style="text-align: center;">
        <span class="status-badge">✓ TERMINADO</span>
      </div>

      <p class="greeting">Hola ${repair.customerName},</p>
      
      <p class="message">
        Nos complace informarte que la reparación de tu dispositivo <strong>${
          repair.deviceModel
        }</strong> ha sido completada exitosamente. Tu equipo está listo para ser recogido en nuestras instalaciones.
      </p>

      <!-- Repair Info Card -->
      <div class="info-card">
        <div class="info-row">
          <span class="info-label">📋 Folio:</span>
          <span class="info-value">${repair.folio || "N/A"}</span>
        </div>
        <div class="info-row">
          <span class="info-label">📱 Dispositivo:</span>
          <span class="info-value">${repair.deviceModel}</span>
        </div>
        <div class="info-row">
          <span class="info-label">🔧 Problema:</span>
          <span class="info-value">${repair.issueDescription}</span>
        </div>
        <div class="info-row">
          <span class="info-label">📅 Fecha:</span>
          <span class="info-value">${formattedDate}</span>
        </div>
      </div>

      <!-- Cost Section -->
      ${
        repair.finalCost > 0
          ? `
      <div class="cost-section">
        <div class="cost-title">💰 Resumen de Costos</div>
        ${
          repair.estimatedCost > 0
            ? `
        <div class="cost-row">
          <span>Mano de obra</span>
          <span>$${repair.estimatedCost.toFixed(2)}</span>
        </div>
        `
            : ""
        }
        ${
          repair.pieces && repair.pieces.length > 0
            ? `
        <div class="cost-row">
          <span>Piezas (${repair.pieces.length} items)</span>
          <span>$${repair.pieces
            .reduce((acc, p) => acc + p.unitCost * p.quantity, 0)
            .toFixed(2)}</span>
        </div>
        `
            : ""
        }
        <div class="cost-total">
          <span>Total a pagar</span>
          <span class="cost-total-value">$${repair.finalCost.toFixed(2)}</span>
        </div>
      </div>
      `
          : ""
      }

      <div class="divider"></div>

      <!-- Important Note -->
      <div class="note">
        <div class="note-title">📍 Información Importante</div>
        <div class="note-text">
          Por favor, trae tu comprobante de servicio (Folio: <strong>${
            repair.folio || "N/A"
          }</strong>) al momento de recoger tu dispositivo. Nuestro horario de atención es de lunes a viernes de 9:00 AM a 6:00 PM.
        </div>
      </div>

      ${
        repair.notes && repair.notes.length > 0
          ? `
      <div class="note" style="background-color: #FFF7ED; border-left-color: #FFB74D;">
        <div class="note-title" style="color: #92400E;">💬 Notas del Técnico</div>
        <div class="note-text" style="color: #92400E;">
          ${repair.notes[repair.notes.length - 1].text}
        </div>
      </div>
      `
          : ""
      }

      <div class="cta-container">
        <a href="tel:+1234567890" class="cta-button">
          📞 Llamar para Coordinar
        </a>
      </div>

      <p style="font-size: 14px; color: #6B7280; text-align: center; margin-top: 24px;">
        Si tienes alguna pregunta, no dudes en contactarnos. ¡Gracias por confiar en nosotros!
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p class="footer-text">Este correo fue enviado automáticamente desde nuestro sistema de gestión de reparaciones.</p>
      <p class="footer-text">
        © ${new Date().getFullYear()} FixTrack. Todos los derechos reservados.
      </p>
      <p class="footer-text" style="margin-top: 16px;">
        <a href="#" class="footer-link">Política de Privacidad</a> • 
        <a href="#" class="footer-link">Términos de Servicio</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

export const getStatusChangeEmailTemplate = (
  repair: Repair,
  previousStatus: string,
  newStatus: string
) => {
  const statusNames: Record<string, string> = {
    in_review: "En Revisión",
    repairing: "Reparando",
    waiting_parts: "Esperando Piezas",
    done: "Terminado",
    not_repaired: "No Reparado",
    delivered: "Entregado",
  };

  const statusIcons: Record<string, string> = {
    in_review: "🔍",
    repairing: "🔧",
    waiting_parts: "⏳",
    done: "✅",
    not_repaired: "❌",
    delivered: "📦",
  };

  const formattedDate = repair.updatedAt.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Actualización de Estado</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      line-height: 1.6;
      color: #1F2937;
      background-color: #F9FAFB;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #FFFFFF;
    }
    .header {
      background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .header-icon {
      width: 80px;
      height: 80px;
      background-color: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      font-size: 40px;
    }
    .header-title {
      color: #FFFFFF;
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .header-subtitle {
      color: rgba(255, 255, 255, 0.9);
      font-size: 16px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      color: #1F2937;
      margin-bottom: 16px;
    }
    .message {
      font-size: 16px;
      color: #4B5563;
      margin-bottom: 32px;
      line-height: 1.8;
    }
    .status-change-card {
      background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%);
      border: 2px solid #3B82F6;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .status-timeline {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 20px 0;
    }
    .status-item {
      text-align: center;
      flex: 1;
    }
    .status-icon {
      font-size: 32px;
      margin-bottom: 8px;
    }
    .status-label {
      font-size: 12px;
      color: #6B7280;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .status-name {
      font-size: 14px;
      color: #1F2937;
      font-weight: 700;
    }
    .status-arrow {
      font-size: 24px;
      color: #3B82F6;
      margin: 0 10px;
    }
    .info-card {
      background-color: #F9FAFB;
      border: 2px solid #E5E7EB;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .info-row {
      display: flex;
      padding: 12px 0;
      border-bottom: 1px solid #E5E7EB;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-size: 14px;
      color: #6B7280;
      font-weight: 600;
      min-width: 140px;
    }
    .info-value {
      font-size: 15px;
      color: #1F2937;
      font-weight: 500;
      flex: 1;
    }
    .footer {
      background-color: #F9FAFB;
      padding: 30px;
      text-align: center;
      border-top: 2px solid #E5E7EB;
    }
    .footer-text {
      font-size: 14px;
      color: #6B7280;
      margin-bottom: 8px;
    }
    .footer-link {
      color: #3B82F6;
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <div class="header-icon">
        🔔
      </div>
      <h1 class="header-title">Actualización de Estado</h1>
      <p class="header-subtitle">Tu reparación ha cambiado de estado</p>
    </div>

    <!-- Content -->
    <div class="content">
      <p class="greeting">Hola ${repair.customerName},</p>
      
      <p class="message">
        Te informamos que el estado de la reparación de tu <strong>${
          repair.deviceModel
        }</strong> ha sido actualizado.
      </p>

      <!-- Status Change Card -->
      <div class="status-change-card">
        <div style="text-align: center; margin-bottom: 16px;">
          <span style="font-size: 14px; color: #1E40AF; font-weight: 700;">CAMBIO DE ESTADO</span>
        </div>
        <div class="status-timeline">
          <div class="status-item">
            <div class="status-icon">${
              statusIcons[previousStatus] || "📋"
            }</div>
            <div class="status-label">Estado Anterior</div>
            <div class="status-name">${statusNames[previousStatus]}</div>
          </div>
          <div class="status-arrow">→</div>
          <div class="status-item">
            <div class="status-icon">${statusIcons[newStatus] || "📋"}</div>
            <div class="status-label">Estado Actual</div>
            <div class="status-name">${statusNames[newStatus]}</div>
          </div>
        </div>
      </div>

      <!-- Repair Info -->
      <div class="info-card">
        <div class="info-row">
          <span class="info-label">📋 Folio:</span>
          <span class="info-value">${repair.folio || "N/A"}</span>
        </div>
        <div class="info-row">
          <span class="info-label">📱 Dispositivo:</span>
          <span class="info-value">${repair.deviceModel}</span>
        </div>
        <div class="info-row">
          <span class="info-label">📅 Actualización:</span>
          <span class="info-value">${formattedDate}</span>
        </div>
      </div>

      <p style="font-size: 14px; color: #6B7280; text-align: center; margin-top: 24px;">
        Te mantendremos informado sobre cualquier cambio en el estado de tu reparación.
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p class="footer-text">Este correo fue enviado automáticamente desde nuestro sistema de gestión de reparaciones.</p>
      <p class="footer-text">
        © ${new Date().getFullYear()} FixTrack. Todos los derechos reservados.
      </p>
    </div>
  </div>
</body>
</html>
  `;
};
