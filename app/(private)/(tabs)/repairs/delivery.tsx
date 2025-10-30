import { Button, ButtonText } from "@/shared/components/ui/button";
import { RepairsRepository } from "@/shared/repositories/repairs.repository";
import { Repair } from "@/shared/types/repair.type";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Image, ScrollView, Text, TextInput, View } from "react-native";
import Signature from "react-native-signature-canvas";

export default function EntregarEquipo() {
  const { repairId } = useLocalSearchParams<{ repairId: string }>();
  const [folio, setFolio] = useState("");
  const [firma, setFirma] = useState<string | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  const [repair, setRepair] = useState<Repair | null>(null);
  const [dbFolio, setDbFolio] = useState<string | null>(null);

  const signatureRef = useRef<any>(null);
  const router = useRouter();

  // Cargar la reparación (para obtener el folio de DB)
  useEffect(() => {
    const load = async () => {
      if (!repairId) return;
      try {
        const r = await RepairsRepository.getById(repairId);
        setRepair(r);
        setDbFolio(r?.folio ?? null);
      } catch (e) {
        console.error("Error cargando reparación:", e);
        Alert.alert("Error", "No se pudo cargar la reparación.");
      }
    };
    load();
  }, [repairId]);

  const handleOK = (signature: string) => {
    setFirma(signature); // base64
    setScrollEnabled(true);
  };

  const handleClear = () => {
    setFirma(null);
    signatureRef.current?.clearSignature?.();
  };

  const handleEntregar = async () => {
    if (!repairId) {
      Alert.alert("Error", "No se encontró el ID de la reparación.");
      return;
    }
    if (!folio.trim()) {
      Alert.alert("Folio requerido", "Por favor, ingresa el número de folio.");
      return;
    }
    if (!firma) {
      Alert.alert(
        "Firma requerida",
        "El cliente debe firmar antes de continuar."
      );
      return;
    }
    // Validar folio con DB
    if (!dbFolio) {
      Alert.alert(
        "Error",
        "La reparación no tiene folio registrado en el sistema."
      );
      return;
    }
    const inputFolio = folio.trim();
    const storedFolio = String(dbFolio).trim();

    if (inputFolio !== storedFolio) {
      Alert.alert(
        "Folio inválido",
        "El folio ingresado no coincide con el registrado."
      );
      return;
    }

    try {
      setLoading(true);

      await RepairsRepository.update(repairId, {
        deliverySignature: firma,
        status: "delivered",
        deliveryDate: new Date(),
      });

      Alert.alert(
        "Entrega confirmada",
        "El equipo ha sido entregado correctamente.",
        [{ text: "OK", onPress: () => router.push("/(private)/(tabs)") }]
      );
    } catch (e) {
      console.error("Error al entregar:", e);
      Alert.alert("Error", "No se pudo completar la entrega.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancelar",
      "¿Deseas cancelar la entrega? Se borrarán el folio y la firma.",
      [
        { text: "No" },
        {
          text: "Sí",
          onPress: () => {
            // 🔹 limpia folio y firma en memoria
            setFolio("");
            setFirma(null);
            // 🔹 limpia el canvas de la firma
            signatureRef.current?.clearSignature?.();
            // 🔹 regresa al inicio
            router.push("/(private)/(tabs)");
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      className="flex-1 bg-background-50 p-6"
      scrollEnabled={scrollEnabled}
      contentContainerStyle={{ paddingBottom: 120 }}
      style={{ backgroundColor: "#193456" }}
    >
      {/* Encabezado */}
      <View className="items-center mb-6 mt-2">
        <Text className="text-2xl font-bold text-typography-900 mb-3  text-white">
          Entregar Equipo
        </Text>
        <Image
          source={require("@/assets/images/delivery-img.png")}
          style={{ width: 100, height: 100, marginBottom: 8 }}
        />
        <Text className="text-center  text-white text-typography-900 opacity-70">
          Ingresa el folio para la entrega del equipo reparado
        </Text>
        {!!repairId && (
          <Text className="text-xs text-white opacity-70 mt-2">
            ID Reparación: {repairId}
          </Text>
        )}
      </View>

      {/* Campo de Folio */}
      <View className="bg-background-100 p-5 rounded-2xl shadow-md border border-background-200 mb-6">
        <Text className="text-typography-900 mb-2 font-semibold">
          Número de folio
        </Text>
        <TextInput
          placeholder="Ej: REP-2025-001"
          placeholderTextColor="#9CA3AF"
          value={folio}
          onChangeText={setFolio}
          className="border border-background-200 rounded-xl p-4 bg-background-50 text-typography-900"
          autoCapitalize="characters"
        />
        {!!dbFolio && (
          <Text className="text-xs text-typography-900 opacity-60 mt-2">
            (Referencia del sistema: {dbFolio})
          </Text>
        )}
      </View>

      {/* Firma */}
      <View className="bg-[#EDFFFD] p-6 rounded-2xl shadow-lg mb-6 border border-[#FFB74D]/30">
        <Text className="text-xl font-bold mb-4 text-[#193456]">
          Firma del Cliente
        </Text>

        <View
          style={{
            height: 330,
            borderWidth: 2,
            borderColor: "#FFB74D",
            borderRadius: 12,
            backgroundColor: "#fff",
          }}
        >
          <Signature
            ref={signatureRef}
            onOK={handleOK}
            onBegin={() => setScrollEnabled(false)}
            onEnd={() => setScrollEnabled(true)}
            descriptionText="Firme aquí"
            clearText="Borrar"
            confirmText="Guardar"
            webStyle={`
              .m-signature-pad { border: none; background-color: #fff; height: 160px; }
              .m-signature-pad--footer { display: flex; justify-content: space-between; align-items: center; height: 40px; background-color: #fff; }
              .m-signature-pad--description { display: none; }
              .m-signature-pad--footer .button.clear { background-color: #E5E7EB; color: #374151; }
              .m-signature-pad--footer .button.save { background-color: #FFB74D; color: #fff; }
            `}
          />
        </View>

        {firma && (
          <View className="flex-row items-center mt-4 p-3 bg-green-100 rounded-xl border border-green-300">
            <Text className="text-green-800 font-semibold">
              ✓ Firma guardada correctamente
            </Text>
          </View>
        )}
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
        <Button
          action="secondary"
          size="sm"
          className="flex-1 mx-1 bg-gray-500"
          style={{ backgroundColor: "#FFB74D" }}
          onPress={handleEntregar}
          disabled={loading}
        >
          <ButtonText className="text-white font-semibold">
            {loading ? "Entregando..." : "Entregar"}
          </ButtonText>
        </Button>

        <Button
          action="secondary"
          size="sm"
          className="flex-1 mx-1 bg-gray-500"
          onPress={handleCancel}
          disabled={loading}
        >
          <ButtonText className="text-white font-semibold">Cancelar</ButtonText>
        </Button>
      </View>
    </ScrollView>
  );
}
