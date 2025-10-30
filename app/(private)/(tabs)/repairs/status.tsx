import { Button, ButtonText } from "@/shared/components/ui/button";
import { RepairsRepository } from "@/shared/repositories/repairs.repository";
import { EmailService } from "@/shared/services/email.service";
import { RepairStatus } from "@/shared/types/repair.type";
import { Picker } from "@react-native-picker/picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Image, ScrollView, Text, View } from "react-native";
// Definir tipos para los mapeos
type DisplayStatus =
  | "Revisión"
  | "En progreso"
  | "Esperando Piezas"
  | "Completo"
  | "Cancelado"
  | "Entregado";

type StatusMapType = {
  [key in RepairStatus]: DisplayStatus;
};

type ReverseStatusMapType = {
  [key in DisplayStatus]: RepairStatus;
};

export default function ActualizarEstadoScreen() {
  const { repairId, currentStatus } = useLocalSearchParams();
  const [estado, setEstado] = useState<RepairStatus>("repairing");
  const [nuevoEstado, setNuevoEstado] = useState<DisplayStatus | undefined>(
    undefined
  );
  const [loading, setLoading] = useState(false);
  const [repairData, setRepairData] = useState<any>(null);
  const [estadoVisual, setEstadoVisual] = useState<RepairStatus>("repairing");

  // Mapeo de estados de la base de datos a la interfaz
  const statusMap: StatusMapType = {
    in_review: "Revisión",
    repairing: "En progreso",
    waiting_parts: "Esperando Piezas",
    done: "Completo",
    not_repaired: "Cancelado",
    delivered: "Entregado",
  };

  // Mapeo inverso para enviar a Firebase
  const reverseStatusMap: ReverseStatusMapType = {
    Revisión: "in_review",
    "En progreso": "repairing",
    "Esperando Piezas": "waiting_parts",
    Completo: "done",
    Cancelado: "not_repaired",
    Entregado: "delivered",
  };

  // CONSULTAR LOS DATOS ACTUALES DE LA REPARACIÓN
  useEffect(() => {
    const loadRepairData = async () => {
      if (!repairId || Array.isArray(repairId)) return;

      try {
        const repairIdString = Array.isArray(repairId) ? repairId[0] : repairId;
        const repair = await RepairsRepository.getById(repairIdString);

        if (repair) {
          setRepairData(repair);
          setEstado(repair.status);
          setEstadoVisual(repair.status);
          setNuevoEstado(undefined);
          console.log("Datos de reparación cargados:", repair.status);
        }
      } catch (error) {
        console.error("Error cargando datos de reparación:", error);
      }
    };

    loadRepairData();
  }, [repairId]);

  const handleEstadoChange = (itemValue: DisplayStatus) => {
    setNuevoEstado(itemValue);

    if (itemValue) {
      const firebaseStatus = reverseStatusMap[itemValue];
      setEstadoVisual(firebaseStatus);
    }
  };

  const handleCancel = () => {
    setEstadoVisual(estado);
    setNuevoEstado(undefined);

    Alert.alert("Cancelar", "¿Estás seguro de que quieres cancelar?", [
      { text: "No" },
      {
        text: "Sí",
        onPress: () => {
          console.log("Estado no actualizado");
          router.push("/(private)/(tabs)");
        },
      },
    ]);
  };

  const handleUpdate = async () => {
    if (!nuevoEstado) {
      Alert.alert("Error", "Por favor selecciona un estado nuevo");
      return;
    }

    if (!repairId || Array.isArray(repairId)) {
      Alert.alert("Error", "No se encontró la reparación a actualizar");
      return;
    }

    setLoading(true);

    try {
      const firebaseStatus = reverseStatusMap[nuevoEstado];
      const repairIdString = Array.isArray(repairId) ? repairId[0] : repairId;

      console.log("Actualizando reparación:", repairIdString);
      console.log("Nuevo estado:", firebaseStatus);

      const previousStatus = estado;

      // Actualizar en Firebase
      await RepairsRepository.updateStatus(repairIdString, firebaseStatus);

      // === Enviar correo al cliente ===
      try {
        if (firebaseStatus === "done") {
          // Enviar email de reparación completada
          await EmailService.sendRepairCompletedEmail({
            ...repairData,
            status: firebaseStatus,
            updatedAt: new Date(),
          });
        } else {
          // Enviar email de cambio de estado general
          await EmailService.sendStatusChangeEmail(
            {
              ...repairData,
              status: firebaseStatus,
              updatedAt: new Date(),
            },
            previousStatus,
            firebaseStatus
          );
        }

        console.log("Correo enviado exitosamente");
      } catch (emailError) {
        console.error("Error al enviar correo:", emailError);
      }

      // Actualizar estado local
      setEstado(firebaseStatus);
      setEstadoVisual(firebaseStatus);

      Alert.alert("Éxito", `Estado actualizado a: ${nuevoEstado}`, [
        {
          text: "OK",
          onPress: () => router.push("/(private)/(tabs)"),
        },
      ]);
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      Alert.alert("Error", "No se pudo actualizar el estado");
    } finally {
      setLoading(false);
    }
  };

  // ======== función para asignar color según estado ========
  const getEstadoColor = (estado: RepairStatus) => {
    const displayStatus = statusMap[estado];

    switch (displayStatus) {
      case "Esperando Piezas":
      case "Revisión":
      case "En progreso":
        return {
          bg: "bg-yellow-100 dark:bg-yellow-800",
          text: "text-yellow-800 dark:text-yellow-100",
          border: "border-yellow-300 dark:border-yellow-700",
        };
      case "Completo":
      case "Entregado":
        return {
          bg: "bg-green-100 dark:bg-green-800",
          text: "text-green-800 dark:text-green-100",
          border: "border-green-300 dark:border-green-700",
        };
      case "Cancelado":
        return {
          bg: "bg-red-100 dark:bg-red-800",
          text: "text-red-800 dark:text-red-100",
          border: "border-red-300 dark:border-red-700",
        };
      default:
        return {
          bg: "bg-background-50",
          text: "text-typography-900",
          border: "border-background-200",
        };
    }
  };

  // Convertir estado actual para mostrar en la interfaz
  const displayEstado = statusMap[estadoVisual];
  const estadoColors = getEstadoColor(estadoVisual);

  return (
    <ScrollView
      className="flex-1 bg-background-100"
      style={{ backgroundColor: "#193456" }}
      contentContainerStyle={{
        alignItems: "center",
        paddingBottom: 100,
      }}
    >
      {/* Título */}
      <Text
        className="text-3xl font-extrabold text-white"
        style={{ color: "#FFB74D", marginTop: 40 }}
      >
        Actualizar Estado
      </Text>

      {/* Card principal */}
      <View
        className="bg-background-50 w-[90%] rounded-xl p-5 items-center border border-4"
        style={{ margin: 40 }}
      >
        {/* Imagen del equipo */}
        <Image
          source={{
            uri: "https://cdn-icons-png.flaticon.com/512/4824/4824793.png",
          }}
          className="w-20 h-20 mb-3"
        />

        {/* Información del cliente - AHORA CON DATOS REALES */}
        <View className="items-center mb-4">
          <Text className="font-bold text-base text-typography-900">
            ID: {Array.isArray(repairId) ? repairId[0] : repairId || "N/A"}
          </Text>
          <Text className="text-base text-typography-900">
            {repairData?.customerName || "Cargando..."}
          </Text>
          <Text className="text-sm text-typography-900">
            {repairData?.deviceModel || "Cargando dispositivo..."}
          </Text>
          <Text className="text-xs text-typography-900 opacity-70">
            {repairData?.issueDescription || "Cargando descripción..."}
          </Text>
        </View>

        {/* Estado actual */}
        <View className="w-full mb-3">
          <Text className="text-xl font-bold mb-1 text-typography-900">
            Estado actual
          </Text>
          <View
            className={`p-3 rounded-md items-center border ${estadoColors.bg} ${estadoColors.border}`}
          >
            <Text className={`font-bold ${estadoColors.text}`}>
              {displayEstado}
            </Text>
          </View>
        </View>

        {/* Cambiar estado */}
        <View className="w-full mb-5">
          <Text className="text-xl font-bold mb-1 text-typography-900">
            Cambiar estado
          </Text>
          <View className="border border-background-200 rounded-md bg-background-50">
            <Picker
              selectedValue={nuevoEstado}
              onValueChange={handleEstadoChange}
            >
              <Picker.Item label="Seleccionar estado" value="" />
              <Picker.Item label="Esperando Piezas" value="Esperando Piezas" />
              <Picker.Item label="Revisión" value="Revisión" />
              <Picker.Item label="En progreso" value="En progreso" />
              <Picker.Item label="Completo" value="Completo" />
              <Picker.Item label="Cancelado" value="Cancelado" />
            </Picker>
          </View>
        </View>

        {/* Botones */}
        <View className="flex-row justify-between mt-4 w-full">
          <Button
            action="primary"
            size="lg"
            className="flex-1 mr-2 rounded-full bg-green-600"
            onPress={handleUpdate}
            disabled={loading}
          >
            <ButtonText className="font-semibold text-white text-base">
              {loading ? "Actualizando..." : "Actualizar"}
            </ButtonText>
          </Button>

          <Button
            action="negative"
            size="lg"
            className="flex-1 ml-2 rounded-full bg-red-600"
            onPress={handleCancel}
            disabled={loading}
          >
            <ButtonText className="font-semibold text-white text-base">
              Cancelar
            </ButtonText>
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
