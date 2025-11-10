import { Alert, AlertText } from "@/shared/components/ui/alert";
import { RepairsRepository } from "@/shared/repositories/repairs.repository";
import { EmailService } from "@/shared/services/email.service";
import { Repair } from "@/shared/types/repair.type";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Alert as RNAlert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Signature from "react-native-signature-canvas";

export default function EntregarEquipo() {
  const router = useRouter();
  const [folio, setFolio] = useState("");
  const [firma, setFirma] = useState<string | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [repair, setRepair] = useState<Repair | null>(null);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: "success" | "error";
    message: string;
  }>({ visible: false, type: "success", message: "" });

  const signatureRef = useRef<any>(null);

  const showAlert = (type: "success" | "error", message: string) => {
    setAlertConfig({ visible: true, type, message });
    setTimeout(() => {
      setAlertConfig({ visible: false, type: "success", message: "" });
    }, 4000);
  };

  const handleOK = (signature: string) => {
    setFirma(signature);
    console.log("Firma guardada:", signature);
    setScrollEnabled(true);
  };

  const handleClear = () => {
    setFirma(null);
    if (signatureRef.current) {
      signatureRef.current.clearSignature();
    }
    showAlert("error", "Firma borrada. Por favor, firma nuevamente.");
  };

  const handleSignatureBegin = () => {
    setScrollEnabled(false);
    // Auto-enable signature when user starts signing
    if (!firma) {
      setFirma("signed");
    }
  };

  const handleSignatureEnd = () => {
    setScrollEnabled(true);
  };

  const handleVerifyFolio = async () => {
    if (!folio.trim()) {
      showAlert("error", "Por favor, ingresa el número de folio");
      return;
    }

    setVerifying(true);
    try {
      const foundRepair = await RepairsRepository.getByFolio(folio.trim());

      if (!foundRepair) {
        showAlert("error", "Folio no encontrado. Verifica el número");
        setRepair(null);
        return;
      }

      if (foundRepair.status === "delivered") {
        showAlert("error", "Este equipo ya fue entregado anteriormente");
        setRepair(foundRepair);
        return;
      }

      if (foundRepair.status !== "done") {
        showAlert(
          "error",
          "Este equipo aún no está listo para entrega. Estado actual: " +
            getStatusText(foundRepair.status)
        );
        setRepair(foundRepair);
        return;
      }

      setRepair(foundRepair);
      showAlert("success", "Folio verificado. Dispositivo listo para entrega");
    } catch (error) {
      console.error("Error verifying folio:", error);
      showAlert("error", "Error al verificar el folio");
      setRepair(null);
    } finally {
      setVerifying(false);
    }
  };

  const handleEntregar = async () => {
    if (!folio.trim()) {
      RNAlert.alert(
        "Folio requerido",
        "Por favor, ingresa el número de folio."
      );
      return;
    }

    if (!repair) {
      RNAlert.alert(
        "Verificar folio",
        "Por favor, verifica el folio antes de entregar"
      );
      return;
    }

    if (!firma) {
      RNAlert.alert(
        "Firma requerida",
        "El cliente debe firmar antes de continuar."
      );
      return;
    }

    RNAlert.alert(
      "Confirmar Entrega",
      `¿Confirmar la entrega del equipo ${repair.deviceModel} a ${repair.customerName}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          style: "default",
          onPress: async () => {
            setLoading(true);
            try {
              // Mark as delivered in database
              await RepairsRepository.markAsDelivered(repair.id);

              // Send delivery confirmation email
              try {
                const updatedRepair = await RepairsRepository.getById(
                  repair.id
                );
                if (updatedRepair) {
                  await EmailService.sendDeliveryConfirmationEmail(
                    updatedRepair
                  );
                }
              } catch (emailError) {
                console.error("Error sending delivery email:", emailError);
                console.warn("Delivery confirmed but email failed");
              }

              showAlert(
                "success",
                "¡Entrega confirmada! Email enviado al cliente"
              );

              // Reset form after successful delivery
              setTimeout(() => {
                setFolio("");
                setFirma(null);
                setRepair(null);
                if (signatureRef.current) {
                  signatureRef.current.clearSignature();
                }
                router.back();
              }, 2000);
            } catch (error) {
              console.error("Error marking as delivered:", error);
              showAlert("error", "Error al confirmar la entrega");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    RNAlert.alert("Cancelar", "¿Deseas cancelar la entrega?", [
      { text: "No", style: "cancel" },
      {
        text: "Sí",
        style: "destructive",
        onPress: () => {
          setFolio("");
          setFirma(null);
          setRepair(null);
          if (signatureRef.current) {
            signatureRef.current.clearSignature();
          }
          router.back();
        },
      },
    ]);
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      in_review: "En Revisión",
      repairing: "Reparando",
      waiting_parts: "Esperando Piezas",
      done: "Terminado",
      not_repaired: "No Reparado",
      delivered: "Entregado",
    };
    return statusMap[status] || status;
  };

  return (
    <ScrollView
      className="flex-1 bg-background-50 p-6"
      scrollEnabled={scrollEnabled}
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      {/* Alert */}
      {alertConfig.visible && (
        <Alert action={alertConfig.type} className="mb-4">
          <AlertText>{alertConfig.message}</AlertText>
        </Alert>
      )}

      {/* Encabezado */}
      <View className="items-center mb-6 mt-2">
        <Text className="text-2xl font-bold text-typography-900 mb-3">
          Entregar Equipo
        </Text>
        <Image
          source={require("@/assets/images/delivery-img.png")}
          style={{ width: 100, height: 100, marginBottom: 8 }}
        />

        <Text className="text-center text-typography-900 opacity-70">
          Ingresa el folio para la entrega del equipo reparado
        </Text>
      </View>

      {/* Campo de Folio */}
      <View className="bg-background-100 p-5 rounded-2xl shadow-md border border-background-200 mb-6">
        <Text className="text-typography-900 mb-2 font-semibold">
          Número de folio
        </Text>
        <View className="flex-row gap-3">
          <TextInput
            placeholder="Ej: F-001"
            placeholderTextColor="#9CA3AF"
            value={folio}
            onChangeText={(text) => {
              setFolio(text.toUpperCase());
              setRepair(null); // Clear repair when folio changes
            }}
            className="flex-1 border border-background-200 rounded-xl p-4 bg-background-50 text-typography-900"
            editable={!loading && !verifying}
            autoCapitalize="characters"
          />
          <TouchableOpacity
            onPress={handleVerifyFolio}
            disabled={!folio.trim() || verifying || loading}
            className={`rounded-xl px-5 justify-center ${
              !folio.trim() || verifying || loading
                ? "bg-background-200"
                : "bg-primary-500"
            }`}
          >
            {verifying ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-background-50 font-semibold">
                Verificar
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Información del Equipo (mostrar solo si está verificado) */}
      {repair && (
        <View className="bg-success-50 p-5 rounded-2xl shadow-md border-2 border-success-500 mb-6">
          <View className="flex-row items-center mb-3">
            <Text className="text-2xl mr-2">✅</Text>
            <Text className="text-success-700 font-bold text-lg">
              Equipo Verificado
            </Text>
          </View>

          <View className="space-y-2">
            <View className="flex-row justify-between py-2 border-b border-success-200">
              <Text className="text-success-700 font-semibold">Cliente:</Text>
              <Text className="text-success-900">{repair.customerName}</Text>
            </View>
            <View className="flex-row justify-between py-2 border-b border-success-200">
              <Text className="text-success-700 font-semibold">
                Dispositivo:
              </Text>
              <Text className="text-success-900">{repair.deviceModel}</Text>
            </View>
            <View className="flex-row justify-between py-2 border-b border-success-200">
              <Text className="text-success-700 font-semibold">Folio:</Text>
              <Text className="text-success-900">{repair.folio}</Text>
            </View>
            <View className="flex-row justify-between py-2">
              <Text className="text-success-700 font-semibold">
                Costo Total:
              </Text>
              <Text className="text-success-900 font-bold">
                ${(repair.finalCost || repair.estimatedCost).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Firma del Cliente */}
      <View
        className={`p-5 rounded-2xl shadow-md border-2 mb-6 ${
          firma
            ? "bg-success-50 border-success-500"
            : "bg-background-100 border-background-200"
        }`}
      >
        <View className="flex-row items-center justify-between mb-3">
          <Text
            className={`font-semibold ${
              firma ? "text-success-700" : "text-typography-900"
            }`}
          >
            Firma de Entregado
          </Text>
          {firma && (
            <View className="flex-row items-center">
              <Text className="text-success-700 font-semibold mr-1">✓</Text>
              <Text className="text-success-700 text-sm font-semibold">
                Firmado
              </Text>
            </View>
          )}
        </View>
        <View
          style={{
            height: 200,
            borderWidth: 2,
            borderColor: "rgb(var(--color-background-200))",
            borderRadius: 12,
            backgroundColor: "rgb(var(--color-background-50))",
          }}
        >
          <Signature
            ref={signatureRef}
            onOK={handleOK}
            onBegin={handleSignatureBegin}
            onEnd={handleSignatureEnd}
            descriptionText="Firme aquí"
            clearText="Borrar"
            confirmText="Guardar"
            webStyle={`
              .m-signature-pad { 
                border: none; 
                background-color: rgb(var(--color-background-50));
              }
            `}
          />
        </View>

        <TouchableOpacity
          onPress={handleClear}
          className="bg-background-50 rounded-xl p-3 mt-4 border border-background-200"
        >
          <Text className="text-typography-900 text-center font-semibold">
            Borrar Firma
          </Text>
        </TouchableOpacity>
      </View>

      {/* Advertencia */}
      <View className="flex-row items-start bg-background-50 p-3 rounded-xl border border-background-200">
        <Text className="text-3xl mr-3 text-typography-900">⚠️</Text>
        <Text className="text-typography-900 flex-1">
          Verificar que el folio sea correcto antes de realizar la entrega
        </Text>
      </View>
      {/* Botones de acción */}
      <View className="flex-row justify-between gap-4 mb-6 p-4">
        <TouchableOpacity
          onPress={handleEntregar}
          disabled={!repair || !firma || loading}
          className={`flex-1 rounded-xl p-4 border border-background-200 ${
            !repair || !firma || loading
              ? "bg-background-200"
              : "bg-success-500"
          }`}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text
              className={`text-center font-bold text-lg ${
                !repair || !firma || loading
                  ? "text-typography-500"
                  : "text-background-50"
              }`}
            >
              Entregar
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleCancel}
          disabled={loading}
          className="flex-1 bg-background-200 rounded-xl p-4 border border-background-200"
        >
          <Text className="text-typography-900 text-center font-bold text-lg">
            Cancelar
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
