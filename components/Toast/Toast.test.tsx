import { render, screen, act } from "@testing-library/react"
import "@testing-library/jest-dom"
import Toast from "./Toast"

describe("Компонент Toast", () => {
    // mock-функция для отслеживания вызовов onClose
    const mockOnClose = jest.fn()

    beforeEach(() => {
        mockOnClose.mockClear()
        // Включаем "фейковые" таймеры — это нужно для тестирования setTimeout
        jest.useFakeTimers()
    })

    afterEach(() => {
        // Возвращаем реальные таймеры после каждого теста
        jest.useRealTimers()
    })

    it("должен рендерить текст сообщения", () => {
        render(<Toast message="Курс успешно добавлен!" type="success" onClose={mockOnClose} />)

        expect(screen.getByText("Курс успешно добавлен!")).toBeInTheDocument()
    })

    it("должен применять правильный класс для типа error", () => {
        const { container } = render(<Toast message="Ошибка!" type="error" onClose={mockOnClose} />)

        const toastElement = container.firstChild
        expect(toastElement).toHaveClass("toast__error")
    })

    it("должен применять правильный класс для типа success", () => {
        const { container } = render(
            <Toast message="Успех!" type="success" onClose={mockOnClose} />
        )

        const toastElement = container.firstChild
        expect(toastElement).toHaveClass("toast__success")
    })

    it("должен становиться видимым через 10мс (анимация появления)", () => {
        const { container } = render(<Toast message="Тест" type="success" onClose={mockOnClose} />)

        const toastElement = container.firstChild

        // Сразу после рендера класс _visible ещё не применён
        expect(toastElement).not.toHaveClass("toast_visible")

        // "Перематываем" время на 10мс вперёд
        act(() => {
            jest.advanceTimersByTime(10)
        })

        // Теперь класс _visible должен появиться
        expect(toastElement).toHaveClass("toast_visible")
    })

    it("должен автоматически вызывать onClose через указанный duration", () => {
        render(<Toast message="Тест" type="success" onClose={mockOnClose} duration={3000} />)

        // Проматываем время: 3000мс (таймер) + 300мс (анимация закрытия)
        act(() => {
            jest.advanceTimersByTime(3300)
        })

        expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
})
