import { useUserStore } from "@/shared/stores/useUserStore";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable, Text } from "@react-navigation/elements";
import { useLinkBuilder, useTheme } from "@react-navigation/native";
import { House, Package, Wrench } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { StyleSheet, View } from "react-native";
import "../../../../shared/styles/globals.css";

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const { colorScheme } = useColorScheme();
  const { buildHref } = useLinkBuilder();
  //Obtener rol
  const { user } = useUserStore();
  const userRole = user?.role;

  const icon = {
    index: (props: any) => (
      <House name="Inicio" size={24} strokeWidth={2.5} {...props} />
    ),
    inventory: (props: any) => (
      <Package name="Inventario" size={24} strokeWidth={2.5} {...props} />
    ),
    repairs: (props: any) => (
      <Wrench name="Reparaciones" size={24} strokeWidth={2.5} {...props} />
    ),
  };

  const lightColors = {
    background: "#FFB74D",
    shadow: "#000000",
    activeText: "#ffffff",
    inactiveText: "#502512ff",
    activeIcon: "#ffffff",
    inactiveIcon: "#8b3f19ff",
  };

  const darkColors = {
    background: "#1a1a1a",
    shadow: "#c4c2c2",
    activeText: "#2e1506ff",
    inactiveText: "#C7C7C7",
    activeIcon: "#FFB74D",
    inactiveIcon: "#C7C7C7",
  };

  const currentColors = colorScheme === "dark" ? darkColors : lightColors;

  return (
    <View
      style={[
        styles.tabbar,
        {
          backgroundColor: currentColors.background,
          shadowColor: currentColors.shadow,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        if (route.name === "repairs") return null;

        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        return (
          <PlatformPressable
            key={route.name}
            href={buildHref(route.name, route.params)}
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabbarItem}
          >
            {icon[route.name]({
              color: isFocused
                ? currentColors.activeIcon
                : currentColors.inactiveIcon,
            })}
            <Text
              style={{
                color: isFocused
                  ? currentColors.activeText
                  : currentColors.inactiveText,
              }}
            >
              {label}
            </Text>
          </PlatformPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabbar: {
    position: "absolute",
    bottom: "30",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: "60",
    paddingVertical: "15",
    borderRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 0.2,
  },
  tabbarItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
});
