import React from 'react';
import { TouchableOpacity, StyleSheet, View, Platform, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { Text, MD3TypescaleKey } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface CustomButtonProps {
  mode?: 'text' | 'contained' | 'outlined';
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  icon?: string;
  disabled?: boolean;
  children: React.ReactNode;
  color?: string;
  contentStyle?: StyleProp<ViewStyle>;
  textColor?: string;
}

/**
 * Custom button component that doesn't use animations
 * Replacement for React Native Paper's Button to avoid animation issues
 */
const CustomButton = ({
  mode = 'text',
  onPress,
  style,
  labelStyle,
  icon,
  disabled = false,
  children,
  color,
  contentStyle,
  textColor,
}: CustomButtonProps) => {
  // Determine background color based on mode and custom color
  const getBackgroundColor = () => {
    if (mode === 'contained') {
      return color || '#6B7CFF';
    }
    return 'transparent';
  };

  // Determine text color based on mode and custom color
  const getTextColor = () => {
    if (mode === 'contained') {
      return textColor || '#FFFFFF';
    }
    return textColor || '#6B7CFF';
  };

  // Determine border based on mode
  const getBorderStyle = () => {
    if (mode === 'outlined') {
      return {
        borderWidth: 1.5,
        borderColor: color || '#8A97FF',
        ...Platform.select({
          ios: {
            shadowColor: color || '#8A97FF',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 3,
          },
          android: {
            elevation: 2,
          },
        }),
      } as ViewStyle;
    }
    return {};
  };

  const buttonStyle = [
    styles.button,
    {
      backgroundColor: getBackgroundColor(),
      opacity: disabled ? 0.6 : 1,
      ...getBorderStyle(),
    },
    style,
  ];

  const textStyle = [
    styles.text,
    { color: getTextColor() },
    labelStyle,
  ];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={buttonStyle}
      activeOpacity={0.7}
    >
      <View style={[styles.content, contentStyle]}>
        {icon && (
          <Icon
            name={icon}
            size={20}
            color={getTextColor()}
            style={styles.icon}
          />
        )}
        <Text style={textStyle}>
          {children}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  text: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  } as TextStyle,
  icon: {
    marginRight: 8,
  } as TextStyle,
});

export default CustomButton; 