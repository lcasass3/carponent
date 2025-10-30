import { RepairsRepository } from "@/shared/repositories/repairs.repository";
import CheckBox from "expo-checkbox"; //CAMBIO PARA AGREGAR CHECKLIST
import { router } from "expo-router";
import React, { useRef, useState } from "react";

import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Signature from "react-native-signature-canvas";

type FormData = {
  nombre: string;
  telefono: string;
  email: string;
  marca: string;
  modelo: string;
  imei: string;
  descripcion: string;
};

type FormField = keyof FormData;
//CAMBIO PARA AGREGAR CHECKLIST
type ChecklistKeys =
  | "aparatoMojado"
  | "noEnciende"
  | "seApagaSolo"
  | "noCarga"
  | "bateriaInflada"
  | "seDescarga"
  | "seReinicia"
  | "pantallaRota"
  | "pantallaManchas"
  | "tactilNoResponde"
  | "sinImagen"
  | "rayasPantalla"
  | "pantallaNegra";
//
export default function AddEquipoForm() {
  // 🔹 Helpers de validación
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  const isValidEmail = (s: string) => emailRegex.test(s.trim());
  const isValidPhone10 = (s: string) => /^\d{10}$/.test(s);

  // 🔹 Estado de errores
  const [errors, setErrors] = useState<{ email?: string; telefono?: string }>(
    {}
  );

  const [form, setForm] = useState<FormData>({
    nombre: "",
    telefono: "",
    email: "",
    marca: "",
    modelo: "",
    imei: "",
    descripcion: "",
  });
  const handleRegister = async () => {
    try {
      if (!form.nombre || !form.marca || !form.modelo || !form.descripcion) {
        Alert.alert(
          "Campos incompletos",
          "Por favor, llena todos los campos obligatorios."
        );
        return;
      }

      if (!firma) {
        Alert.alert(
          "Firma requerida",
          "Por favor, dibuje la firma y presione 'Guardar' dentro del recuadro."
        );
        return;
      }

      // Generar folio único de 6 dígitos
      const folio = Math.floor(100000 + Math.random() * 900000).toString();
      // Validaciones obligatorias
      if (!form.nombre || !form.marca || !form.modelo || !form.descripcion) {
        Alert.alert(
          "Campos incompletos",
          "Por favor, llena todos los campos obligatorios."
        );
        return;
      }

      // Validación de teléfono (si ingresó algo, debe ser de 10 dígitos)
      if (form.telefono && !isValidPhone10(form.telefono)) {
        Alert.alert(
          "Teléfono inválido",
          "El teléfono debe tener exactamente 10 dígitos."
        );
        return;
      }

      // Validación de email (si ingresó algo, debe ser válido)
      if (form.email && !isValidEmail(form.email)) {
        Alert.alert(
          "Correo inválido",
          "Ingresa un correo con formato válido (ej. usuario@dominio.com)."
        );
        return;
      }

      const newRepair = {
        customerName: form.nombre,
        customerEmail: form.email,
        customerPhone: form.telefono,
        deviceModel: `${form.marca} ${form.modelo}`,
        imei: form.imei || null,
        issueDescription: form.descripcion,
        checklist: checklist,
        status: "in_review" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        assignedTo: "",
        estimatedCost: 0,
        finalCost: 0,
        deliveryDate: null,
        folio: folio,
        signature: firma || null,
        pieces: [],
      };

      const repairId = await RepairsRepository.create(newRepair);
      console.log("Repair ID:", repairId);

      // Limpieza de formulario ANTES de redirigir
      setForm({
        nombre: "",
        telefono: "",
        email: "",
        marca: "",
        modelo: "",
        imei: "",
        descripcion: "",
      });
      setChecklist({
        aparatoMojado: false,
        noEnciende: false,
        seApagaSolo: false,
        noCarga: false,
        bateriaInflada: false,
        seDescarga: false,
        seReinicia: false,
        pantallaRota: false,
        pantallaManchas: false,
        tactilNoResponde: false,
        sinImagen: false,
        rayasPantalla: false,
        pantallaNegra: false,
      });
      setFirma(null);
      if (signatureRef.current) {
        signatureRef.current.clearSignature();
      }

      //  Mostrar alerta de éxito y redirigir después
      Alert.alert(
        "Éxito",
        `La reparación fue registrada correctamente.\nFolio: ${folio}`,
        [
          {
            text: "OK",
            onPress: () => {
              router.push("/(private)/(tabs)");
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error al registrar:", error);
      Alert.alert(
        "Error",
        "No se pudo registrar la reparación. Intenta nuevamente."
      );
    }
  };

  const [firma, setFirma] = useState<string | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const signatureRef = useRef<any>(null);

  const handleChange = (field: FormField, value: string) => {
    let next = value;

    if (field === "telefono") {
      // Solo dígitos y tope a 10
      next = value.replace(/\D/g, "").slice(0, 10);
      setErrors((e) => ({
        ...e,
        telefono:
          next.length === 0
            ? undefined
            : isValidPhone10(next)
            ? undefined
            : "Debe tener 10 dígitos",
      }));
    }

    if (field === "email") {
      // Quita espacios sobrantes
      next = value.trim();
      setErrors((e) => ({
        ...e,
        email:
          next.length === 0
            ? undefined
            : isValidEmail(next)
            ? undefined
            : "Correo no válido",
      }));
    }

    setForm((prev) => ({ ...prev, [field]: next }));
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
  };

  const handleCancel = () => {
    Alert.alert("Cancelar", "¿Estás seguro de que quieres cancelar?", [
      { text: "No" },
      {
        text: "Sí",
        onPress: () => {
          // 🔹 Limpiar todos los campos del formulario
          setForm({
            nombre: "",
            telefono: "",
            email: "",
            marca: "",
            modelo: "",
            imei: "",
            descripcion: "",
          });

          // 🔹 Reiniciar checklist
          setChecklist({
            aparatoMojado: false,
            noEnciende: false,
            seApagaSolo: false,
            noCarga: false,
            bateriaInflada: false,
            seDescarga: false,
            seReinicia: false,
            pantallaRota: false,
            pantallaManchas: false,
            tactilNoResponde: false,
            sinImagen: false,
            rayasPantalla: false,
            pantallaNegra: false,
          });

          // 🔹 Limpiar firma y canvas
          setFirma(null);
          signatureRef.current?.clearSignature?.();

          // 🔹 Borrar errores de validación
          setErrors({});

          // 🔹 Regresar al inicio
          router.push("/(private)/(tabs)");
        },
      },
    ]);
  };

  //CAMBIO PARA AGREGAR CHECKLIST
  const [checklist, setChecklist] = useState<Record<ChecklistKeys, boolean>>({
    aparatoMojado: false,
    noEnciende: false,
    seApagaSolo: false,
    noCarga: false,
    bateriaInflada: false,
    seDescarga: false,
    seReinicia: false,
    pantallaRota: false,
    pantallaManchas: false,
    tactilNoResponde: false,
    sinImagen: false,
    rayasPantalla: false,
    pantallaNegra: false,
  });

  const toggleCheckbox = (key: ChecklistKeys) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  //
  return (
    <ScrollView
      className="flex-1 bg-[#193456] p-4"
      scrollEnabled={scrollEnabled}
      contentContainerStyle={{ paddingBottom: 120 }} // CAMBIO PAR AAGREGAR ESPACIO AL FINAL Y QUE LOS BOTONES EAN VISIBLES
    >
      {/* Título */}
      <View className="mb-8 mt-2">
        <Text className="text-3xl font-bold text-center text-white mb-2">
          Registrar reparación
        </Text>
        <View className="w-20 h-1 bg-[#FFB74D] mx-auto rounded-full" />
      </View>

      {/* Datos del Cliente */}
      <View className="bg-[#EDFFFD] p-6 rounded-2xl shadow-lg mb-6 border border-[#FFB74D]/30">
        <Text className="text-xl font-bold mb-4 text-[#193456]">
          Datos del Cliente
        </Text>

        {[
          { placeholder: "Nombre completo", field: "nombre" },
          {
            placeholder: "Teléfono",
            field: "telefono",
            keyboardType: "phone-pad",
          },
          {
            placeholder: "Correo electrónico",
            field: "email",
            keyboardType: "email-address",
          },
        ].map(({ placeholder, field, keyboardType }) => (
          <TextInput
            key={field}
            placeholder={placeholder}
            value={form[field as FormField]}
            onChangeText={(v) => handleChange(field as FormField, v)}
            keyboardType={keyboardType as any}
            placeholderTextColor="#999999"
            className="border-2 border-[#FFB74D] rounded-xl p-4 mb-4 bg-[#EDFFFD]"
          />
        ))}
      </View>

      {/* Datos del Equipo */}
      <View className="bg-[#EDFFFD] p-6 rounded-2xl shadow-lg mb-6 border border-[#FFB74D]/30">
        <Text className="text-xl font-bold mb-4 text-[#193456]">
          Datos del Equipo
        </Text>

        {[
          { placeholder: "Marca del dispositivo", field: "marca" },
          { placeholder: "Modelo", field: "modelo" },
          { placeholder: "IMEI / Número de serie", field: "imei" },
        ].map(({ placeholder, field }) => (
          <TextInput
            key={field}
            placeholder={placeholder}
            value={form[field as FormField]}
            onChangeText={(v) => handleChange(field as FormField, v)}
            placeholderTextColor="#999999"
            className="border-2 border-[#FFB74D] rounded-xl p-4 mb-4 bg-[#EDFFFD]"
          />
        ))}
        {/*CAMBIO PARA AGREGAR CHECKLIST*/}
        {/* Checklist */}
        <Text className="text-lg font-bold text-[#193456] mb-2">
          Este equipo se recibe:
        </Text>

        <View className="gap-2 mb-4">
          <View className="flex-row items-center mb-2">
            <CheckBox
              value={checklist.aparatoMojado}
              onValueChange={() => toggleCheckbox("aparatoMojado")}
              color={checklist.aparatoMojado ? "#FFB74D" : undefined}
            />
            <Text className="ml-2 text-[#193456]">Aparato mojado</Text>
          </View>

          <Text className="font-semibold text-[#193456] mt-2">
            Condiciones relacionadas con la batería y energía
          </Text>

          {[
            ["noEnciende", "No enciende"],
            ["seApagaSolo", "Se apaga solo"],
            ["noCarga", "No carga aún conectado"],
            ["bateriaInflada", "Batería inflada"],
            ["seDescarga", "Se descarga demasiado rápido"],
            ["seReinicia", "Se reinicia constantemente"],
          ].map(([key, label]) => (
            <View key={key} className="flex-row items-center mb-1">
              <CheckBox
                value={checklist[key as ChecklistKeys]}
                onValueChange={() => toggleCheckbox(key as ChecklistKeys)}
                color={checklist[key as ChecklistKeys] ? "#FFB74D" : undefined}
              />
              <Text className="ml-2 text-[#193456]">{label}</Text>
            </View>
          ))}

          <Text className="font-semibold text-[#193456] mt-3">
            Condiciones de la pantalla
          </Text>

          {[
            ["pantallaRota", "Pantalla rota o estrellada"],
            [
              "pantallaManchas",
              "Pantalla con manchas (amarillas, negras o de colores)",
            ],
            ["tactilNoResponde", "Táctil no responde o responde parcialmente"],
            ["sinImagen", "Pantalla encendida pero sin imagen"],
            ["rayasPantalla", "Pantalla con rayas verticales / horizontales"],
            ["pantallaNegra", "Pantalla completamente negra"],
          ].map(([key, label]) => (
            <View key={key} className="flex-row items-center mb-1">
              <CheckBox
                value={checklist[key as ChecklistKeys]}
                onValueChange={() => toggleCheckbox(key as ChecklistKeys)}
                color={checklist[key as ChecklistKeys] ? "#FFB74D" : undefined}
              />
              <Text className="ml-2 text-[#193456]">{label}</Text>
            </View>
          ))}
        </View>
        {/*CAMBIO PARA AGREGAR CHECKLIST HASTA AQUI*/}
        {/* Descripción */}
        <TextInput
          placeholder="Describe el problema o daño del equipo..."
          value={form.descripcion}
          onChangeText={(v) => handleChange("descripcion", v)}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          placeholderTextColor="#999999"
          className="border-2 border-[#FFB74D] rounded-xl p-4 h-32 bg-[#EDFFFD]"
        />
        {/*CAMBIO PARA AGREGAR texto legal*/}
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
      {/*CAMBIO PARA AGREGAR texto legal hasta aqui*/}

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
              .m-signature-pad { 
                border: none; 
                background-color: #fff; 
                /* Ajusta la altura del canvas para dejar espacio al footer */
                height: 160px; 
              }
              .m-signature-pad--footer { 
                display: flex; 
                justify-content: space-between; 
                align-items: center;
                height: 40px; /* Altura explícita para el footer */
                background-color: #fff;
              }
              .m-signature-pad--description {
                display: none; /* Oculta el texto 'Firme aquí' si no lo quieres */
                
              }
              .m-signature-pad--footer .button.clear {
                background-color: #E5E7EB;
                color: #374151;
              }

              /* Estilo botón “Guardar” */
              .m-signature-pad--footer .button.save {
                background-color: #FFB74D;
                color: #fff;
              }
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

      {/* Botones Finales */}
      <View className="flex-row justify-between mb-8 gap-4">
        <TouchableOpacity
          onPress={handleRegister}
          className="bg-[#FFB74D] flex-1 rounded-xl p-4 shadow-lg border border-[#FFB74D]"
        >
          <Text className="text-white text-center font-bold text-lg">
            Registrar Equipo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleCancel}
          className="bg-gray-200 flex-1 rounded-xl p-4 shadow-lg border border-gray-300"
        >
          <Text className="text-gray-700 text-center font-bold text-lg">
            Cancelar
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
