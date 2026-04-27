import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useColorScheme } from 'nativewind';

const { width, height } = Dimensions.get('window');

export type ModalType = 'success' | 'error' | 'warning' | 'info';

interface StatusModalProps {
  visible: boolean;
  onClose: () => void;
  type: ModalType;
  title: string;
  message: string;
  buttonText?: string;
  secondaryButtonText?: string;
  onSecondaryPress?: () => void;
}

const StatusModal = ({
  visible,
  onClose,
  type,
  title,
  message,
  buttonText = 'Dismiss',
  secondaryButtonText,
  onSecondaryPress,
}: StatusModalProps) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim, scaleAnim]);

  const getThemeColor = () => {
    switch (type) {
      case 'success': return '#10B981';
      case 'error': return '#EF4444';
      case 'warning': return '#F59E0B';
      default: return '#2563EB';
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.backdrop,
            { opacity: fadeAnim, backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(15,23,42,0.5)' }
          ]}
        />

        <Animated.View
          style={[
            styles.container,
            {
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ],
              backgroundColor: isDark ? '#18181B' : '#FFFFFF',
              borderColor: isDark ? '#27272A' : '#F1F5F9',
            }
          ]}
        >
          <View style={styles.content}>
            <Text style={[styles.title, { color: isDark ? '#F4F4F5' : '#111827' }]}>
              {title || 'Information'}
            </Text>

            <Text style={[styles.message, { color: isDark ? '#A1A1AA' : '#64748B' }]}>
              {message || 'No additional information provided.'}
            </Text>

            <View style={styles.buttonContainer}>
              {secondaryButtonText && (
                <TouchableOpacity
                  onPress={onSecondaryPress}
                  style={[styles.secondaryButton, { borderColor: isDark ? '#27272A' : '#E2E8F0' }]}
                >
                  <Text style={[styles.secondaryButtonText, { color: isDark ? '#D4D4D8' : '#475569' }]}>
                    {secondaryButtonText}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.8}
                style={[styles.primaryButton, { backgroundColor: getThemeColor() }]}
              >
                <Text style={styles.primaryButtonText}>
                  {buttonText}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 20,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  content: {
    alignItems: 'center',
    paddingTop: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Satoshi-Bold',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 15,
    fontFamily: 'Satoshi-Medium',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    height: 56,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Satoshi-Bold' : 'Satoshi-Bold',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    flex: 1,
    height: 56,
    borderRadius: 100,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Satoshi-Bold' : 'Satoshi-Bold',
    fontWeight: '600',
  },
});

export default StatusModal;
