import { loginUser, getUserByToken } from "@/libs/fitness";

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();

    const { email, password } = JSON.parse(req.body);

    try {
        const token = await loginUser({ email, password });
        const user = await getUserByToken(token);

        res.status(200).json({
            token,
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
                imageUrl: user.imageUrl,
            },
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}
