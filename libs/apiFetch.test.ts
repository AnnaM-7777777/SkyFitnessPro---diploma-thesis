import { apiFetch } from "./apiConfig"

// Мок для глобального fetch
global.fetch = jest.fn()

describe("Функция apiFetch", () => {
    beforeEach(() => {
        // Очищаем моки перед каждым тестом
        ;(fetch as jest.Mock).mockClear()
        // Очищаем localStorage
        localStorage.clear()
    })

    it("должен делать GET-запрос к правильному URL", async () => {
        // Настраиваем мок fetch на успешный ответ
        ;(fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ courses: [] }),
        })

        await apiFetch("/courses")

        // Проверяем, что fetch был вызван с правильным URL
        expect(fetch).toHaveBeenCalledWith(
            "https://wedev-api.sky.pro/api/fitness/courses",
            expect.any(Object)
        )
    })

    it("должен добавлять заголовок Authorization, если есть токен", async () => {
        localStorage.setItem("fitness_token", "test-token-123")
        ;(fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ user: {} }),
        })

        await apiFetch("/users/me")

        // Проверяем, что заголовок Authorization был добавлен
        expect(fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: "Bearer test-token-123",
                }),
            })
        )
    })

    it("должен делать POST-запрос с телом", async () => {
        ;(fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
        })

        const body = { courseId: "test-123" }
        await apiFetch("/users/me/courses", {
            method: "POST",
            body: JSON.stringify(body),
        })

        expect(fetch).toHaveBeenCalledWith(
            "https://wedev-api.sky.pro/api/fitness/users/me/courses",
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify(body),
            })
        )
    })

    it("должен возвращать данные из ответа", async () => {
        const mockData = { courses: [{ _id: "1", name: "Йога" }] }

        ;(fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockData,
        })

        const result = await apiFetch("/courses")

        expect(result).toEqual(mockData)
    })

    it("должен выбрасывать ошибку при неуспешном ответе", async () => {
        ;(fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ message: "Курс не найден" }),
        })

        await expect(apiFetch("/courses/invalid-id")).rejects.toThrow("Курс не найден")
    })

    it("должен выбрасывать общую ошибку, если message отсутствует", async () => {
        ;(fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            json: async () => ({}),
        })

        await expect(apiFetch("/courses/invalid-id")).rejects.toThrow("Ошибка запроса")
    })
})
