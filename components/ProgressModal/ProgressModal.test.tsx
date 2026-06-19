import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import ProgressModal from "./ProgressModal"
import { apiFetch } from "@/libs/apiConfig"

// 1. Мокаем функцию apiFetch, чтобы не делать реальные запросы к серверу
jest.mock("@/libs/apiConfig", () => ({
    apiFetch: jest.fn(),
}))

const mockedApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>

describe("ProgressModal", () => {
    // Тестовые данные
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

    // Очищаем моки перед каждым тестом
    beforeEach(() => {
        jest.clearAllMocks()
        // По умолчанию API возвращает успех
        mockedApiFetch.mockResolvedValue({} as any)
    })

    // --- ТЕСТЫ РЕНДЕРИНГА ---
    test("рендерит заголовок, список упражнений и инпуты", () => {
        render(<ProgressModal {...defaultProps} />)

        expect(screen.getByText("Мой прогресс")).toBeInTheDocument()
        expect(screen.getByText("Отжимания")).toBeInTheDocument()
        expect(screen.getByText("Приседания")).toBeInTheDocument()

        // Проверяем доступность (aria-label)
        expect(screen.getByLabelText("Прогресс для упражнения: Отжимания")).toBeInTheDocument()

        // Инпуты type="number" в RTL имеют роль 'spinbutton'
        expect(screen.getAllByRole("spinbutton")).toHaveLength(2)
        expect(screen.getByRole("button", { name: /сохранить/i })).toBeInTheDocument()
    })

    test("показывает заглушку, если список упражнений пуст", () => {
        render(<ProgressModal {...defaultProps} exercises={[]} />)
        expect(screen.getByText("Нет упражнений для заполнения")).toBeInTheDocument()
        expect(screen.queryAllByRole("spinbutton")).toHaveLength(0)
    })

    // --- ТЕСТЫ ИНИЦИАЛИЗАЦИИ ---
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
        expect(inputs[1]).toHaveValue(0) // Дополнено нулем, так как массив короче
    })

    // --- ТЕСТЫ ВАЛИДАЦИИ ВВОДА ---
    test("валидирует ввод: отрицательные числа становятся 0", () => {
        render(<ProgressModal {...defaultProps} />)
        const input = screen.getAllByRole("spinbutton")[0]

        // Симулируем ввод "-10"
        fireEvent.change(input, { target: { value: "-10" } })

        expect(input).toHaveValue(0)
    })

    test("валидирует ввод: числа больше 1000 становятся 1000", () => {
        render(<ProgressModal {...defaultProps} />)
        const input = screen.getAllByRole("spinbutton")[0]

        fireEvent.change(input, { target: { value: "1500" } })

        expect(input).toHaveValue(1000)
    })

    // --- ТЕСТЫ ОТПРАВКИ ФОРМЫ ---
    test("успешно отправляет данные и вызывает onSuccess и onClose", async () => {
        render(<ProgressModal {...defaultProps} initialProgress={[10, 20]} />)

        fireEvent.click(screen.getByRole("button", { name: /сохранить/i }))

        // Ждем, пока вызовется API
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

    test("блокирует инпуты и кнопку во время отправки (isSubmitting)", async () => {
        // Создаем "висящий" Promise, чтобы проверить состояние загрузки
        let resolvePromise: (value: any) => void
        const pendingPromise = new Promise((res) => {
            resolvePromise = res
        })
        mockedApiFetch.mockReturnValueOnce(pendingPromise as any)

        render(<ProgressModal {...defaultProps} />)

        fireEvent.click(screen.getByRole("button", { name: /сохранить/i }))

        // Проверяем, что текст кнопки изменился
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /сохранение/i })).toBeInTheDocument()
        })

        // Инпуты и кнопка должны быть заблокированы
        const inputs = screen.getAllByRole("spinbutton")
        expect(inputs[0]).toBeDisabled()
        expect(screen.getByRole("button", { name: /сохранение/i })).toBeDisabled()

        // Завершаем Promise, чтобы тест не завис
        await act(async () => {
            resolvePromise!({})
        })
    })

    // --- ТЕСТЫ ПОВЕДЕНИЯ МОДАЛКИ ---
    test("закрывает модалку при клике на затемненный фон (оверлей)", () => {
        render(<ProgressModal {...defaultProps} />)

        // Находим оверлей. Так как мы замокали CSS, класс называется "overlay"
        const overlay = screen.getByText("Мой прогресс").closest(".overlay")

        if (overlay) {
            fireEvent.click(overlay)
        }

        expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    test("НЕ закрывает модалку при клике внутри самого окна", () => {
        render(<ProgressModal {...defaultProps} />)

        // Клик по заголовку (внутри .modal)
        fireEvent.click(screen.getByText("Мой прогресс"))

        expect(defaultProps.onClose).not.toHaveBeenCalled()
    })
})
