import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type FloralBackdropProps = {
  subtle?: boolean;
};

const floralBackground = require('@/assets/images/2a9d0066-f747-4fd2-acf1-ebf61da942ae.png');

export default function FloralBackdrop({ subtle = false }: FloralBackdropProps) {
  return (
    <View pointerEvents="none" style={styles.layer}>
      <LinearGradient
        colors={['#FDF8F9', '#FAF2F4', '#F7ECEF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.baseTint}
      />
      <Image
        source={floralBackground}
        style={[styles.backgroundImage, styles.leftImage, { opacity: subtle ? 0.28 : 0.36 }]}
        resizeMode="cover"
      />
      <Image
        source={floralBackground}
        style={[styles.backgroundImage, styles.rightImage, { opacity: subtle ? 0.22 : 0.3 }]}
        resizeMode="stretch"
      />
      <LinearGradient
        colors={
          subtle
            ? ['rgba(255,250,251,0.42)', 'rgba(255,248,250,0.24)', 'rgba(255,255,255,0.02)']
            : ['rgba(255,248,250,0.36)', 'rgba(255,243,246,0.18)', 'rgba(255,255,255,0.02)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.wash}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  baseTint: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  leftImage: {
    left: -40,
  },
  rightImage: {
    right: -40,
    transform: [{ scaleX: -1 }],
  },
  wash: {
    ...StyleSheet.absoluteFillObject,
  },
});
