import nextJest from "next/jest.js"

const createJestConfig = nextJest({
    dir: "./",
})

const config = {
    testEnvironment: "jest-environment-jsdom",
    testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
}

export default createJestConfig(config)
