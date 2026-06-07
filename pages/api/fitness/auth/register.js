import { registerUser, loginUser, getUserByToken } from "@/libs/fitness";

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();

    const { email, password, name } = JSON.parse(req.body);

    try {
        await registerUser({ email, password, name });

        // Сразу логиним после регистрации
        const token = await loginUser({ email, password });
        const user = await getUserByToken(token);

        res.status(200).json({
            token,
            user: {
                _id: user._id,
                email: user.email,
                name: user.name || name || email.split("@")[0],
                imageUrl: user.imageUrl,
            },
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}
