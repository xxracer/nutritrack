import express from "express";
import admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import { genkit, z } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/googleai';

dotenv.config();

// Initialize Genkit
const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY || 'MISSING_KEY' })],
});

// Initialize Firebase Admin SDK
if (!admin.apps.length && process.env.FIREBASE_PROJECT_ID) {
  try {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    // Replace literal '\n' with actual newline characters if it's passed as a single string
    if (privateKey) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey
      })
    });
    console.log("Firebase Admin Initialized Successfully");
  } catch (error) {
    console.error("Firebase Initialization Error:", error);
  }
}

const db = admin.apps.length ? admin.firestore() : null;

const app = express();

// Required to parse JSON bodies
app.use(express.json());

// Helper to block if DB is not configured
const requireDb = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!db) {
    return res.status(500).json({ error: "Firebase env variabes are missing. Please configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY." });
  }
  const deviceId = req.headers['x-device-id'] as string;
  if (!deviceId) {
    return res.status(401).json({ error: "Unauthorized: Missing x-device-id header" });
  }
  // Attach deviceId to the request for easy access in handlers
  (req as any).deviceId = deviceId;
  next();
};

app.get("/api/profile", requireDb, async (req, res) => {
  try {
    const deviceId = (req as any).deviceId;
    const doc = await db!.collection('profiles').doc(deviceId).get();
    res.json(doc.exists ? doc.data() : {});
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/profile", requireDb, async (req, res) => {
  try {
    const deviceId = (req as any).deviceId;
    const data = req.body;
    await db!.collection('profiles').doc(deviceId).set(data, { merge: true });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/food", requireDb, async (req, res) => {
  try {
    // Get today's start and end timestamps for the query
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const deviceId = (req as any).deviceId;

    const snapshot = await db!.collection('food_logs')
      .where('userId', '==', deviceId)
      .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(today))
      .where('timestamp', '<', admin.firestore.Timestamp.fromDate(tomorrow))
      .orderBy('timestamp', 'desc')
      .get();

    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));

    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/food/suggest", requireDb, async (req, res) => {
  try {
    const { name } = req.body;

    // Use Genkit to return an array of specific options
    const FoodOptionSchema = z.object({
      options: z.array(z.object({
        name: z.string().describe("Specific name of the item (e.g., 'Arroz Blanco', 'Pollo a la plancha')"),
        calories: z.number().describe("Estimate of total calories"),
        protein: z.number().describe("Estimate of protein in grams"),
        carbs: z.number().describe("Estimate of carbohydrates in grams"),
        fats: z.number().describe("Estimate of total fats in grams"),
        image_term: z.string().describe("A short, 1-2 word term to search for an icon (e.g., 'coffee', 'steak', 'salad')")
      })).min(1).max(10)
    });

    const response = await ai.generate({
      model: gemini15Flash,
      config: { version: 'gemini-3-flash-preview' },
      prompt: `Act as an expert nutritionist. The user provided what they ate: "${name}". 
      If the user typed a single ambiguous item (e.g. "cafe" or "burger"), generate 3 to 4 specific, popular variations of this food so they can choose one.
      HOWEVER, if the user typed a list of multiple specific food items (e.g. "arroz blanco, pollo a la plancha y huevos"), treat it as a single meal containing multiple ingredients. In this case, return EXACTLY those items as separate distinct food objects in the array. Do not return variations, just return the items they actually ate.
      Provide realistic macro estimates (calories, protein, carbs, fats) for a standard portion of each item.`,
      output: { schema: FoodOptionSchema }
    });

    const parsedData = response.output;

    if (!parsedData || !parsedData.options) {
      throw new Error("Failed to parse nutritional data from text.");
    }

    res.json({ success: true, options: parsedData.options });
  } catch (err: any) {
    console.error("DEBUG CRASH SUGGEST:", err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

app.get("/api/food/recommendations", requireDb, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const deviceId = (req as any).deviceId;

    // Fetch profile and today's logs
    const profileDoc = await db!.collection('profiles').doc(deviceId).get();
    const profile = profileDoc.data();

    const logsSnapshot = await db!.collection('food_logs')
      .where('userId', '==', deviceId)
      .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(today))
      .where('timestamp', '<', admin.firestore.Timestamp.fromDate(tomorrow))
      .get();

    const todayFoods = logsSnapshot.docs.map(doc => doc.data().name);

    if (todayFoods.length === 0) {
      return res.json({ recommendation: "Let's start your day! How about a balanced breakfast with proteins and complex carbs?" });
    }

    const SuggestionSchema = z.object({
      recommendation: z.string().describe("A friendly, short sentence suggesting what to eat next based on their day so far.")
    });

    const response = await ai.generate({
      model: gemini15Flash,
      config: { version: 'gemini-3-flash-preview' },
      prompt: `Act as a friendly AI nutritionist. 
      The user's goal is: ${profile?.goal || 'maintain health'}.
      Today they have already eaten: ${todayFoods.join(', ')}.
      Suggest 1 specific meal idea for their next meal that complements what they've already eaten (e.g., if they ate heavy carbs like pancakes earlier, suggest a light protein-focused meal now). Keep it to 1-2 short sentences.`,
      output: { schema: SuggestionSchema }
    });

    const parsedData = response.output;
    res.json({ recommendation: parsedData?.recommendation || "Keep up the good work!" });

  } catch (err: any) {
    console.error("DEBUG CRASH RECOMMENDATIONS:", err);
    res.status(500).json({ error: String(err.message), stack: String(err.stack) });
  }
});

app.post("/api/food", requireDb, async (req, res) => {
  try {
    const { name, calories, protein, carbs, fats, mealType } = req.body;
    const deviceId = (req as any).deviceId;

    // The user has selected a specific option from the suggestions, so just save it.
    const result = await db!.collection('food_logs').add({
      userId: deviceId,
      name,
      calories: calories || 0,
      protein: protein || 0,
      carbs: carbs || 0,
      fats: fats || 0,
      mealType: mealType || 'Snack',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ success: true, id: result.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/food/:id", requireDb, async (req, res) => {
  try {
    await db!.collection('food_logs').doc(req.params.id).delete();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/workouts", requireDb, async (req, res) => {
  try {
    const deviceId = (req as any).deviceId;

    const snapshot = await db!.collection('workout_logs')
      .where('userId', '==', deviceId)
      .orderBy('timestamp', 'desc')
      .get();

    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/workouts", requireDb, async (req, res) => {
  try {
    const deviceId = (req as any).deviceId;
    const { exercises } = req.body;
    const result = await db!.collection('workout_logs').add({
      userId: deviceId,
      exercises: exercises || [],
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ success: true, id: result.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/weight", requireDb, async (req, res) => {
  try {
    const deviceId = (req as any).deviceId;

    const snapshot = await db!.collection('weight_history')
      .where('userId', '==', deviceId)
      .orderBy('timestamp', 'desc')
      .get();

    const history = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));
    res.json(history);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/weight", requireDb, async (req, res) => {
  try {
    const deviceId = (req as any).deviceId;
    const { weight, photo_url } = req.body;
    const result = await db!.collection('weight_history').add({
      userId: deviceId,
      weight, photo_url,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ success: true, id: result.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default app;
