/* Файл проверяет только локальные роуты. Оставлен если в будущем добавятся API-роуты, будет готовая защита */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

export default function middleware(request: NextRequest) {
    if (request.method === "OPTIONS") {
        return new NextResponse(JSON.stringify({}), {
            status: 200,
            headers: { "content-type": "application/json" },
        })
    }

    if (request.headers.get("content-type") === "application/json") {
        return new NextResponse(
            JSON.stringify({
                error: "В заголовке передан content-type: application/json, но эта API не умеет работать с этим заголовком, уберите его",
            }),
            {
                status: 400,
                headers: { "content-type": "application/json" },
            }
        )
    }

    if (request.headers.has("athorization")) {
        return new NextResponse(
            JSON.stringify({
                error: "В заголовке указан athorization, возможно вы имели в виду authorization?",
            }),
            {
                status: 400,
                headers: { "content-type": "application/json" },
            }
        )
    }

    return NextResponse.next()
}
