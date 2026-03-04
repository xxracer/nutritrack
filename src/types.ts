export interface Profile {
  name: string;
  age: number;
  gender: string;
  height_ft: number;
  height_in: number;
  weight_lbs: number;
  goal: string;
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fats: number;
}

export interface FoodLog {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  timestamp: string;
}

export interface WorkoutSet {
  id: string;
  lbs: number | '';
  reps: number | '';
  done: boolean;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
}

export interface WorkoutSession {
  id: string;
  exercises: WorkoutExercise[];
  timestamp: string;
}

export interface WeightEntry {
  id: number;
  weight: number;
  photo_url: string;
  timestamp: string;
}
