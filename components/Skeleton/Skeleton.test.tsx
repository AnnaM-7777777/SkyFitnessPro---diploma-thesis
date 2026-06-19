import { render } from "@testing-library/react"
import "@testing-library/jest-dom"
import Skeleton from "./Skeleton"

describe("Компонент Skeleton", () => {
    it("должен рендериться без ошибок", () => {
        // container дает доступ к корневому DOM-элементу, в который отрендерился компонент
        const { container } = render(<Skeleton />)

        // Ищем элемент по базовому классу из Skeleton.module.css
        const element = container.querySelector(".skeleton")

        // Проверяем, что он есть в документе
        expect(element).toBeInTheDocument()
    })

    it("должен применять переданные стили", () => {
        const { container } = render(<Skeleton width="100px" height="50px" borderRadius="10px" />)

        const element = container.querySelector(".skeleton")

        expect(element).toHaveStyle({
            width: "100px",
            height: "50px",
            borderRadius: "10px",
        })
    })

    it("должен применять переданный className", () => {
        const { container } = render(<Skeleton className="custom-class" />)

        const element = container.querySelector(".custom-class")

        expect(element).toBeInTheDocument()
    })
})
