module.exports = {
  root: true,
  // '@react-native' đã bao gồm eslint-config-prettier (tắt rules xung đột)
  extends: ['@react-native', 'plugin:prettier/recommended'],
  // plugin:prettier/recommended làm 3 việc:
  //   1. Bật eslint-plugin-prettier
  //   2. Đặt prettier/prettier thành "error"
  //   3. Extend eslint-config-prettier (tắt rules xung đột)
  rules: {
    // Hiện lỗi Prettier dưới dạng ESLint error — đỏ ngay trong editor
    'prettier/prettier': 'error',
  },
};
