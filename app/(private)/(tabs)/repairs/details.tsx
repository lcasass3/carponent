import { Button, ButtonText } from "@/shared/components/ui/button";
import { InventoryRepository } from "@/shared/repositories/inventory.repository";
import { RepairsRepository } from "@/shared/repositories/repairs.repository";
import { InventoryItem } from "@/shared/types/inventory.type";
import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";

import { Picker } from "@react-native-picker/picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Part {
  id: string;
  name: string;
  cost: number;
  quantity: number;
  inventoryId?: string;
}

interface DetailsProps {
  repairId: string;
}

const Details: React.FC = () => {
  const { repairId } = useLocalSearchParams<{ repairId: string }>();
  console.log("Repair ID recibido desde la ruta:", repairId);

  const [parts, setParts] = useState<Part[]>([]);
  const [notes, setNotes] = useState("");
  // ... resto de tu código

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newPartName, setNewPartName] = useState("");
  const [newPartCost, setNewPartCost] = useState("");
  const [newPartQuantity, setNewPartQuantity] = useState("1");

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedPart, setSelectedPart] = useState<InventoryItem | null>(null);
  const handleAddPartFromInventory = () => {
    if (!selectedPart) return;

    const existingPart = parts.find((p) => p.inventoryId === selectedPart.id);

    if (existingPart) {
      // Si ya existe, solo aumentar cantidad en la interfaz (no en DB todavía)
      const updatedParts = parts.map((p) =>
        p.inventoryId === selectedPart.id
          ? { ...p, quantity: p.quantity + parseInt(newPartQuantity) }
          : p
      );
      setParts(updatedParts);
    } else {
      // Si no existe, agregar normalmente
      const partToAdd = {
        id: Date.now().toString(),
        name: selectedPart.name,
        cost: selectedPart.unitCost,
        quantity: parseInt(newPartQuantity),
        inventoryId: selectedPart.id,
      };
      setParts([...parts, partToAdd]);
    }

    // Limpiar modal
    setIsModalVisible(false);
    setSelectedPart(null);
    setSelectedCategory("");
    setNewPartQuantity("1");
  };

  //Cargar inventario
  useEffect(() => {
    fetchInventory();
  }, []);
  useEffect(() => {
    if (repairId) {
      setNotes("");
      loadExistingData();
    }
  }, [repairId]);
  const loadExistingData = async () => {
    try {
      // Obtener la reparación completa
      const repair = await RepairsRepository.getById(repairId);

      // Siempre asignar notes; si no existe, será ""
      setNotes(repair?.notes || "");

      // Obtener las piezas
      const existingPieces = await RepairsRepository.getPieces(repairId);
      setParts(
        existingPieces.map((p: any) => ({
          id: p.id,
          name: p.name,
          cost: p.unitCost,
          quantity: p.quantity,
          inventoryId: p.inventoryId,
        }))
      );
    } catch (error) {
      console.error("Error cargando datos existentes:", error);
    }
  };

  const fetchInventory = async () => {
    try {
      const items = await InventoryRepository.getAll();
      setInventoryItems(items);
    } catch (error) {
      console.error("Error al obtener inventario:", error);
    }
  };

  //Recargar el modal cada vez que se abra
  const openModal = async () => {
    await fetchInventory();
    setIsModalVisible(true);
  };

  //Categorias de piezas
  const filteredParts = inventoryItems.filter(
    (item) => item.category?.name === selectedCategory
  );

  const laborCost = 50;
  const partsCost = parts.reduce((acc, p) => acc + p.cost * p.quantity, 0);
  const totalCost = laborCost + partsCost;
  const handleCancel = () => {
    Alert.alert("Cancelar", "¿Estás seguro de que quieres cancelar?", [
      { text: "No" },
      {
        text: "Sí",
        onPress: () => {
          console.log("Detalles nuevos cancelados");
          router.push("/(private)/(tabs)");
        },
      },
    ]);
  };

  const addPart = () => {
    if (!selectedPart) return;

    const newPart: Part = {
      id: Date.now().toString(),
      name: selectedPart.name,
      cost: selectedPart.unitCost,
      quantity: parseInt(newPartQuantity),
      inventoryId: selectedPart.id,
    };

    setParts([...parts, newPart]);
    setSelectedPart(null);
    setSelectedCategory("");
    setNewPartQuantity("1");
    setIsModalVisible(false);
  };
  const removePart = async (id: string) => {
    try {
      const partToRemove = parts.find((p) => p.id === id);

      if (!partToRemove) return;

      // Si existe en Firestore, eliminarla también
      if (repairId && partToRemove.inventoryId) {
        // Buscar si la pieza existe en Firestore
        const existingPiece = await RepairsRepository.findPieceByInventoryId(
          repairId,
          partToRemove.inventoryId
        );

        if (existingPiece) {
          await RepairsRepository.deletePiece(repairId, existingPiece.id);
        }
      }

      // Eliminar de la interfaz local
      setParts((prevParts) => prevParts.filter((p) => p.id !== id));

      Alert.alert("Eliminado", "La pieza fue eliminada correctamente.");
    } catch (error) {
      console.error("Error al eliminar pieza:", error);
      Alert.alert("Error", "No se pudo eliminar la pieza.");
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setParts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, quantity: Math.max(1, p.quantity + delta) } : p
      )
    );
  };
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const handleUpdate = async () => {
    if (!notes.trim()) {
      Alert.alert(
        "Campo obligatorio",
        "Debes llenar el campo de notas antes de enviar."
      );
      return;
    }
    try {
      await RepairsRepository.updateNotes(repairId, notes);

      // Guardar piezas (tu lógica actual)
      for (const part of parts) {
        if (!part.inventoryId) continue;
        const existingPiece = await RepairsRepository.findPieceByInventoryId(
          repairId,
          part.inventoryId
        );
        if (existingPiece) {
          if (existingPiece.quantity !== part.quantity) {
            await RepairsRepository.updatePieceQuantity(
              repairId,
              existingPiece.id,
              part.quantity
            );
          }
        } else {
          await RepairsRepository.addPieceToRepair(repairId, {
            name: part.name,
            quantity: part.quantity,
            unitCost: part.cost,
            inventoryId: part.inventoryId,
          });
        }
      }

      // Persistir el Total en estimatedCost
      const estimated = Number(totalCost.toFixed(2));
      await RepairsRepository.update(repairId, { estimatedCost: estimated });

      Alert.alert("Éxito", "El reporte se actualizó correctamente");
      router.push("/(private)/(tabs)");
    } catch (error) {
      console.error("Error al actualizar la reparación:", error);
      Alert.alert("Error", "No se pudo guardar el reporte");
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-background-50 p-5"
      style={{ backgroundColor: "#193456" }}
      scrollEnabled={scrollEnabled}
      contentContainerStyle={{ paddingBottom: 300 }}
    >
      <View
        className=" bg-background-50 rounded-2xl p-5 border border  shadow-sm border-4"
        style={{ marginTop: 40 }}
      >
        <Text className="text-2xl font-bold text-center text-typography-900 mb-5">
          Detalles
        </Text>

        {/* PIEZAS UTILIZADAS */}
        <View className="mb-5">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold text-typography-900">
              Piezas utilizadas
            </Text>
            <TouchableOpacity
              onPress={openModal}
              className="flex-row items-center"
            >
              <AntDesign name="plus" size={20} color="#51bb54ff" />
              <Text className=" text-primary-600 font-semibold ml-1">
                Añadir
              </Text>
            </TouchableOpacity>
          </View>

          {parts.map((p) => (
            <View
              key={p.id}
              className="bg-background-100 border border-background-200  rounded-xl p-3 mb-3 flex-row justify-between items-center"
            >
              <View className="flex-1">
                <Text className="text-typography-900 font-semibold text-base">
                  {p.name}
                </Text>
                <Text className="text-typography-900 text-sm">
                  Cantidad: {p.quantity}
                </Text>

                <View className="flex-row mt-2  text-primary-600">
                  <TouchableOpacity
                    onPress={() => updateQuantity(p.id, -1)}
                    disabled={p.quantity <= 1}
                    className={`px-2 ${p.quantity <= 1 ? "opacity-50" : ""}`}
                  >
                    <AntDesign name="minus" size={18} color="#4CAF50" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => updateQuantity(p.id, 1)}
                    className="px-2"
                  >
                    <AntDesign name="plus" size={18} color="#4CAF50" />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="items-end">
                <Text className=" text-primary-600 font-bold">
                  ${p.cost.toFixed(2)}
                </Text>
                <TouchableOpacity
                  onPress={() => removePart(p.id)}
                  className="mt-1"
                >
                  <Feather name="trash-2" size={18} color="#E57373" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* COSTO DE LA REPARACION */}
        <View className="mb-5 ">
          <Text className="text-lg font-bold text-typography-900 mb-3 ">
            Costo de Reparación
          </Text>

          {[
            { label: "Mano de obra", value: laborCost },
            { label: "Costo de piezas", value: partsCost },
            { label: "Total", value: totalCost },
          ].map((item, idx) => (
            <View
              key={idx}
              className="bg-background-100 border border-background-200 rounded-lg p-3 mb-2 flex-row justify-between items-center"
            >
              <Text className="text-typography-900 font-semibold">
                {item.label}
              </Text>
              <Text className=" text-primary-600 font-bold">
                ${item.value.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* NOTAS para el equipo */}
        <View className="mb-5">
          <Text className="text-lg font-bold text-typography-900 mb-2">
            Notas
          </Text>
          <TextInput
            multiline
            placeholder="Agregar notas sobre la reparación del equipo"
            value={notes}
            onChangeText={setNotes}
            className="border border-background-200 rounded-xl bg-background-100 p-3 text-typography-900 min-h-[100px]"
          />
        </View>

        {/* BOTONES */}
        {/* BOTONES */}
        <View className="flex-row justify-between mt-4">
          {/* Botón para Actualizar */}
          <Button
            action="primary"
            size="lg"
            className="flex-1 mr-2 rounded-full"
            onPress={handleUpdate}
          >
            <ButtonText className="font-semibold text-white text-base">
              Actualizar
            </ButtonText>
          </Button>

          {/* Botón Cancelar */}
          <Button
            action="negative"
            size="lg"
            className="flex-1 ml-2 rounded-full"
            onPress={handleCancel}
          >
            <ButtonText className="font-semibold text-white text-base ">
              Cancelar
            </ButtonText>
          </Button>
        </View>
      </View>
      {/* MODAL PARA AGREGAR PIEZA */}
      <Modal
        transparent={true}
        visible={isModalVisible}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/60 p-5">
          <View className="bg-background-200 w-full max-w-[400px] rounded-2xl p-5 border border-background-400">
            <Text className="text-lg font-bold mb-4 text-typography-900 text-center">
              Agregar Pieza del Inventario
            </Text>

            {/* Selector de categoría */}
            <Text className="text-typography-900 font-medium mb-1">
              Categoría:
            </Text>
            <Picker
              selectedValue={selectedCategory}
              onValueChange={(value) => {
                setSelectedCategory(value);
                setSelectedPart(null);
              }}
            >
              <Picker.Item label="Selecciona una categoría..." value="" />
              {[
                ...new Set(
                  inventoryItems
                    .map((item) => item.category?.name)
                    .filter(Boolean)
                ),
              ].map((categoryName) => (
                <Picker.Item
                  key={categoryName!}
                  label={categoryName!}
                  value={categoryName!}
                />
              ))}
            </Picker>

            {/* Selector de pieza */}
            {selectedCategory !== "" && (
              <>
                <Text className="text-typography-900 font-medium mt-3 mb-1">
                  Pieza:
                </Text>
                <Picker
                  selectedValue={selectedPart?.id || ""}
                  onValueChange={(value) => {
                    const part = inventoryItems.find(
                      (item) => item.id === value
                    );
                    setSelectedPart(part || null);
                  }}
                >
                  <Picker.Item label="Selecciona una pieza..." value="" />
                  {inventoryItems
                    .filter((item) => item.category?.name === selectedCategory)
                    .map((item) => (
                      <Picker.Item
                        key={item.id}
                        label={`${item.name} - $${item.unitCost}`}
                        value={item.id}
                      />
                    ))}
                </Picker>
              </>
            )}

            {/* Cantidad */}
            <Text className="text-typography-900 font-medium mt-3 mb-1">
              Cantidad:
            </Text>
            <TextInput
              placeholder="Cantidad"
              value={newPartQuantity}
              onChangeText={setNewPartQuantity}
              keyboardType="numeric"
              className="border border-background-400 rounded-xl p-3 mb-3 text-typography-900"
            />

            {/* Botones */}
            <View className="flex-row justify-between mt-3">
              <TouchableOpacity
                onPress={handleAddPartFromInventory}
                disabled={!selectedPart || !newPartQuantity}
                className={`py-2 px-6 rounded-full ${
                  !selectedPart ? "bg-gray-400" : "bg-[#4CAF50]"
                }`}
              >
                <Text className="text-white font-bold">Agregar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                className="bg-[#E57373] py-2 px-6 rounded-full"
              >
                <Text className="text-white font-bold">Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default Details;
