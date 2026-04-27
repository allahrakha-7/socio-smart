/**
 * @format
 */

import React from 'react';
import * as ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('react-native-bootsplash', () => ({
  hide: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-reanimated', () => {
  const animation = {
    duration: () => animation,
    delay: () => animation,
    springify: () => animation,
  };

  return {
    __esModule: true,
    default: {
      View: require('react-native').View,
      Text: require('react-native').Text,
      ScrollView: require('react-native').ScrollView,
      Image: require('react-native').Image,
    },
    FadeInDown: animation,
    FadeInUp: animation,
    FadeInLeft: animation,
    FadeInRight: animation,
    Layout: { springify: () => ({}) },
    useSharedValue: (v: any) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withTiming: (v: any) => v,
    withSpring: (v: any) => v,
    runOnJS: (fn: any) => fn,
  };
});

jest.mock('react-native-safe-area-context', () => {
  const ReactLib = require('react');
  const mock = require('react-native-safe-area-context/jest/mock');
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  const frame = { x: 0, y: 0, width: 0, height: 0 };
  return {
    ...mock,
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => frame,
    SafeAreaInsetsContext: ReactLib.createContext(inset),
    SafeAreaFrameContext: ReactLib.createContext(frame),
  };
});

test('renders correctly', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });
  const json = renderer?.toJSON();
  expect(json).toBeTruthy();
});
