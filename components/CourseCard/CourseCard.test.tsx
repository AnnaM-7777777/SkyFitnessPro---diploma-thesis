import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import CourseCard from "./CourseCard"
import type { Course } from "@/types/course"

// ===== МОКИ ВНЕШНИХ ЗАВИСИМОСТЕЙ =====

// 1. Мок для next/link
jest.mock("next/link", () => {
    const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    )
    MockLink.displayName = "MockLink"
    return MockLink
})

// 2. Мок для next/image
jest.mock("next/image", () => {
    const MockImage = ({
        src,
        alt,
        width,
        height,
    }: {
        src: string
        alt: string
        width: number
        height: number
    }) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} width={width} height={height} />
    )
    MockImage.displayName = "MockImage"
    return MockImage
})

// 3. Мок для useAuth
const mockUseAuth = jest.fn()
jest.mock("@/context/AuthContext", () => ({
    useAuth: () => mockUseAuth(),
}))

// 4. Мок для apiFetch
const mockApiFetch = jest.fn()
jest.mock("@/libs/apiConfig", () => ({
    apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}))

// 5. Мок для window.matchMedia
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
})

// ===== ТЕСТОВЫЕ ДАННЫЕ =====

const mockCourse: Course = {
    _id: "test-course-123",
    nameRU: "Йога для начинающих",
    durationInDays: 30,
    dailyDurationInMinutes: {
        from: 20,
        to: 40,
    },
    image: "/img/test.jpg",
}

// ===== ТЕСТЫ =====

describe("Компонент CourseCard", () => {
    beforeEach(() => {
        jest.clearAllMocks()
        // Очищаем sessionStorage перед каждым тестом
        sessionStorage.clear()
    })

    it("должен рендерить название курса", () => {
        mockUseAuth.mockReturnValue({ user: null, token: null })
        mockApiFetch.mockResolvedValue({ user: { selectedCourses: [] } })

        render(<CourseCard course={mockCourse} />)

        expect(screen.getByText("Йога для начинающих")).toBeInTheDocument()
    })

    it("должен рендерить метаданные (дни и минуты)", () => {
        mockUseAuth.mockReturnValue({ user: null, token: null })
        mockApiFetch.mockResolvedValue({ user: { selectedCourses: [] } })

        render(<CourseCard course={mockCourse} />)

        expect(screen.getByText(/30 дней/)).toBeInTheDocument()
        expect(screen.getByText(/20-40 мин/)).toBeInTheDocument()
    })

    it("должен делать кнопку disabled, если пользователь не авторизован", () => {
        mockUseAuth.mockReturnValue({ user: null, token: null })
        mockApiFetch.mockResolvedValue({ user: { selectedCourses: [] } })

        render(<CourseCard course={mockCourse} />)

        const addButton = screen.getByRole("button", { name: /добавить курс/i })
        expect(addButton).toBeDisabled()
    })

    it('должен показывать иконку "добавить", если курс не добавлен', async () => {
        const mockUser = { email: "test@test.com" }
        mockUseAuth.mockReturnValue({ user: mockUser, token: "test-token" })
        mockApiFetch.mockResolvedValue({ user: { selectedCourses: [] } })

        render(<CourseCard course={mockCourse} />)

        await waitFor(() => {
            const addButton = screen.getByRole("button", { name: /добавить курс/i })
            expect(addButton).toBeInTheDocument()
        })
    })

    it('должен показывать иконку "удалить", если курс уже добавлен', async () => {
        const mockUser = { email: "test@test.com" }
        mockUseAuth.mockReturnValue({ user: mockUser, token: "test-token" })
        mockApiFetch.mockResolvedValue({
            user: { selectedCourses: ["test-course-123"] },
        })

        render(<CourseCard course={mockCourse} />)

        await waitFor(() => {
            const removeButton = screen.getByRole("button", { name: /удалить курс/i })
            expect(removeButton).toBeInTheDocument()
        })
    })

    it('должен вызывать apiFetch при клике на кнопку "добавить"', async () => {
        const mockUser = { email: "test@test.com" }
        mockUseAuth.mockReturnValue({ user: mockUser, token: "test-token" })
        mockApiFetch
            .mockResolvedValueOnce({ user: { selectedCourses: [] } }) // checkIfAdded
            .mockResolvedValueOnce({}) // handleAddCourse

        render(<CourseCard course={mockCourse} />)

        await waitFor(() => {
            const addButton = screen.getByRole("button", { name: /добавить курс/i })
            expect(addButton).not.toBeDisabled()
        })

        const addButton = screen.getByRole("button", { name: /добавить курс/i })
        fireEvent.click(addButton)

        await waitFor(() => {
            expect(mockApiFetch).toHaveBeenCalledWith("/users/me/courses", {
                method: "POST",
                body: JSON.stringify({ courseId: "test-course-123" }),
            })
        })
    })

    it('должен менять кнопку с "добавить" на "удалить" после успешного добавления', async () => {
        const mockUser = { email: "test@test.com" }
        mockUseAuth.mockReturnValue({ user: mockUser, token: "test-token" })
        mockApiFetch
            .mockResolvedValueOnce({ user: { selectedCourses: [] } }) // checkIfAdded
            .mockResolvedValueOnce({}) // handleAddCourse

        render(<CourseCard course={mockCourse} />)

        // Ждём, пока кнопка "Добавить" станет активной
        await waitFor(() => {
            const addButton = screen.getByRole("button", { name: /добавить курс/i })
            expect(addButton).not.toBeDisabled()
        })

        // Кликаем на кнопку "Добавить"
        const addButton = screen.getByRole("button", { name: /добавить курс/i })
        fireEvent.click(addButton)

        // Ждём, пока кнопка изменится на "Удалить"
        await waitFor(() => {
            const removeButton = screen.getByRole("button", { name: /удалить курс/i })
            expect(removeButton).toBeInTheDocument()
        })
    })
})
