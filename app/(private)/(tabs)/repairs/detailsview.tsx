import { RepairsRepository } from "@/shared/repositories/repairs.repository";
import { Repair, RepairPiece } from "@/shared/types/repair.type";
import { useRoute } from "@react-navigation/native"; // Para obtener el ID desde la ruta
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, View } from "react-native";

export default function DetallesEquipoView() {
  const route = useRoute();
  const { repairId } = route.params as { repairId: string };

  const [repair, setRepair] = useState<Repair | null>(null);
  const [pieces, setPieces] = useState<RepairPiece[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRepairData = async () => {
      try {
        // Obtener datos principales de la reparación
        // Obtener datos principales de la reparación (ya incluye las piezas)
        const repairData = await RepairsRepository.getById(repairId);
        if (!repairData) return;

        setRepair(repairData);
        setPieces(repairData.pieces || []); // ahora se toman directamente del objeto
      } catch (error) {
        console.error("Error al cargar los datos de la reparación:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRepairData();
  }, [repairId]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#2F855A" />
        <Text className="mt-3 text-typography-700">Cargando datos...</Text>
      </View>
    );
  }

  if (!repair) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-typography-900 text-lg">
          No se encontró la reparación.
        </Text>
      </View>
    );
  }

  const laborCost = 50;
  const partsCost =
    pieces?.reduce((acc, p) => acc + p.unitCost * p.quantity, 0) || 0;
  const totalCost = laborCost + partsCost;

  return (
    <ScrollView
      className="flex-1 bg-background-50 p-5"
      contentContainerStyle={{ paddingBottom: 120 }}
      style={{ backgroundColor: "#193456" }}
    >
      {/* ENCABEZADO */}
      <Text
        className="text-3xl font-bold text-center text-typography-900 mb-6"
        style={{ color: "white" }}
      >
        Detalles de la Reparación
      </Text>

      {/* DATOS DEL CLIENTE */}
      <View className="bg-background-100 border border-background-200 rounded-2xl p-5 mb-6">
        <Text className="text-xl font-bold text-typography-900 mb-3">
          Datos del Cliente
        </Text>
        <Text className="text-typography-900 mb-1">
          <Text className="font-semibold">Nombre: </Text>
          {repair.customerName || "No disponible"}
        </Text>
        <Text className="text-typography-900 mb-1">
          <Text className="font-semibold">Teléfono: </Text>
          {repair.customerPhone || "No disponible"}
        </Text>
        <Text className="text-typography-900">
          <Text className="font-semibold">Correo: </Text>
          {repair.customerEmail || "No disponible"}
        </Text>
      </View>

      {/* DATOS DEL EQUIPO */}
      <View className="bg-background-100 border border-background-200 rounded-2xl p-5 mb-6">
        <Text className="text-xl font-bold text-typography-900 mb-3">
          Datos del Equipo
        </Text>
        <Text className="text-typography-900 mb-1">
          <Text className="font-semibold">Modelo: </Text>
          {repair.deviceModel}
        </Text>
        <Text className="text-typography-900 mb-1">
          <Text className="font-semibold">IMEI / Serie: </Text>
          {repair.imei || "Sin registro"}
        </Text>
        <Text className="text-typography-900 mt-3">
          <Text className="font-semibold">Descripción: </Text>
          {repair.issueDescription}
        </Text>

        {/* Checklist */}
        {repair.checklist && Object.keys(repair.checklist).length > 0 ? (
          <View className="mt-3">
            <Text className="text-lg font-semibold text-typography-900 mb-2">
              Estado del equipo:
            </Text>
            {Object.entries(repair.checklist).map(([key, value]) => (
              <Text key={key} className="text-typography-900 text-sm">
                • {key} {" - "}
                {value ? "✓ " : "X"}
              </Text>
            ))}
          </View>
        ) : (
          <Text className="text-typography-900/70 italic mt-3">
            (Sin checklist registrado)
          </Text>
        )}
      </View>

      {/* FIRMA DE CONFORMIDAD */}
      <View className="bg-background-100 border border-background-200 rounded-2xl p-5 items-center mb-6">
        <Text className="text-xl font-bold text-typography-900 mb-3">
          Firma de conformidad del cliente
        </Text>
        <View className="w-full border border-background-200 rounded-xl bg-background-50 p-3 items-center">
          {repair.signature ? (
            <Image
              source={{ uri: `${repair.signature}` }}
              style={{ width: "100%", height: 120, resizeMode: "contain" }}
            />
          ) : (
            <Text className="text-typography-900/70 italic">
              (Sin firma registrada)
            </Text>
          )}
        </View>
        <Text className="text-xs text-typography-700 mt-3 text-justify">
          Green Monkey responsabiliza al cliente de la procedencia lícita del
          equipo. La garantía solo aplica en mano de obra y en piezas
          reemplazadas, cualquier falla adicional genera un costo extra. Golpes
          o manipulación indebida no tendrán garantía de ningún tipo. Estos
          equipos corren el riesgo de apagarse definitivamente. El cliente
          cuenta con 30 días para recoger su equipo. No nos hacemos responsables
          por SIM o accesorios olvidados.
        </Text>
      </View>

      {/* PIEZAS UTILIZADAS */}
      <View className="bg-background-100 border border-background-200 rounded-2xl p-5 mb-6">
        <Text className="text-xl font-bold text-typography-900 mb-3">
          Piezas Utilizadas
        </Text>

        {pieces.length > 0 ? (
          pieces.map((p) => (
            <View
              key={p.id}
              className="flex-row justify-between bg-background-50 border border-background-200 rounded-xl p-3 mb-2"
            >
              <View>
                <Text className="text-typography-900 font-semibold">
                  {p.name}
                </Text>
                <Text className="text-typography-900 text-sm">
                  Cantidad: {p.quantity}
                </Text>
              </View>
              <Text className="text-primary-600 font-bold">
                ${p.unitCost.toFixed(2)}
              </Text>
            </View>
          ))
        ) : (
          <Text className="text-typography-900/70 italic">
            (Sin piezas registradas)
          </Text>
        )}
      </View>

      {/* COSTOS */}
      <View className="bg-background-100 border border-background-200 rounded-2xl p-5 mb-6">
        <Text className="text-xl font-bold text-typography-900 mb-3">
          Costos de la Reparación
        </Text>
        <View className="flex-row justify-between mb-2">
          <Text className="text-typography-900 font-semibold">
            Mano de obra
          </Text>
          <Text className="text-primary-600 font-bold">${50}</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-typography-900 font-semibold">Piezas</Text>
          <Text className="text-primary-600 font-bold">
            ${partsCost.toFixed(2)}
          </Text>
        </View>
        <View className="flex-row justify-between border-t border-background-200 pt-2">
          <Text className="text-typography-900 font-bold">Total</Text>
          <Text className="text-primary-600 font-bold">
            ${totalCost.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* NOTAS */}
      <View className="bg-background-100 border border-background-200 rounded-2xl p-5 mb-6">
        <Text className="text-xl font-bold text-typography-900 mb-3">
          Notas
        </Text>
        {repair.notes ? (
          <Text className="text-typography-900">{repair.notes}</Text>
        ) : (
          <Text className="text-typography-900/70 italic">
            (Sin notas registradas)
          </Text>
        )}
      </View>

      {/* FIRMA EQUIPO ENTREGADO */}
      <View className="bg-background-100 border border-background-200 rounded-2xl p-5 items-center mb-6">
        <Text className="text-xl font-bold text-typography-900 mb-3">
          Firma de equipo entregado
        </Text>
        <View className="w-full border border-background-200 rounded-xl bg-background-50 p-3 items-center">
          {repair.deliverySignature ? (
            <Image
              source={{ uri: `${repair.deliverySignature}` }}
              style={{ width: "100%", height: 120, resizeMode: "contain" }}
            />
          ) : (
            <Text className="text-typography-900/70 italic">
              (El equipo aún no ha sido firmado como entregado)
            </Text>
          )}
        </View>
        <Text className="text-xs text-typography-700 mt-3 text-justify">
          Recibí el equipo en óptimas condiciones.
        </Text>
      </View>
    </ScrollView>
  );
}
