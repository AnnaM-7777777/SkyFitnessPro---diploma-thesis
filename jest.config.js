import nextJest from "next/jest.js"

const createJestConfig = nextJest({
    dir: "./",
})

const config = {
    testEnvironment: "jest-environment-jsdom",
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
    testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1",
    },
}

export default createJestConfig(config)
