import {
  AlertText,
  Alert as GluestackAlert,
} from "@/shared/components/ui/alert";
import { Button, ButtonText } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { InventoryRepository } from "@/shared/repositories/inventory.repository";
import { RepairsRepository } from "@/shared/repositories/repairs.repository";
import { InventoryItem } from "@/shared/types/inventory.type";
import { Repair, RepairPiece } from "@/shared/types/repair.type";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Alert as RNAlert,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const getStatusText = (status: Repair["status"]) => {
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

const getStatusBadgeStyle = (status: Repair["status"]) => {
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

const getStatusTextStyle = (status: Repair["status"]) => {
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

const Details: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [repair, setRepair] = useState<Repair | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [pieces, setPieces] = useState<RepairPiece[]>([]);
  const [noteText, setNoteText] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>("");
  const [customPieceName, setCustomPieceName] = useState("");
  const [customPieceCost, setCustomPieceCost] = useState("");
  const [pieceQuantity, setPieceQuantity] = useState("1");
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: "success" | "error";
    message: string;
  }>({
    visible: false,
    type: "success",
    message: "",
  });

  const partsCost = pieces.reduce((acc, p) => acc + p.unitCost * p.quantity, 0);
  const totalCost = (repair?.estimatedCost || 0) + partsCost;

  useEffect(() => {
    if (id) {
      loadData();
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

  const loadData = async () => {
    try {
      setLoading(true);
      const [repairData, inventory] = await Promise.all([
        RepairsRepository.getById(id as string),
        InventoryRepository.getAll(),
      ]);

      if (repairData) {
        setRepair(repairData);
        setPieces(repairData.pieces);
      } else {
        setAlertConfig({
          visible: true,
          type: "error",
          message: "No se encontró la reparación",
        });
        setTimeout(() => router.back(), 2000);
      }

      // Filter only available inventory items
      setInventoryItems(inventory.filter((item) => item.state === "available"));
    } catch (error) {
      console.error("Error loading data:", error);
      setAlertConfig({
        visible: true,
        type: "error",
        message: "Error al cargar los datos",
      });
    } finally {
      setLoading(false);
    }
  };

  const addPiece = () => {
    // Validate input
    if (selectedInventoryId === "" && customPieceName.trim() === "") {
      setAlertConfig({
        visible: true,
        type: "error",
        message: "Selecciona una pieza del inventario o ingresa un nombre",
      });
      return;
    }

    if (selectedInventoryId === "" && !customPieceCost) {
      setAlertConfig({
        visible: true,
        type: "error",
        message: "Ingresa el costo de la pieza",
      });
      return;
    }

    const quantity = parseInt(pieceQuantity);
    if (isNaN(quantity) || quantity < 1) {
      setAlertConfig({
        visible: true,
        type: "error",
        message: "La cantidad debe ser mayor a 0",
      });
      return;
    }

    let newPiece: RepairPiece;

    if (selectedInventoryId) {
      // Adding from inventory
      const inventoryItem = inventoryItems.find(
        (item) => item.id === selectedInventoryId
      );
      if (!inventoryItem) return;

      newPiece = {
        id: Date.now().toString(),
        inventoryId: inventoryItem.id,
        name: inventoryItem.name,
        quantity,
        unitCost: inventoryItem.unitCost,
        addedAt: new Date(),
      };
    } else {
      // Adding custom piece
      newPiece = {
        id: Date.now().toString(),
        inventoryId: null,
        name: customPieceName.trim(),
        quantity,
        unitCost: parseFloat(customPieceCost),
        addedAt: new Date(),
      };
    }

    setPieces([...pieces, newPiece]);

    // Reset form
    setSelectedInventoryId("");
    setCustomPieceName("");
    setCustomPieceCost("");
    setPieceQuantity("1");
    setIsModalVisible(false);

    setAlertConfig({
      visible: true,
      type: "success",
      message: "Pieza añadida correctamente",
    });
  };

  const removePiece = (pieceId: string) => {
    RNAlert.alert(
      "Eliminar pieza",
      "¿Estás seguro de que deseas eliminar esta pieza?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            setPieces(pieces.filter((p) => p.id !== pieceId));
            setAlertConfig({
              visible: true,
              type: "success",
              message: "Pieza eliminada",
            });
          },
        },
      ]
    );
  };

  const updateQuantity = (pieceId: string, delta: number) => {
    setPieces((prev) =>
      prev.map((p) =>
        p.id === pieceId
          ? { ...p, quantity: Math.max(1, p.quantity + delta) }
          : p
      )
    );
  };

  const handleUpdate = async () => {
    if (!repair) return;

    RNAlert.alert(
      "Confirmar actualización",
      "¿Deseas guardar los cambios realizados?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Guardar",
          onPress: async () => {
            try {
              setUpdating(true);

              // Prepare updates
              const updates: Partial<Omit<Repair, "id">> = {
                pieces,
                finalCost: totalCost,
              };

              // Add note if provided
              if (noteText.trim()) {
                await RepairsRepository.addNote(repair.id, {
                  authorId: repair.assignedTo, // Using assignedTo as author
                  text: noteText.trim(),
                });
                setNoteText("");
              }

              // Update repair
              await RepairsRepository.update(repair.id, updates);

              setAlertConfig({
                visible: true,
                type: "success",
                message: "Reparación actualizada exitosamente",
              });

              // Reload data to show updated info
              setTimeout(() => {
                loadData();
              }, 1000);
            } catch (error) {
              console.error("Error updating repair:", error);
              setAlertConfig({
                visible: true,
                type: "error",
                message: "Error al actualizar la reparación",
              });
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    RNAlert.alert(
      "Cancelar cambios",
      "¿Deseas descartar los cambios realizados?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, descartar",
          style: "destructive",
          onPress: () => router.back(),
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background-50 justify-center items-center">
        <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
        <ActivityIndicator size="large" color="#FFB74D" />
        <Text className="mt-4 text-typography-900">Cargando...</Text>
      </View>
    );
  }

  if (!repair) {
    return (
      <View className="flex-1 bg-background-50 justify-center items-center p-5">
        <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text className="text-xl font-bold text-typography-900 mt-4">
          Reparación no encontrada
        </Text>
        <Button
          action="primary"
          size="lg"
          className="mt-6"
          onPress={() => router.back()}
        >
          <ButtonText>Volver</ButtonText>
        </Button>
      </View>
    );
  }
  return (
    <View className="flex-1 bg-background-50">
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      {/* Alert Notification */}
      {alertConfig.visible && (
        <View className="absolute top-0 left-0 right-0 z-50 px-4 pt-2">
          <GluestackAlert
            action={alertConfig.type}
            className="rounded-lg border-l-4"
          >
            <View className="flex-row items-center justify-between flex-1">
              <View className="flex-row items-center flex-1">
                <Ionicons
                  name={
                    alertConfig.type === "success"
                      ? "checkmark-circle"
                      : "alert-circle"
                  }
                  size={24}
                  color={alertConfig.type === "success" ? "#10B981" : "#EF4444"}
                  style={{ marginRight: 12 }}
                />
                <AlertText className="flex-1">{alertConfig.message}</AlertText>
              </View>
              <TouchableOpacity
                onPress={() =>
                  setAlertConfig((prev) => ({ ...prev, visible: false }))
                }
                className="ml-2"
              >
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </GluestackAlert>
        </View>
      )}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header */}
        <View className="bg-background-50 px-5 pt-3 pb-4 border-b border-background-200">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-3 p-2"
            >
              <Ionicons name="arrow-back" size={24} color="#FFB74D" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-xl font-bold text-typography-900">
                Editar Reparación
              </Text>
              {repair.folio && (
                <Text className="text-sm text-typography-600">
                  Folio: {repair.folio}
                </Text>
              )}
            </View>
            <View
              className={`px-3 py-1 rounded-full border ${getStatusBadgeStyle(
                repair.status
              )}`}
            >
              <Text
                className={`text-xs font-semibold ${getStatusTextStyle(
                  repair.status
                )}`}
              >
                {getStatusText(repair.status)}
              </Text>
            </View>
          </View>
        </View>

        <View className="p-5">
          {/* Client Info */}
          <Card className="bg-background-0 rounded-xl p-4 mb-4">
            <View className="flex-row items-center mb-3">
              <Ionicons
                name="person-outline"
                size={20}
                color="#FFB74D"
                style={{ marginRight: 8 }}
              />
              <Text className="text-base font-semibold text-typography-900">
                {repair.customerName}
              </Text>
            </View>
            <Text className="text-sm text-typography-600 mb-1">
              {repair.deviceModel}
            </Text>
          </Card>

          {/* PIEZAS UTILIZADAS */}
          <View className="mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center">
                <Ionicons
                  name="construct-outline"
                  size={20}
                  color="#FFB74D"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-lg font-bold text-typography-900">
                  Piezas Utilizadas
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsModalVisible(true)}
                className="flex-row items-center bg-primary-500 px-3 py-2 rounded-lg"
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text className="text-white font-semibold ml-1">Añadir</Text>
              </TouchableOpacity>
            </View>

            {pieces.length === 0 ? (
              <Card className="bg-background-50 rounded-xl p-4 items-center">
                <Ionicons
                  name="cube-outline"
                  size={32}
                  color="#9CA3AF"
                  style={{ marginBottom: 8 }}
                />
                <Text className="text-typography-500">
                  No se han añadido piezas
                </Text>
              </Card>
            ) : (
              pieces.map((p) => (
                <Card
                  key={p.id}
                  className="bg-background-0 border border-background-200 rounded-xl p-4 mb-3"
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="text-typography-900 font-semibold text-base mb-1">
                        {p.name}
                      </Text>
                      {p.inventoryId && (
                        <Text className="text-xs text-typography-500 mb-2">
                          Del inventario
                        </Text>
                      )}
                      <Text className="text-sm text-typography-600">
                        Cantidad: {p.quantity}
                      </Text>
                      <Text className="text-sm font-semibold text-primary-500 mt-1">
                        ${p.unitCost.toFixed(2)} c/u
                      </Text>

                      <View className="flex-row mt-3 items-center">
                        <TouchableOpacity
                          onPress={() => updateQuantity(p.id, -1)}
                          className="bg-background-100 p-2 rounded-lg"
                        >
                          <Ionicons name="remove" size={18} color="#FFB74D" />
                        </TouchableOpacity>
                        <Text className="mx-4 font-bold text-typography-900">
                          {p.quantity}
                        </Text>
                        <TouchableOpacity
                          onPress={() => updateQuantity(p.id, 1)}
                          className="bg-background-100 p-2 rounded-lg"
                        >
                          <Ionicons name="add" size={18} color="#FFB74D" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View className="items-end ml-4">
                      <Text className="text-lg font-bold text-primary-500">
                        ${(p.unitCost * p.quantity).toFixed(2)}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removePiece(p.id)}
                        className="mt-3 bg-error-50 p-2 rounded-lg"
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color="#EF4444"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              ))
            )}
          </View>

          {/* COSTO DE LA REPARACION */}
          <Card className="bg-background-0 rounded-xl p-4 mb-4">
            <View className="flex-row items-center mb-3">
              <Ionicons
                name="cash-outline"
                size={20}
                color="#FFB74D"
                style={{ marginRight: 8 }}
              />
              <Text className="text-lg font-bold text-typography-900">
                Costos
              </Text>
            </View>

            <View className="space-y-2">
              <View className="flex-row justify-between py-2 border-b border-background-200">
                <Text className="text-typography-900">Costo estimado</Text>
                <Text className="font-semibold text-typography-900">
                  ${repair.estimatedCost.toFixed(2)}
                </Text>
              </View>

              <View className="flex-row justify-between py-2 border-b border-background-200">
                <Text className="text-typography-900">Costo de piezas</Text>
                <Text className="font-semibold text-primary-500">
                  ${partsCost.toFixed(2)}
                </Text>
              </View>

              <View className="flex-row justify-between py-3 bg-primary-50 rounded-lg px-3 mt-2">
                <Text className="text-lg font-bold text-typography-900">
                  Total
                </Text>
                <Text className="text-lg font-bold text-primary-500">
                  ${totalCost.toFixed(2)}
                </Text>
              </View>
            </View>
          </Card>

          {/* NOTAS */}
          <Card className="bg-background-0 rounded-xl p-4 mb-4">
            <View className="flex-row items-center mb-3">
              <Ionicons
                name="document-text-outline"
                size={20}
                color="#FFB74D"
                style={{ marginRight: 8 }}
              />
              <Text className="text-lg font-bold text-typography-900">
                Añadir Nota
              </Text>
            </View>
            <TextInput
              multiline
              placeholder="Escribe una nota sobre la reparación..."
              placeholderTextColor="#9CA3AF"
              value={noteText}
              onChangeText={setNoteText}
              className="border border-background-200 rounded-xl bg-background-50 p-3 text-typography-900 min-h-[100px]"
              style={{ textAlignVertical: "top" }}
            />
          </Card>

          {/* Existing Notes */}
          {repair.notes.length > 0 && (
            <Card className="bg-background-0 rounded-xl p-4 mb-4">
              <View className="flex-row items-center mb-3">
                <Ionicons
                  name="chatbox-ellipses-outline"
                  size={20}
                  color="#FFB74D"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-lg font-bold text-typography-900">
                  Notas Anteriores ({repair.notes.length})
                </Text>
              </View>
              {repair.notes.map((note) => (
                <View
                  key={note.id}
                  className="bg-background-50 rounded-lg p-3 mb-2"
                >
                  <Text className="text-xs text-typography-500 mb-1">
                    {note.createdAt.toLocaleDateString("es-MX", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  <Text className="text-typography-900">{note.text}</Text>
                </View>
              ))}
            </Card>
          )}

          {/* BOTONES */}
          <View className="flex-row justify-between mt-4">
            <Button
              action="primary"
              size="lg"
              className="flex-1 mr-2"
              onPress={handleUpdate}
              isDisabled={updating}
            >
              <ButtonText className="font-semibold">
                {updating ? "Guardando..." : "Guardar Cambios"}
              </ButtonText>
            </Button>

            <Button
              action="negative"
              size="lg"
              className="flex-1 ml-2"
              onPress={handleCancel}
              isDisabled={updating}
            >
              <ButtonText className="font-semibold">Cancelar</ButtonText>
            </Button>
          </View>
        </View>
      </ScrollView>

      {/* MODAL PARA AGREGAR PIEZA */}
      <Modal
        transparent={true}
        visible={isModalVisible}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-background-0 rounded-t-3xl p-6 max-h-[80%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-typography-900">
                Añadir Pieza
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={28} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {/* Select from Inventory */}
              <Text className="text-sm font-semibold text-typography-900 mb-2">
                Seleccionar del Inventario
              </Text>
              <View className="border border-background-200 rounded-xl mb-4 overflow-hidden">
                <Picker
                  selectedValue={selectedInventoryId}
                  onValueChange={(value) => {
                    setSelectedInventoryId(value);
                    if (value) {
                      setCustomPieceName("");
                      setCustomPieceCost("");
                    }
                  }}
                  style={{
                    backgroundColor: "transparent",
                    color: "#1F2937",
                  }}
                  dropdownIconColor="#FFB74D"
                >
                  <Picker.Item
                    label="Seleccionar pieza..."
                    value=""
                    color="#9CA3AF"
                  />
                  {inventoryItems.map((item) => (
                    <Picker.Item
                      key={item.id}
                      label={`${item.name} - $${item.unitCost.toFixed(2)}`}
                      value={item.id}
                      color="#1F2937"
                    />
                  ))}
                </Picker>
              </View>

              {/* OR Divider */}
              <View className="flex-row items-center my-4">
                <View className="flex-1 h-[1px] bg-background-200" />
                <Text className="mx-3 text-typography-500">O</Text>
                <View className="flex-1 h-[1px] bg-background-200" />
              </View>

              {/* Custom Piece */}
              <Text className="text-sm font-semibold text-typography-900 mb-2">
                Pieza Personalizada
              </Text>
              <TextInput
                placeholder="Nombre de la pieza"
                placeholderTextColor="#9CA3AF"
                value={customPieceName}
                onChangeText={(text) => {
                  setCustomPieceName(text);
                  if (text) setSelectedInventoryId("");
                }}
                editable={!selectedInventoryId}
                className={`border ${
                  selectedInventoryId
                    ? "border-background-200 bg-background-100"
                    : "border-background-200 bg-background-0"
                } rounded-xl p-3 mb-3 text-typography-900`}
              />
              <TextInput
                placeholder="Costo unitario"
                placeholderTextColor="#9CA3AF"
                value={customPieceCost}
                onChangeText={setCustomPieceCost}
                keyboardType="numeric"
                editable={!selectedInventoryId}
                className={`border ${
                  selectedInventoryId
                    ? "border-background-200 bg-background-100"
                    : "border-background-200 bg-background-0"
                } rounded-xl p-3 mb-3 text-typography-900`}
              />

              {/* Quantity */}
              <Text className="text-sm font-semibold text-typography-900 mb-2">
                Cantidad
              </Text>
              <TextInput
                placeholder="Cantidad"
                placeholderTextColor="#9CA3AF"
                value={pieceQuantity}
                onChangeText={setPieceQuantity}
                keyboardType="numeric"
                className="border border-background-200 rounded-xl bg-background-0 p-3 mb-4 text-typography-900"
              />

              {/* Buttons */}
              <View className="flex-row gap-3 mt-2">
                <Button
                  action="primary"
                  size="lg"
                  className="flex-1"
                  onPress={addPiece}
                >
                  <ButtonText>Añadir</ButtonText>
                </Button>
                <Button
                  action="negative"
                  size="lg"
                  className="flex-1"
                  onPress={() => {
                    setIsModalVisible(false);
                    setSelectedInventoryId("");
                    setCustomPieceName("");
                    setCustomPieceCost("");
                    setPieceQuantity("1");
                  }}
                >
                  <ButtonText>Cancelar</ButtonText>
                </Button>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Details;
