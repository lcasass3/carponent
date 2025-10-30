import { Badge } from "@/shared/components/ui/badge";
import { Button, ButtonText } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Input, InputField } from "@/shared/components/ui/input";
import { RepairsRepository } from "@/shared/repositories/repairs.repository";
import { useUserStore } from "@/shared/stores/useUserStore";
import { Repair } from "@/shared/types/repair.type";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
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

const getStatusColor = (status: Repair["status"]) => {
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

const getStatusBadgeStyle = (status: Repair["status"]) => {
  const styleMap = {
    in_review: "bg-blue-100 border-blue-300",
    repairing: "bg-orange-100 border-orange-300",
    waiting_parts: "bg-gray-100 border-gray-400",
    done: "bg-green-100 border-green-300",
    not_repaired: "bg-red-100 border-red-300",
    delivered: "bg-green-100 border-green-300",
  };
  return styleMap[status];
};

const getStatusTextStyle = (status: Repair["status"]) => {
  const styleMap = {
    in_review: "text-blue-700",
    repairing: "text-orange-700",
    waiting_parts: "text-gray-700",
    done: "text-green-700",
    not_repaired: "text-red-700",
    delivered: "text-green-700",
  };
  return styleMap[status];
};

export default function HomeScreen() {
  const [searchText, setSearchText] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useUserStore();
  const isAdmin = user?.role === "admin";
  const isTech = user?.role === "tech";
  // Load repairs on component mount
  useFocusEffect(
    React.useCallback(() => {
      loadRepairs();
    }, [])
  );

  const loadRepairs = async () => {
    try {
      setLoading(true);
      const repairsData = await RepairsRepository.getAll();
      setRepairs(repairsData);
    } catch (error) {
      console.error("Error loading repairs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter repairs based on search
  const filteredRepairs = repairs.filter(
    (repair) =>
      repair.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
      repair.deviceModel.toLowerCase().includes(searchText.toLowerCase()) ||
      repair.folio?.toLowerCase().includes(searchText.toLowerCase())
  );

  // Get status counts
  const statusCounts = repairs.reduce((acc, repair) => {
    acc[repair.status] = (acc[repair.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
    await loadRepairs();
    setRefreshing(false);
  };

  const renderRepairCard = ({ item }: { item: Repair }) => {
    // 🔹 Flags reutilizables
    const isLocked = item.status === "done" || item.status === "delivered";
    const isDelivered = item.status === "delivered";

    return (
      <Pressable className="mb-3">
        <Card className="p-6 rounded-xl border-2">
          {/* Header */}
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1">
              <Text className="text-lg font-extrabold">
                {item.customerName}
              </Text>
              <Text className="text-sm text-typography-1000">{item.folio}</Text>
            </View>

            {/* 🔒 Deshabilitar navegación a /repairs/status si delivered */}
            <Pressable
              disabled={isDelivered}
              onPress={() => {
                if (isTech && !isDelivered) {
                  router.push({
                    pathname: "/(private)/(tabs)/repairs/status",
                    params: { repairId: item.id, currentStatus: item.status },
                  });
                }
              }}
              style={{ opacity: isDelivered ? 0.6 : 1 }}
            >
              <Badge
                action={getStatusColor(item.status)}
                variant="outline"
                className={`ml-2 border-2 ${getStatusBadgeStyle(item.status)}`}
              >
                <Text
                  className={`text-xs font-bold ${getStatusTextStyle(
                    item.status
                  )}`}
                >
                  {getStatusText(item.status)}
                </Text>
              </Badge>
            </Pressable>
          </View>

          {/* Device Info */}
          <View className="mb-3">
            <Text className="text-lg font-medium text-black mb-1">
              {item.deviceModel}
            </Text>
            <Text className="text-md text-typography-800" numberOfLines={2}>
              {item.issueDescription}
            </Text>
          </View>

          {/* Footer con fecha y costo */}
          <View className="flex-row justify-between items-center pt-3 border-t border-background-200">
            <View className="flex-row items-center">
              <Ionicons
                name="calendar-outline"
                size={20}
                color="#6B7280"
                style={{ marginRight: 4 }}
              />
              <Text className="text-md text-typography-600">
                {item.createdAt.toLocaleDateString("es-MX")}
              </Text>
            </View>
            <Text
              className="text-lg font-semibold text-#FFB74D"
              style={{
                textShadowColor: "#FFB74D",
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 5,
              }}
            >
              $ {item.estimatedCost}
            </Text>
          </View>

          {/* 🔹 BOTONES INFERIORES 🔹 */}
          <View className="flex-row justify-between mt-4">
            {isTech && (
              <Button
                action="secondary"
                size="sm"
                className="flex-1 mx-1"
                style={{
                  backgroundColor: isLocked ? "#BDBDBD" : "#FFB74D",
                  opacity: isLocked ? 0.6 : 1,
                }}
                onPress={() => {
                  if (isLocked) return; // 🔒 bloquea
                  router.push({
                    pathname: "/(private)/(tabs)/repairs/details",
                    params: { repairId: item.id },
                  });
                }}
              >
                <ButtonText className="text-white font-semibold">
                  Modificar
                </ButtonText>
              </Button>
            )}

            {/* Botón Ver */}
            <Button
              action="secondary"
              size="sm"
              className="flex-1 mx-1 bg-gray-500"
              onPress={() =>
                router.push({
                  pathname: "/(private)/(tabs)/repairs/detailsview",
                  params: { repairId: item.id },
                })
              }
            >
              <ButtonText className="text-white font-semibold">Ver</ButtonText>
            </Button>

            {isAdmin && item.status === "done" && (
              <Button
                action="secondary"
                size="sm"
                className="flex-1 mx-1"
                style={{ backgroundColor: "#FFB74D" }}
                onPress={() =>
                  router.push({
                    pathname: "/(private)/(tabs)/repairs/delivery",
                    params: { repairId: item.id },
                  })
                }
              >
                <ButtonText className="text-white font-semibold">
                  Entregar
                </ButtonText>
              </Button>
            )}
          </View>
        </Card>
      </Pressable>
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: "#193456" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#193456" />

      {/* Header */}
      <View className="pt-12 pb-6 px-6" style={{ backgroundColor: "#193456" }}>
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text
              className="text-3xl font-extrabold text-white"
              style={{ color: "#FFB74D" }}
            >
              ¡Hola, {user?.displayName}!
            </Text>
            <Text
              className="text-2xl font-semibold capitalize"
              style={{ color: "white" }}
            >
              {user?.role || "admin"}
            </Text>
          </View>
          <View className="relative">
            <Pressable
              className="w-10 h-10  rounded-full items-center justify-center"
              style={{ backgroundColor: "#FFB74D" }}
              onPress={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Text className="text-white font-bold text-lg">
                {user?.displayName?.charAt(0) || "A"}
              </Text>
            </Pressable>

            {isMenuOpen && (
              <>
                {/* Backdrop */}
                <Pressable
                  className="absolute -inset-6 w-screen h-screen z-40"
                  onPress={() => setIsMenuOpen(false)}
                />

                {/* Dropdown Menu */}
                <View className="absolute top-12 right-0 z-50 bg-background-0 rounded-lg border border-background-200 shadow-lg min-w-[160px] p-1">
                  <Pressable
                    className="flex-row items-center px-3 py-2 rounded-md active:bg-background-100"
                    onPress={() => {
                      setIsMenuOpen(false);
                      signOut();
                    }}
                  >
                    <Ionicons
                      name="log-out-outline"
                      size={18}
                      color="#6B7280"
                      style={{ marginRight: 8 }}
                    />
                    <Text className="text-typography-700 font-normal">
                      Cerrar sesión
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Quick Stats */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row space-x-4">
            <View
              className="bg-background-0 px-4 py-3 rounded-lg border-2 min-w-[110px]"
              style={{ marginRight: 8 }}
            >
              <Text className="text-3xl font-bold text-warning-600 text-center">
                {statusCounts.repairing || 0}
              </Text>
              <Text
                className="text-lg font-extrabold text-center"
                style={{ color: "#193456" }}
              >
                Reparando
              </Text>
            </View>
            <View
              className="bg-background-0 px-4 py-3 rounded-lg border-2 min-w-[110px]"
              style={{ marginRight: 8 }}
            >
              <Text className="text-3xl font-bold text-info-600 text-center">
                {statusCounts.in_review || 0}
              </Text>
              <Text
                className="text-lg font-extrabold text-center"
                style={{ color: "#193456" }}
              >
                En Revisión
              </Text>
            </View>
            <View
              className="bg-background-0 px-4 py-3 rounded-lg border-2 min-w-[110px]"
              style={{ marginRight: 8 }}
            >
              <Text className="text-3xl font-bold text-success-600 text-center">
                {statusCounts.done || 0}
              </Text>
              <Text
                className="text-lg font-extrabold text-center"
                style={{ color: "#193456" }}
              >
                Terminados
              </Text>
            </View>
            <View
              className="bg-background-0 px-4 py-3 rounded-lg border-2 min-w-[110px]"
              style={{ marginRight: 8 }}
            >
              <Text className="text-3xl font-bold text-typography-500 text-center">
                {statusCounts.waiting_parts || 0}
              </Text>
              <Text
                className="text-lg font-extrabold text-center"
                style={{ color: "#193456" }}
              >
                Esperando Piezas
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Action Bar */}
      <View className="px-6 py-4" style={{ backgroundColor: "#193456" }}>
        <View className="flex-row space-x-3 mb-3">
          {isAdmin && (
            <Button
              action="primary"
              size="xl"
              className="flex-1"
              onPress={() => router.push("/(private)/(tabs)/repairs/create")}
              style={{ backgroundColor: "#FFB74D" }}
            >
              <Ionicons
                name="add"
                size={30}
                color="white"
                style={{ marginRight: 8 }}
              />
              <ButtonText className="font-semibold text-2xl ">
                Nueva Reparación
              </ButtonText>
            </Button>
          )}
        </View>

        {/* Search Bar */}
        <View
          className="relative  rounded-xl border-2"
          style={{ borderColor: "#FFB74D" }}
        >
          <Input variant="outline" size="md" className="bg-white rounded-lg">
            <InputField
              placeholder="Buscar por cliente, dispositivo o folio..."
              value={searchText}
              onChangeText={setSearchText}
              className="pl-10 text-base font-extrabold"
              style={{ color: "black", fontSize: 15 }}
            />
          </Input>
          <View className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <Ionicons name="search" size={20} color="#6B7280" />
          </View>
        </View>
      </View>

      {/* Repairs List */}
      <View className="flex-1 px-6 pt-4  ">
        <View className="flex-row justify-between items-center mb-4">
          <Text
            className="text-2xl font-extrabold"
            style={{ color: "#FFB74D" }}
          >
            Reparaciones Activas
          </Text>
          <Text className="text-2xl text-white font-bold">
            {filteredRepairs.length} de {repairs.length}
          </Text>
        </View>

        <FlatList
          data={filteredRepairs}
          renderItem={renderRepairCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-8">
              <Ionicons name="search" size={48} color="#9CA3AF" />
              <Text className="text-typography-500 text-center mt-4">
                {searchText
                  ? "No se encontraron reparaciones"
                  : "No hay reparaciones activas"}
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
}
