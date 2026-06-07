import { verifyToken } from "@/libs/fitness";
import { getWorkoutProgress, getAllWorkoutsProgress } from "@/libs/fitness";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const auth = req.headers.authorization;
  const token = auth?.split(" ")[1];

  if (!token)
    return res.status(401).json({ message: "Отсутствует Authorization токен" });

  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ message: "Невалидный токен" });

  const { courseId, workoutId } = req.query;
  if (!courseId)
    return res.status(400).json({ message: "ID курса должен быть указан" });

  try {
    const progress = workoutId
      ? await getWorkoutProgress(decoded.id, courseId, workoutId)
      : await getAllWorkoutsProgress(decoded.id, courseId);
    res.status(200).json(progress);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}
