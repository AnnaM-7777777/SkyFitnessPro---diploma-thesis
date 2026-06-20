import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import ProgressModal from "./ProgressModal"
import { apiFetch } from "@/libs/apiConfig"

// Мок apiFetch
jest.mock("@/libs/apiConfig", () => ({
    apiFetch: jest.fn(),
}))

const mockedApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>

describe("ProgressModal", () => {
    const mockExercises = [
        { _id: "ex1", name: "Отжимания" },
        { _id: "ex2", name: "Приседания" },
    ]

    const defaultProps = {
        courseId: "course123",
        workoutId: "workout456",
        exercises: mockExercises,
        onClose: jest.fn(),
        onSuccess: jest.fn(),
    }

    beforeEach(() => {
        jest.clearAllMocks()
        mockedApiFetch.mockResolvedValue({})
    })

    // --- РЕНДЕРИНГ ---
    test("рендерит заголовок, список упражнений и инпуты", () => {
        render(<ProgressModal {...defaultProps} />)

        expect(screen.getByText("Мой прогресс")).toBeInTheDocument()
        expect(screen.getByText("Отжимания")).toBeInTheDocument()
        expect(screen.getByText("Приседания")).toBeInTheDocument()
        expect(screen.getByLabelText("Прогресс для упражнения: Отжимания")).toBeInTheDocument()
        expect(screen.getAllByRole("spinbutton")).toHaveLength(2)
        expect(screen.getByRole("button", { name: /сохранить/i })).toBeInTheDocument()
    })

    test("показывает заглушку, если список упражнений пуст", () => {
        render(<ProgressModal {...defaultProps} exercises={[]} />)
        expect(screen.getByText("Нет упражнений для заполнения")).toBeInTheDocument()
        expect(screen.queryAllByRole("spinbutton")).toHaveLength(0)
    })

    // --- ИНИЦИАЛИЗАЦИЯ ---
    test("инициализирует инпуты нулями, если initialProgress не передан", () => {
        render(<ProgressModal {...defaultProps} />)
        const inputs = screen.getAllByRole("spinbutton")
        expect(inputs[0]).toHaveValue(0)
        expect(inputs[1]).toHaveValue(0)
    })

    test("корректно подставляет initialProgress и дополняет его нулями", () => {
        render(<ProgressModal {...defaultProps} initialProgress={[75]} />)
        const inputs = screen.getAllByRole("spinbutton")
        expect(inputs[0]).toHaveValue(75)
        expect(inputs[1]).toHaveValue(0)
    })

    // --- ВАЛИДАЦИЯ ---
    test("валидирует ввод: отрицательные числа становятся 0", () => {
        render(<ProgressModal {...defaultProps} />)
        const input = screen.getAllByRole("spinbutton")[0]
        fireEvent.change(input, { target: { value: "-10" } })
        expect(input).toHaveValue(0)
    })

    test("валидирует ввод: числа больше 1000 становятся 1000", () => {
        render(<ProgressModal {...defaultProps} />)
        const input = screen.getAllByRole("spinbutton")[0]
        fireEvent.change(input, { target: { value: "1500" } })
        expect(input).toHaveValue(1000)
    })

    // --- ОТПРАВКА ---
    test("успешно отправляет данные и вызывает onSuccess и onClose", async () => {
        render(<ProgressModal {...defaultProps} initialProgress={[10, 20]} />)
        fireEvent.click(screen.getByRole("button", { name: /сохранить/i }))

        await waitFor(() => {
            expect(mockedApiFetch).toHaveBeenCalledWith(
                "/courses/course123/workouts/workout456",
                expect.objectContaining({
                    method: "PATCH",
                    body: JSON.stringify({ progressData: [10, 20] }),
                })
            )
        })

        expect(defaultProps.onSuccess).toHaveBeenCalledTimes(1)
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    // --- ИЗМЕНЕНИЕ ЗНАЧЕНИЙ И ОТПРАВКА ---
    test("отправляет изменённые значения в API", async () => {
        render(<ProgressModal {...defaultProps} />)

        const inputs = screen.getAllByRole("spinbutton")

        // Меняем значения
        fireEvent.change(inputs[0], { target: { value: "30" } })
        fireEvent.change(inputs[1], { target: { value: "50" } })

        // Кликаем "Сохранить"
        fireEvent.click(screen.getByRole("button", { name: /сохранить/i }))

        await waitFor(() => {
            expect(mockedApiFetch).toHaveBeenCalledWith(
                "/courses/course123/workouts/workout456",
                expect.objectContaining({
                    method: "PATCH",
                    body: JSON.stringify({ progressData: [30, 50] }),
                })
            )
        })
    })

    test("показывает ошибку при сбое API и не закрывает модалку", async () => {
        mockedApiFetch.mockRejectedValueOnce(new Error("Ошибка сети"))
        render(<ProgressModal {...defaultProps} />)

        fireEvent.click(screen.getByRole("button", { name: /сохранить/i }))

        await waitFor(() => {
            expect(screen.getByText("Ошибка сети")).toBeInTheDocument()
        })

        expect(defaultProps.onSuccess).not.toHaveBeenCalled()
        expect(defaultProps.onClose).not.toHaveBeenCalled()
    })

    // --- РАЗБЛОКИРОВКА ОСЛЕ ОШИБКИ ---
    test("разблокирует кнопку после ошибки API", async () => {
        mockedApiFetch.mockRejectedValueOnce(new Error("Ошибка"))
        render(<ProgressModal {...defaultProps} />)

        fireEvent.click(screen.getByRole("button", { name: /сохранить/i }))

        // Ждём, пока кнопка снова станет активной
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /сохранить/i })).not.toBeDisabled()
        })
    })

    test("блокирует инпуты и кнопку во время отправки", async () => {
        let resolvePromise: (value: unknown) => void
        const pendingPromise = new Promise((res) => {
            resolvePromise = res
        })
        mockedApiFetch.mockReturnValueOnce(pendingPromise as Promise<unknown>)

        render(<ProgressModal {...defaultProps} />)
        fireEvent.click(screen.getByRole("button", { name: /сохранить/i }))

        await waitFor(() => {
            expect(screen.getByRole("button", { name: /сохранение/i })).toBeInTheDocument()
        })

        const inputs = screen.getAllByRole("spinbutton")
        expect(inputs[0]).toBeDisabled()
        expect(screen.getByRole("button", { name: /сохранение/i })).toBeDisabled()

        await act(async () => {
            resolvePromise!({})
        })
    })

    // --- ПОВЕДЕНИЕ МОДАЛКИ ---
    test("закрывает модалку при клике на оверлей", () => {
        render(<ProgressModal {...defaultProps} />)

        // Находим оверлей через data-testid или через DOM-структуру
        // После настройки styleMock классы будут работать
        const overlay = document.querySelector(".overlay")
        if (overlay) {
            fireEvent.click(overlay)
        }

        expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    test("НЕ закрывает модалку при клике внутри окна", () => {
        render(<ProgressModal {...defaultProps} />)
        fireEvent.click(screen.getByText("Мой прогресс"))
        expect(defaultProps.onClose).not.toHaveBeenCalled()
    })
})
