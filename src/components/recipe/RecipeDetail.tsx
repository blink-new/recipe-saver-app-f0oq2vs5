import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Clock, 
  Users, 
  ChefHat, 
  ExternalLink, 
  Edit, 
  Save, 
  X,
  Plus,
  Minus
} from 'lucide-react'
import { blink } from '@/blink/client'
import type { Recipe, Ingredient } from '@/types/recipe'

interface RecipeDetailProps {
  recipe: Recipe | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRecipeUpdate: (recipe: Recipe) => void
}

export function RecipeDetail({ recipe, open, onOpenChange, onRecipeUpdate }: RecipeDetailProps) {
  const [multiplier, setMultiplier] = useState(1)
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set())

  if (!recipe) return null

  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0)

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const adjustServings = (factor: number) => {
    const newMultiplier = Math.max(0.5, multiplier + factor)
    setMultiplier(newMultiplier)
  }

  const getAdjustedAmount = (amount: number) => {
    return (amount * multiplier).toFixed(multiplier < 1 ? 1 : 0)
  }

  const saveNotes = async () => {
    const updatedRecipe = { ...recipe, notes, updatedAt: new Date().toISOString() }
    
    try {
      // Update in database
      await blink.db.recipes.update(recipe.id, {
        notes,
        updatedAt: updatedRecipe.updatedAt
      })
    } catch (dbError) {
      console.warn('Database update failed, falling back to localStorage:', dbError)
      // Fallback to localStorage
      const existingRecipes = JSON.parse(localStorage.getItem('recipes') || '[]')
      const recipeIndex = existingRecipes.findIndex((r: Recipe) => r.id === recipe.id)
      if (recipeIndex !== -1) {
        existingRecipes[recipeIndex] = updatedRecipe
        localStorage.setItem('recipes', JSON.stringify(existingRecipes))
      }
    }
    
    onRecipeUpdate(updatedRecipe)
    setIsEditingNotes(false)
  }

  const toggleIngredient = (ingredientId: string) => {
    const newChecked = new Set(checkedIngredients)
    if (newChecked.has(ingredientId)) {
      newChecked.delete(ingredientId)
    } else {
      newChecked.add(ingredientId)
    }
    setCheckedIngredients(newChecked)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{recipe.title}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recipe Image and Info */}
          <div className="lg:col-span-1">
            <div className="aspect-square relative overflow-hidden rounded-lg mb-4">
              {recipe.imageUrl ? (
                <img
                  src={recipe.imageUrl}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <ChefHat className="h-16 w-16 text-primary/40" />
                </div>
              )}
            </div>

            {recipe.description && (
              <p className="text-muted-foreground mb-4">{recipe.description}</p>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Servings:</span>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => adjustServings(-0.5)}
                    disabled={multiplier <= 0.5}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="min-w-[60px] text-center">
                    {Math.round(recipe.servings * multiplier)}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => adjustServings(0.5)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {totalTime > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Time:</span>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {totalTime}m
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Difficulty:</span>
                <Badge className={getDifficultyColor(recipe.difficulty)}>
                  {recipe.difficulty}
                </Badge>
              </div>

              {recipe.url && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(recipe.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Original
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Ingredients and Instructions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ingredients */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Ingredients</h3>
              <div className="space-y-2">
                {recipe.ingredients.map((ingredient) => (
                  <div key={ingredient.id} className="flex items-center space-x-3">
                    <Checkbox
                      checked={checkedIngredients.has(ingredient.id)}
                      onCheckedChange={() => toggleIngredient(ingredient.id)}
                    />
                    <span className={`flex-1 ${checkedIngredients.has(ingredient.id) ? 'line-through text-muted-foreground' : ''}`}>
                      <span className="font-medium">
                        {getAdjustedAmount(ingredient.amount)} {ingredient.unit}
                      </span>{' '}
                      {ingredient.name}
                      {ingredient.notes && (
                        <span className="text-muted-foreground"> ({ingredient.notes})</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Instructions */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Instructions</h3>
              <div className="space-y-4">
                {recipe.instructions.map((instruction, index) => (
                  <div key={index} className="flex space-x-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-relaxed pt-1">{instruction}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Notes */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Personal Notes</h3>
                {!isEditingNotes ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setNotes(recipe.notes || '')
                      setIsEditingNotes(true)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={saveNotes}>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditingNotes(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {isEditingNotes ? (
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add your personal notes, modifications, or tips..."
                  className="min-h-[100px]"
                />
              ) : (
                <div className="min-h-[100px] p-3 border rounded-md bg-muted/30">
                  {recipe.notes ? (
                    <p className="text-sm whitespace-pre-wrap">{recipe.notes}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No notes yet. Click edit to add your personal notes and modifications.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}