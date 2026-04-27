/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
  extend: {
    fontFamily: {
      sans: ["Satoshi-Variable"],
      satoshi: ["Satoshi-Variable"],
      "satoshi-italic": ["Satoshi-VariableItalic"],
      "satoshi-regular": ["Satoshi-Regular"],
      "satoshi-medium": ["Satoshi-Medium"],
      "satoshi-bold": ["Satoshi-Bold"],
      "satoshi-black": ["Satoshi-Black"],
    },
    colors: {
      primary: '#1877F2',
      azure: '#64B5F6',
      neutral: {
        white: '#FFFFFF',
        dark: '#212529',
        medium: '#6C757D',
      },
      offWhite: '#F8F9FA',
      success: '#28A745',
      warning: '#FFC107',
      danger: '#DC3545',
    }
  }
},
  plugins: [],
}
