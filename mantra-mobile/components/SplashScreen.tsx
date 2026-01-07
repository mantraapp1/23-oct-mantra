import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { spacing } from '../constants';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const dot1Scale = useRef(new Animated.Value(1)).current;
  const dot2Scale = useRef(new Animated.Value(1)).current;
  const dot3Scale = useRef(new Animated.Value(1)).current;
  const dot1Opacity = useRef(new Animated.Value(0.4)).current;
  const dot2Opacity = useRef(new Animated.Value(0.4)).current;
  const dot3Opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Animate logo entrance
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate loading dots with pop-up effect
    const animateDot = (opacity: Animated.Value, scale: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(opacity, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 1.5,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(opacity, {
              toValue: 0.4,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };

    animateDot(dot1Opacity, dot1Scale, 0);
    animateDot(dot2Opacity, dot2Scale, 300);
    animateDot(dot3Opacity, dot3Scale, 600);

    // Navigate after 3.5 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 3500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      {/* Background Image with Blur Effect */}
      <Image
        source={require('../assets/Splash background.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
        blurRadius={2}
      />
      <View style={styles.blurOverlay} />

      {/* Content */}
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={require('../assets/Mantra logo.jpeg')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <View style={styles.loadingContainer}>
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: dot1Opacity,
                transform: [{ scale: dot1Scale }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: dot2Opacity,
                transform: [{ scale: dot2Scale }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: dot3Opacity,
                transform: [{ scale: dot3Scale }],
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: width,
    height: height,
    top: 0,
    left: 0,
    zIndex: 9999,
  },
  backgroundImage: {
    position: 'absolute',
    width: width,
    height: height,
    top: 0,
    left: 0,
  },
  gradientBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0ea5e9',
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Light translucent overlay
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 35,
    shadowColor: 'rgba(0, 50, 100, 0.35)',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 15,
  },
  logoPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 35,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(0, 50, 100, 0.35)',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 15,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0ea5e9',
    letterSpacing: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing[6],
    gap: spacing[3],
  },
  dot: {
    width: 16,
    height: 16,
    backgroundColor: '#00a1ff',
    borderRadius: 8,
  },
});

export default SplashScreen;
