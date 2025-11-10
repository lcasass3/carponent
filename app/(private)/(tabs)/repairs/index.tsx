import { Badge } from "@/shared/components/ui/badge";
import { Button, ButtonText } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Input, InputField } from "@/shared/components/ui/input";
import { RepairsRepository } from "@/shared/repositories/repairs.repository";
import { Repair, RepairStatus } from "@/shared/types/repair.type";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
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

export default function RepairsScreen() {
  const [searchText, setSearchText] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<RepairStatus | "all">(
    "all"
  );

  // Load repairs on component mount
  useEffect(() => {
    loadRepairs();
  }, []);

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

  // Filter repairs based on search and status
  const filteredRepairs = repairs.filter((repair) => {
    const matchesSearch =
      repair.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
      repair.deviceModel.toLowerCase().includes(searchText.toLowerCase()) ||
      repair.folio?.toLowerCase().includes(searchText.toLowerCase()) ||
      repair.customerPhone.toLowerCase().includes(searchText.toLowerCase());

    const matchesStatus =
      selectedStatus === "all" || repair.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  // Get status counts
  const statusCounts = repairs.reduce((acc, repair) => {
    acc[repair.status] = (acc[repair.status] || 0) + 1;
    return acc;
  }, {} as Record<RepairStatus, number>);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRepairs();
    setRefreshing(false);
  };

  const handleStatusFilter = (status: RepairStatus | "all") => {
    setSelectedStatus(status);
  };

  const renderRepairCard = ({ item }: { item: Repair }) => (
    <Pressable
      className="mb-4"
      onPress={() =>
        router.push(`/(private)/(tabs)/repairs/detailsview?id=${item.id}`)
      }
    >
      <Card className="p-4 bg-background-50 border-2 border-background-200 shadow-sm">
        {/* Header */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 pr-2">
            <Text className="text-lg font-bold text-typography-900 mb-1">
              {item.customerName}
            </Text>
            <Text className="text-sm font-medium text-primary-600">
              {item.folio}
            </Text>
          </View>
          <Badge
            action={getStatusColor(item.status)}
            variant="outline"
            className={`border-2 ${getStatusBadgeStyle(item.status)}`}
          >
            <Text
              className={`text-xs font-bold ${getStatusTextStyle(item.status)}`}
            >
              {getStatusText(item.status)}
            </Text>
          </Badge>
        </View>

        {/* Device Info */}
        <View className="mb-3 pb-3 border-b border-background-200">
          <View className="flex-row items-center mb-2">
            <Ionicons
              name="phone-portrait-outline"
              size={16}
              color="#6B7280"
              style={{ marginRight: 6 }}
            />
            <Text className="text-base font-semibold text-typography-800">
              {item.deviceModel}
            </Text>
          </View>
          <Text className="text-sm text-typography-600 ml-6" numberOfLines={2}>
            {item.issueDescription}
          </Text>
        </View>

        {/* Contact Info */}
        <View className="mb-3 pb-3 border-b border-background-200">
          <View className="flex-row items-center">
            <Ionicons
              name="call-outline"
              size={14}
              color="#6B7280"
              style={{ marginRight: 6 }}
            />
            <Text className="text-sm text-typography-600">
              {item.customerPhone}
            </Text>
          </View>
        </View>

        {/* Footer with Date and Cost */}
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <Ionicons
              name="calendar-outline"
              size={16}
              color="#6B7280"
              style={{ marginRight: 6 }}
            />
            <Text className="text-sm text-typography-600">
              {item.createdAt.toLocaleDateString("es-MX", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </Text>
          </View>
          <Text className="text-lg font-bold text-primary-600">
            ${item.finalCost.toLocaleString("es-MX")}
          </Text>
        </View>

        {/* Quick Actions */}
        <View className="flex-row gap-2 mt-4 pt-3 border-t border-background-200">
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center bg-primary-500 rounded-lg py-2 px-3"
            onPress={() =>
              router.push(`/(private)/(tabs)/repairs/details?id=${item.id}`)
            }
          >
            <Ionicons
              name="create-outline"
              size={16}
              color="white"
              style={{ marginRight: 4 }}
            />
            <Text className="text-white font-semibold text-sm">Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center bg-info-500 rounded-lg py-2 px-3"
            onPress={() =>
              router.push(`/(private)/(tabs)/repairs/status?id=${item.id}`)
            }
          >
            <Ionicons
              name="swap-horizontal-outline"
              size={16}
              color="white"
              style={{ marginRight: 4 }}
            />
            <Text className="text-white font-semibold text-sm">Estado</Text>
          </TouchableOpacity>
          {item.status === "done" && (
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center bg-success-500 rounded-lg py-2 px-3"
              onPress={() =>
                router.push(`/(private)/(tabs)/repairs/delivery?id=${item.id}`)
              }
            >
              <Ionicons
                name="checkmark-done-outline"
                size={16}
                color="white"
                style={{ marginRight: 4 }}
              />
              <Text className="text-white font-semibold text-sm">Entregar</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-background-0">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View className="bg-background-50 pt-12 pb-4 px-6 border-b-2 border-primary-400">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-3xl font-bold text-secondary-900">
              Reparaciones
            </Text>
            <Text className="text-lg text-primary-500 mt-1">
              Gestión completa de servicios
            </Text>
          </View>
          <View className="bg-primary-500 w-12 h-12 rounded-full items-center justify-center">
            <Ionicons name="construct" size={24} color="white" />
          </View>
        </View>

        {/* Quick Stats */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
        >
          <View className="flex-row space-x-3">
            <Pressable
              onPress={() => handleStatusFilter("all")}
              className={`px-4 py-3 rounded-xl border-2 min-w-[100px] ${
                selectedStatus === "all"
                  ? "bg-primary-500 border-primary-600"
                  : "bg-background-0 border-background-300"
              }`}
            >
              <Text
                className={`text-2xl font-bold text-center mb-1 ${
                  selectedStatus === "all"
                    ? "text-white"
                    : "text-typography-900"
                }`}
              >
                {repairs.length}
              </Text>
              <Text
                className={`text-xs text-center ${
                  selectedStatus === "all"
                    ? "text-white"
                    : "text-typography-600"
                }`}
              >
                Todas
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleStatusFilter("in_review")}
              className={`px-4 py-3 rounded-xl border-2 min-w-[100px] ${
                selectedStatus === "in_review"
                  ? "bg-info-500 border-info-600"
                  : "bg-background-0 border-info-300"
              }`}
            >
              <Text
                className={`text-2xl font-bold text-center mb-1 ${
                  selectedStatus === "in_review"
                    ? "text-white"
                    : "text-info-700"
                }`}
              >
                {statusCounts.in_review || 0}
              </Text>
              <Text
                className={`text-xs text-center ${
                  selectedStatus === "in_review"
                    ? "text-white"
                    : "text-typography-600"
                }`}
              >
                En Revisión
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleStatusFilter("repairing")}
              className={`px-4 py-3 rounded-xl border-2 min-w-[100px] ${
                selectedStatus === "repairing"
                  ? "bg-warning-500 border-warning-600"
                  : "bg-background-0 border-warning-300"
              }`}
            >
              <Text
                className={`text-2xl font-bold text-center mb-1 ${
                  selectedStatus === "repairing"
                    ? "text-white"
                    : "text-warning-700"
                }`}
              >
                {statusCounts.repairing || 0}
              </Text>
              <Text
                className={`text-xs text-center ${
                  selectedStatus === "repairing"
                    ? "text-white"
                    : "text-typography-600"
                }`}
              >
                Reparando
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleStatusFilter("waiting_parts")}
              className={`px-4 py-3 rounded-xl border-2 min-w-[100px] ${
                selectedStatus === "waiting_parts"
                  ? "bg-gray-500 border-gray-600"
                  : "bg-background-0 border-gray-300"
              }`}
            >
              <Text
                className={`text-2xl font-bold text-center mb-1 ${
                  selectedStatus === "waiting_parts"
                    ? "text-white"
                    : "text-gray-700"
                }`}
              >
                {statusCounts.waiting_parts || 0}
              </Text>
              <Text
                className={`text-xs text-center ${
                  selectedStatus === "waiting_parts"
                    ? "text-white"
                    : "text-typography-600"
                }`}
              >
                Esp. Piezas
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleStatusFilter("done")}
              className={`px-4 py-3 rounded-xl border-2 min-w-[100px] ${
                selectedStatus === "done"
                  ? "bg-success-500 border-success-600"
                  : "bg-background-0 border-success-300"
              }`}
            >
              <Text
                className={`text-2xl font-bold text-center mb-1 ${
                  selectedStatus === "done" ? "text-white" : "text-success-700"
                }`}
              >
                {statusCounts.done || 0}
              </Text>
              <Text
                className={`text-xs text-center ${
                  selectedStatus === "done"
                    ? "text-white"
                    : "text-typography-600"
                }`}
              >
                Terminados
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleStatusFilter("delivered")}
              className={`px-4 py-3 rounded-xl border-2 min-w-[100px] ${
                selectedStatus === "delivered"
                  ? "bg-emerald-500 border-emerald-600"
                  : "bg-background-0 border-emerald-300"
              }`}
            >
              <Text
                className={`text-2xl font-bold text-center mb-1 ${
                  selectedStatus === "delivered"
                    ? "text-white"
                    : "text-emerald-700"
                }`}
              >
                {statusCounts.delivered || 0}
              </Text>
              <Text
                className={`text-xs text-center ${
                  selectedStatus === "delivered"
                    ? "text-white"
                    : "text-typography-600"
                }`}
              >
                Entregados
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>

      {/* Action Bar */}
      <View className="px-6 py-4 bg-background-50 border-b border-background-200">
        <Button
          action="primary"
          size="lg"
          className="mb-3 rounded-xl"
          onPress={() => router.push("/(private)/(tabs)/repairs/create")}
        >
          <Ionicons
            name="add-circle"
            size={22}
            color="white"
            style={{ marginRight: 8 }}
          />
          <ButtonText className="font-bold text-base">
            Nueva Reparación
          </ButtonText>
        </Button>

        {/* Search Bar */}
        <View className="relative">
          <Input
            variant="outline"
            size="md"
            className="border-2 border-primary-300"
          >
            <InputField
              placeholder="Buscar por cliente, dispositivo, folio o teléfono..."
              value={searchText}
              onChangeText={setSearchText}
              className="pl-10"
            />
          </Input>
          <View className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <Ionicons name="search" size={20} color="#9CA3AF" />
          </View>
          {searchText.length > 0 && (
            <Pressable
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
              onPress={() => setSearchText("")}
            >
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Repairs List */}
      <View className="flex-1 px-6 pt-4 bg-background-0">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-bold text-typography-900">
            {selectedStatus === "all"
              ? "Todas las Reparaciones"
              : getStatusText(selectedStatus)}
          </Text>
          <Text className="text-sm font-medium text-typography-600">
            {filteredRepairs.length} de {repairs.length}
          </Text>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#FFB74D" />
            <Text className="text-typography-500 mt-4">
              Cargando reparaciones...
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredRepairs}
            renderItem={renderRepairCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
              <View className="items-center justify-center py-12">
                <View className="bg-background-100 w-20 h-20 rounded-full items-center justify-center mb-4">
                  <Ionicons name="search" size={40} color="#9CA3AF" />
                </View>
                <Text className="text-typography-900 font-semibold text-lg mb-2">
                  {searchText
                    ? "No se encontraron resultados"
                    : "No hay reparaciones"}
                </Text>
                <Text className="text-typography-500 text-center px-8">
                  {searchText
                    ? "Intenta con otros términos de búsqueda"
                    : selectedStatus === "all"
                    ? "Comienza creando una nueva reparación"
                    : `No hay reparaciones con estado "${getStatusText(
                        selectedStatus
                      )}"`}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}
