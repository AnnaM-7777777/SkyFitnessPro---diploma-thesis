import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom"
import LoginModal from "./LoginModal"

// ===== МОКИ ВНЕШНИХ ЗАВИСИМОСТЕЙ =====

// 1. Мок для next/link
jest.mock("next/link", () => {
    const MockLink = ({
        children,
        href,
        onClick,
    }: {
        children: React.ReactNode
        href: string
        onClick?: (e: React.MouseEvent) => void
    }) => (
        <a href={href} onClick={onClick}>
            {children}
        </a>
    )
    MockLink.displayName = "MockLink"
    return MockLink
})

// 2. Мок для next/router
const mockPush = jest.fn()
jest.mock("next/router", () => ({
    useRouter: () => ({
        push: mockPush,
        query: {},
    }),
}))

// 3. Мок для useAuth
const mockLogin = jest.fn()
const mockUseAuth = jest.fn()
jest.mock("@/context/AuthContext", () => ({
    useAuth: () => mockUseAuth(),
}))

// 4. Мок для Logo (простой, чтобы не рендерить SVG)
jest.mock("../Logo/Logo", () => {
    const MockLogo = () => <div data-testid="logo">Logo</div>
    MockLogo.displayName = "MockLogo"
    return MockLogo
})

// ===== ХЕЛПЕР ДЛЯ РЕНДЕРА =====

const mockOnClose = jest.fn()

const renderLoginModal = () => {
    return render(<LoginModal onClose={mockOnClose} />)
}

// ===== ТЕСТЫ =====

describe("Компонент LoginModal", () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockUseAuth.mockReturnValue({
            login: mockLogin,
            isLoading: false,
        })
    })

    it("должен рендерить форму с полями и кнопками", () => {
        renderLoginModal()

        expect(screen.getByPlaceholderText("Логин")).toBeInTheDocument()
        expect(screen.getByPlaceholderText("Пароль")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: /войти/i })).toBeInTheDocument()
        expect(screen.getByText("Зарегистрироваться")).toBeInTheDocument()
    })

    it("должен показывать ошибку при пустом email", async () => {
        const user = userEvent.setup()
        renderLoginModal()

        // Вводим только пароль
        await user.type(screen.getByPlaceholderText("Пароль"), "password123")
        await user.click(screen.getByRole("button", { name: /войти/i }))

        await waitFor(() => {
            expect(screen.getByText("Введите адрес электронной почты")).toBeInTheDocument()
        })

        // login не должен был вызваться
        expect(mockLogin).not.toHaveBeenCalled()
    })

    it("должен показывать ошибку при некорректном email", async () => {
        const user = userEvent.setup()
        renderLoginModal()

        // Вводим некорректный email
        await user.type(screen.getByPlaceholderText("Логин"), "invalid-email")
        await user.type(screen.getByPlaceholderText("Пароль"), "password123")
        await user.click(screen.getByRole("button", { name: /войти/i }))

        await waitFor(() => {
            expect(screen.getByText(/введите корректный email/i)).toBeInTheDocument()
        })

        expect(mockLogin).not.toHaveBeenCalled()
    })

    it("должен показывать ошибку при пустом пароле", async () => {
        const user = userEvent.setup()
        renderLoginModal()

        // Вводим только email
        await user.type(screen.getByPlaceholderText("Логин"), "test@test.com")
        await user.click(screen.getByRole("button", { name: /войти/i }))

        await waitFor(() => {
            expect(screen.getByText("Введите пароль")).toBeInTheDocument()
        })

        expect(mockLogin).not.toHaveBeenCalled()
    })

    it("должен вызывать login и onClose при успешной авторизации", async () => {
        const user = userEvent.setup()
        mockLogin.mockResolvedValueOnce({})

        renderLoginModal()

        await user.type(screen.getByPlaceholderText("Логин"), "test@test.com")
        await user.type(screen.getByPlaceholderText("Пароль"), "password123")
        await user.click(screen.getByRole("button", { name: /войти/i }))

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith("test@test.com", "password123")
            expect(mockOnClose).toHaveBeenCalled()
        })
    })

    it("должен показывать универсальную ошибку при неверных данных", async () => {
        const user = userEvent.setup()
        mockLogin.mockRejectedValueOnce(new Error("400 Bad Request"))

        renderLoginModal()

        await user.type(screen.getByPlaceholderText("Логин"), "test@test.com")
        await user.type(screen.getByPlaceholderText("Пароль"), "wrongpass")
        await user.click(screen.getByRole("button", { name: /войти/i }))

        await waitFor(() => {
            expect(screen.getByText(/неверные данные/i)).toBeInTheDocument()
        })
    })

    it("должен показывать специфичную ошибку, если пользователь не найден", async () => {
        const user = userEvent.setup()
        mockLogin.mockRejectedValueOnce(new Error("User not found"))

        renderLoginModal()

        await user.type(screen.getByPlaceholderText("Логин"), "unknown@test.com")
        await user.type(screen.getByPlaceholderText("Пароль"), "password123")
        await user.click(screen.getByRole("button", { name: /войти/i }))

        await waitFor(() => {
            expect(screen.getByText(/пользователь с таким email не найден/i)).toBeInTheDocument()
        })
    })

    it("должен показывать специфичную ошибку о неверном пароле", async () => {
        const user = userEvent.setup()
        mockLogin.mockRejectedValueOnce(new Error("Invalid password"))

        renderLoginModal()

        await user.type(screen.getByPlaceholderText("Логин"), "test@test.com")
        await user.type(screen.getByPlaceholderText("Пароль"), "wrongpass")
        await user.click(screen.getByRole("button", { name: /войти/i }))

        await waitFor(() => {
            expect(screen.getByText("Неверный пароль")).toBeInTheDocument()
        })
    })

    it("должен блокировать кнопку во время загрузки", () => {
        mockUseAuth.mockReturnValue({
            login: mockLogin,
            isLoading: true,
        })

        renderLoginModal()

        const button = screen.getByRole("button", { name: /вход/i })
        expect(button).toBeDisabled()
    })
})
