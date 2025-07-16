export interface Recipe {
  id: string
  userId: string
  title: string
  description?: string
  url?: string
  imageUrl?: string
  prepTime?: number
  cookTime?: number
  servings: number
  difficulty: 'easy' | 'medium' | 'hard'
  ingredients: Ingredient[]
  instructions: string[]
  notes?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface Ingredient {
  id: string
  name: string
  amount: number
  unit: string
  notes?: string
}

export interface RecipeFormData {
  url: string
}