/**
 * @format
 */

import "./global.css";
import React from 'react';
import { AppRegistry, LogBox, StyleSheet, Text, TextInput } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

LogBox.ignoreLogs(['SafeAreaView has been deprecated']);

const resolveSatoshiFontFamily = (style) => {
  const flattened = StyleSheet.flatten(style) ?? {};

  const fontStyle = flattened.fontStyle;
  const isItalic = fontStyle === 'italic';

  const weightRaw = flattened.fontWeight;
  const weightNumber =
    weightRaw === 'bold' ? 700 : typeof weightRaw === 'number' ? weightRaw : Number(weightRaw);

  let bucket = 'Regular';
  if (Number.isFinite(weightNumber)) {
    if (weightNumber >= 800) bucket = 'Black';
    else if (weightNumber >= 600) bucket = 'Bold';
    else if (weightNumber >= 500) bucket = 'Medium';
    else bucket = 'Regular';
  } else if (weightRaw === 'normal' || !weightRaw) {
    bucket = 'Regular';
  } else if (weightRaw === 'bold') {
    bucket = 'Bold';
  }

  if (!isItalic) {
    return `Satoshi-${bucket}`;
  }

  if (bucket === 'Regular') {
    return 'Satoshi-Italic';
  }

  return `Satoshi-${bucket}Italic`;
};

const patchTextComponent = (Component) => {
  if (!Component?.render) return;
  const oldRender = Component.render;
  Component.render = function (...args) {
    const origin = oldRender.call(this, ...args);
    const family = resolveSatoshiFontFamily(origin?.props?.style);
    return React.cloneElement(origin, {
      style: [{ fontFamily: family }, origin.props.style],
    });
  };
};

patchTextComponent(Text);
patchTextComponent(TextInput);

AppRegistry.registerComponent(appName, () => App);
