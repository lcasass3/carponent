import {
  AlertText,
  Alert as GluestackAlert,
} from "@/shared/components/ui/alert";
import { Badge } from "@/shared/components/ui/badge";
import { Button, ButtonText } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { RepairsRepository } from "@/shared/repositories/repairs.repository";
import { EmailService } from "@/shared/services/email.service";
import { Repair, RepairStatus } from "@/shared/types/repair.type";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert as RNAlert,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const getStatusText = (status: RepairStatus) => {
  const statusMap = {
    in_review: "En Revisión",
    repairing: "Reparando",
    waiting_parts: "Esperando Piezas",
    done: "Terminado",
    not_repaired: "No Reparado",
    delivered: "Entregado",
  };
  return statusMap[status];
};

const getStatusColor = (status: RepairStatus) => {
  const colorMap = {
    in_review: "info",
    repairing: "warning",
    waiting_parts: "muted",
    done: "success",
    not_repaired: "error",
    delivered: "success",
  };
  return colorMap[status] as "info" | "warning" | "muted" | "success" | "error";
};

const getStatusBadgeStyle = (status: RepairStatus) => {
  const styleMap = {
    in_review: "bg-blue-100 border-blue-400",
    repairing: "bg-orange-100 border-orange-400",
    waiting_parts: "bg-gray-100 border-gray-400",
    done: "bg-green-100 border-green-400",
    not_repaired: "bg-red-100 border-red-400",
    delivered: "bg-emerald-100 border-emerald-400",
  };
  return styleMap[status];
};

const getStatusTextStyle = (status: RepairStatus) => {
  const styleMap = {
    in_review: "text-blue-800",
    repairing: "text-orange-800",
    waiting_parts: "text-gray-700",
    done: "text-green-800",
    not_repaired: "text-red-800",
    delivered: "text-emerald-800",
  };
  return styleMap[status];
};

const getStatusIcon = (
  status: RepairStatus
): keyof typeof Ionicons.glyphMap => {
  const iconMap = {
    in_review: "search-outline",
    repairing: "construct-outline",
    waiting_parts: "time-outline",
    done: "checkmark-done-outline",
    not_repaired: "close-circle-outline",
    delivered: "checkmark-circle-outline",
  };
  return iconMap[status] as keyof typeof Ionicons.glyphMap;
};

export default function ActualizarEstadoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [repair, setRepair] = useState<Repair | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<RepairStatus | "">("");
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: "success" | "error";
    message: string;
  }>({
    visible: false,
    type: "success",
    message: "",
  });

  useEffect(() => {
    if (id) {
      loadRepair();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Auto-dismiss alert after 4 seconds
  useEffect(() => {
    if (alertConfig.visible) {
      const timer = setTimeout(() => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [alertConfig.visible]);

  const loadRepair = async () => {
    try {
      setLoading(true);
      const repairData = await RepairsRepository.getById(id as string);
      if (repairData) {
        setRepair(repairData);
        setNewStatus(repairData.status);
      } else {
        setAlertConfig({
          visible: true,
          type: "error",
          message: "No se encontró la reparación",
        });
      }
    } catch (error) {
      console.error("Error loading repair:", error);
      setAlertConfig({
        visible: true,
        type: "error",
        message: "Error al cargar la reparación",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!repair || !newStatus || newStatus === repair.status) {
      setAlertConfig({
        visible: true,
        type: "error",
        message: "Por favor selecciona un estado diferente",
      });
      return;
    }

    try {
      setUpdating(true);
      const previousStatus = repair.status;

      // Update status in database
      await RepairsRepository.updateStatus(repair.id, newStatus);

      // Send email notifications
      try {
        if (newStatus === "done") {
          // Send special "repair completed" email
          await EmailService.sendRepairCompletedEmail({
            ...repair,
            status: newStatus,
            updatedAt: new Date(),
          });
        } else {
          // Send general status change notification
          await EmailService.sendStatusChangeEmail(
            {
              ...repair,
              status: newStatus,
              updatedAt: new Date(),
            },
            previousStatus,
            newStatus
          );
        }
      } catch (emailError) {
        // Log email error but don't fail the status update
        console.error("Error sending email notification:", emailError);
        // Optionally show a warning to user
        console.warn("Status updated but email notification failed");
      }

      setAlertConfig({
        visible: true,
        type: "success",
        message: `Estado actualizado a "${getStatusText(newStatus)}"${
          newStatus === "done" ? " - Email enviado al cliente" : ""
        }`,
      });

      // Reload repair data
      await loadRepair();

      // Navigate back after a delay
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (error) {
      console.error("Error updating status:", error);
      setAlertConfig({
        visible: true,
        type: "error",
        message: "Error al actualizar el estado. Intenta de nuevo.",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    RNAlert.alert(
      "Cancelar",
      "¿Estás seguro de que quieres cancelar sin guardar los cambios?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí",
          style: "destructive",
          onPress: () => router.back(),
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background-0 items-center justify-center">
        <ActivityIndicator size="large" color="#FFB74D" />
        <Text className="text-typography-500 mt-4">Cargando reparación...</Text>
      </View>
    );
  }

  if (!repair) {
    return (
      <View className="flex-1 bg-background-0 items-center justify-center px-6">
        <View className="bg-background-100 w-20 h-20 rounded-full items-center justify-center mb-4">
          <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
        </View>
        <Text className="text-typography-900 font-bold text-xl mb-2">
          Reparación no encontrada
        </Text>
        <Text className="text-typography-600 text-center mb-6">
          No se pudo cargar la información de la reparación
        </Text>
        <Button onPress={() => router.back()} action="primary">
          <ButtonText>Volver</ButtonText>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background-0">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View className="bg-background-50 pt-12 pb-6 px-6 border-b-2 border-primary-400">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4 w-10 h-10 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-secondary-900">
              Actualizar Estado
            </Text>
            <Text className="text-sm text-primary-500 mt-1">
              Cambiar estado de reparación
            </Text>
          </View>
          <View className="bg-warning-500 w-12 h-12 rounded-full items-center justify-center">
            <Ionicons name="swap-horizontal" size={24} color="white" />
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Repair Info Card */}
        <Card className="p-5 mb-6 bg-background-50 border-2 border-background-200">
          <View className="mb-4 pb-4 border-b border-background-200">
            <Text className="text-xs font-semibold text-primary-600 mb-2">
              FOLIO
            </Text>
            <Text className="text-2xl font-bold text-typography-900">
              {repair.folio}
            </Text>
          </View>

          <View className="mb-4">
            <View className="flex-row items-center mb-2">
              <Ionicons
                name="person-outline"
                size={18}
                color="#6B7280"
                style={{ marginRight: 8 }}
              />
              <Text className="text-sm font-semibold text-typography-600">
                Cliente
              </Text>
            </View>
            <Text className="text-lg font-bold text-typography-900 ml-7">
              {repair.customerName}
            </Text>
            <Text className="text-sm text-typography-600 ml-7">
              {repair.customerPhone}
            </Text>
          </View>

          <View className="mb-4">
            <View className="flex-row items-center mb-2">
              <Ionicons
                name="phone-portrait-outline"
                size={18}
                color="#6B7280"
                style={{ marginRight: 8 }}
              />
              <Text className="text-sm font-semibold text-typography-600">
                Dispositivo
              </Text>
            </View>
            <Text className="text-base font-semibold text-typography-900 ml-7">
              {repair.deviceModel}
            </Text>
          </View>

          <View>
            <View className="flex-row items-center mb-2">
              <Ionicons
                name="document-text-outline"
                size={18}
                color="#6B7280"
                style={{ marginRight: 8 }}
              />
              <Text className="text-sm font-semibold text-typography-600">
                Descripción del problema
              </Text>
            </View>
            <Text className="text-sm text-typography-700 ml-7">
              {repair.issueDescription}
            </Text>
          </View>
        </Card>

        {/* Current Status */}
        <View className="mb-6">
          <Text className="text-base font-bold text-typography-900 mb-3">
            Estado Actual
          </Text>
          <Card className="p-4 bg-background-50 border-2 border-background-200">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View
                  className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${getStatusBadgeStyle(
                    repair.status
                  )}`}
                >
                  <Ionicons
                    name={getStatusIcon(repair.status)}
                    size={24}
                    color={
                      repair.status === "in_review"
                        ? "#1E40AF"
                        : repair.status === "repairing"
                        ? "#C2410C"
                        : repair.status === "waiting_parts"
                        ? "#374151"
                        : repair.status === "done"
                        ? "#15803D"
                        : repair.status === "not_repaired"
                        ? "#B91C1C"
                        : "#047857"
                    }
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-typography-600 mb-1">
                    Estado
                  </Text>
                  <Text
                    className={`text-lg font-bold ${getStatusTextStyle(
                      repair.status
                    )}`}
                  >
                    {getStatusText(repair.status)}
                  </Text>
                </View>
              </View>
              <Badge
                action={getStatusColor(repair.status)}
                variant="outline"
                className={`border-2 ${getStatusBadgeStyle(repair.status)}`}
              >
                <Text
                  className={`text-xs font-bold ${getStatusTextStyle(
                    repair.status
                  )}`}
                >
                  {getStatusText(repair.status)}
                </Text>
              </Badge>
            </View>
          </Card>
        </View>

        {/* Change Status */}
        <View className="mb-6">
          <Text className="text-base font-bold text-typography-900 mb-3">
            Cambiar Estado
          </Text>
          <Card className="p-4 bg-background-50 border-2 border-primary-300">
            <Text className="text-sm text-typography-600 mb-3">
              Selecciona el nuevo estado para esta reparación
            </Text>
            <View className="border-2 border-primary-300 rounded-xl bg-background-50 overflow-hidden">
              <Picker
                selectedValue={newStatus}
                onValueChange={(itemValue) =>
                  setNewStatus(itemValue as RepairStatus)
                }
                style={{
                  fontSize: 16,
                  color: "rgb(var(--color-typography-100))", // Ensures text is visible in both modes
                }}
                itemStyle={{
                  fontSize: 16,
                  color: "rgb(var(--color-typography-100))", // Ensures text is visible in both modes
                }}
                dropdownIconColor="#FFB74D"
              >
                <Picker.Item
                  label="Seleccionar nuevo estado..."
                  value=""
                  enabled={false}
                  color="#6B7280"
                />
                <Picker.Item
                  label="En Revisión"
                  value="in_review"
                  color="#1F2937"
                />
                <Picker.Item
                  label="Reparando"
                  value="repairing"
                  color="#1F2937"
                />
                <Picker.Item
                  label="Esperando Piezas"
                  value="waiting_parts"
                  color="#1F2937"
                />
                <Picker.Item label="Terminado" value="done" color="#1F2937" />
                <Picker.Item
                  label="No Reparado"
                  value="not_repaired"
                  color="#1F2937"
                />
                <Picker.Item
                  label="Entregado"
                  value="delivered"
                  color="#1F2937"
                />
              </Picker>
            </View>

            {newStatus && newStatus !== repair.status && (
              <View className="mt-4 p-3 bg-info-50 border border-info-300 rounded-lg">
                <View className="flex-row items-center">
                  <Ionicons
                    name="information-circle"
                    size={20}
                    color="#3B82F6"
                    style={{ marginRight: 8 }}
                  />
                  <Text className="flex-1 text-sm text-info-700">
                    El estado cambiará de{" "}
                    <Text className="font-bold">
                      &ldquo;{getStatusText(repair.status)}&rdquo;
                    </Text>{" "}
                    a{" "}
                    <Text className="font-bold">
                      &ldquo;{getStatusText(newStatus)}&rdquo;
                    </Text>
                  </Text>
                </View>
              </View>
            )}
          </Card>
        </View>

        {/* Action Buttons */}
        <View className="mb-8 gap-3">
          <Button
            action="primary"
            size="lg"
            className="rounded-xl"
            onPress={handleUpdateStatus}
            isDisabled={updating || !newStatus || newStatus === repair.status}
          >
            {updating ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color="white"
                  style={{ marginRight: 8 }}
                />
                <ButtonText className="font-bold text-base">
                  Guardar Cambios
                </ButtonText>
              </>
            )}
          </Button>

          <Button
            action="secondary"
            variant="outline"
            size="lg"
            className="rounded-xl border-2"
            onPress={handleCancel}
            isDisabled={updating}
          >
            <Ionicons
              name="close-circle-outline"
              size={22}
              color="#6B7280"
              style={{ marginRight: 8 }}
            />
            <ButtonText className="font-bold text-base">Cancelar</ButtonText>
          </Button>
        </View>
      </ScrollView>

      {/* Alert Component */}
      {alertConfig.visible && (
        <View className="absolute top-16 left-4 right-4 z-50">
          <GluestackAlert
            action={alertConfig.type}
            className={`${
              alertConfig.type === "success" ? "bg-success-700" : "bg-error-700"
            } rounded-xl shadow-2xl p-4`}
          >
            <View className="flex-row items-start justify-between w-full">
              <View className="flex-row items-start flex-1 gap-3">
                <Ionicons
                  name={
                    alertConfig.type === "success"
                      ? "checkmark-circle"
                      : "close-circle"
                  }
                  size={24}
                  color="white"
                />
                <View className="flex-1">
                  <AlertText className="text-white font-bold text-base mb-1">
                    {alertConfig.type === "success" ? "¡Éxito!" : "Error"}
                  </AlertText>
                  <AlertText className="text-white text-sm">
                    {alertConfig.message}
                  </AlertText>
                </View>
              </View>
              <TouchableOpacity
                onPress={() =>
                  setAlertConfig((prev) => ({ ...prev, visible: false }))
                }
                className="ml-2"
              >
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </GluestackAlert>
        </View>
      )}
    </View>
  );
}
