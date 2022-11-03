module.exports = {
  // preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  // npm i -D jest @swc/core @swc/jest
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest"],
  },
  // globals: {
  //   'ts-jest': {
  //     isolatedModules: true
  //   }
  // },
};
