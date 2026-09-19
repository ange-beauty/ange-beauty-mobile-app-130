import React, { type ReactNode } from 'react';
import { ImageBackground, type StyleProp, StyleSheet, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type FloralBackdropProps = {
  subtle?: boolean;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

const floralBackground = require('@/assets/images/2a9d0066-f747-4fd2-acf1-ebf61da942ae.png');

export default function FloralBackdrop({ subtle = false, children, style, contentStyle }: FloralBackdropProps) {
  return (
    <LinearGradient
      colors={['#FDF8F9', '#FAF2F4', '#F7ECEF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, style]}
    >
      <ImageBackground
        source={floralBackground}
        style={[styles.content, contentStyle]}
        imageStyle={{ opacity: subtle ? 0.18 : 0.26 }}
        resizeMode="cover"
      >
        {children}
      </ImageBackground>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F3F4',
  },
  content: {
    flex: 1,
    width: '100%',
  },
});
