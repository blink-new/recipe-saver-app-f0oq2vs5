import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Link, Plus, X } from 'lucide-react'
import { blink } from '@/blink/client'
import type { Recipe, Ingredient } from '@/types/recipe'

interface AddRecipeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRecipeAdded: (recipe: Recipe) => void
}

export function AddRecipeDialog({ open, onOpenChange, onRecipeAdded }: AddRecipeDialogProps) {
  const [url, setUrl] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [isManual, setIsManual] = useState(false)
  const [manualRecipe, setManualRecipe] = useState({
    title: '',
    description: '',
    prepTime: '',
    cookTime: '',
    servings: '4',
    difficulty: 'medium' as const,
    ingredients: [{ id: '1', name: '', amount: '', unit: '', notes: '' }],
    instructions: ['']
  })

  const extractFromUrl = async () => {
    if (!url.trim()) return

    setIsExtracting(true)
    try {
      // Extract content from URL
      const content = await blink.data.extractFromUrl(url)
      
      // Use AI to parse recipe data
      const { object: recipeData } = await blink.ai.generateObject({
        prompt: `Extract recipe information from this content: ${content}. If this is not a recipe, return null for title.`,
        schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            prepTime: { type: 'number' },
            cookTime: { type: 'number' },
            servings: { type: 'number' },
            difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
            ingredients: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  amount: { type: 'number' },
                  unit: { type: 'string' },
                  notes: { type: 'string' }
                }
              }
            },
            instructions: {
              type: 'array',
              items: { type: 'string' }
            },
            imageUrl: { type: 'string' }
          }
        }
      })

      if (!recipeData.title) {
        throw new Error('No recipe found at this URL')
      }

      // Create recipe object
      const user = await blink.auth.me()
      const recipe: Recipe = {
        id: `recipe_${Date.now()}`,
        userId: user.id,
        title: recipeData.title,
        description: recipeData.description || '',
        url: url,
        imageUrl: recipeData.imageUrl,
        prepTime: recipeData.prepTime,
        cookTime: recipeData.cookTime,
        servings: recipeData.servings || 4,
        difficulty: recipeData.difficulty || 'medium',
        ingredients: recipeData.ingredients?.map((ing: any, index: number) => ({
          id: `ing_${index}`,
          name: ing.name,
          amount: ing.amount || 1,
          unit: ing.unit || '',
          notes: ing.notes || ''
        })) || [],
        instructions: recipeData.instructions || [],
        notes: '',
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // For now, store in localStorage (will be replaced with database)
      const existingRecipes = JSON.parse(localStorage.getItem('recipes') || '[]')
      existingRecipes.push(recipe)
      localStorage.setItem('recipes', JSON.stringify(existingRecipes))

      onRecipeAdded(recipe)
      onOpenChange(false)
      setUrl('')
    } catch (error) {
      console.error('Failed to extract recipe:', error)
      alert('Failed to extract recipe from URL. Please try again or add manually.')
    } finally {
      setIsExtracting(false)
    }
  }

  const addIngredient = () => {
    setManualRecipe(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { 
        id: `ing_${prev.ingredients.length}`, 
        name: '', 
        amount: '', 
        unit: '', 
        notes: '' 
      }]
    }))
  }

  const removeIngredient = (index: number) => {
    setManualRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }))
  }

  const addInstruction = () => {
    setManualRecipe(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }))
  }

  const removeInstruction = (index: number) => {
    setManualRecipe(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }))
  }

  const saveManualRecipe = async () => {
    try {
      const user = await blink.auth.me()
      const recipe: Recipe = {
        id: `recipe_${Date.now()}`,
        userId: user.id,
        title: manualRecipe.title,
        description: manualRecipe.description,
        prepTime: parseInt(manualRecipe.prepTime) || undefined,
        cookTime: parseInt(manualRecipe.cookTime) || undefined,
        servings: parseInt(manualRecipe.servings) || 4,
        difficulty: manualRecipe.difficulty,
        ingredients: manualRecipe.ingredients.map((ing, index) => ({
          id: `ing_${index}`,
          name: ing.name,
          amount: parseFloat(ing.amount) || 1,
          unit: ing.unit,
          notes: ing.notes
        })).filter(ing => ing.name.trim()),
        instructions: manualRecipe.instructions.filter(inst => inst.trim()),
        notes: '',
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Store in localStorage
      const existingRecipes = JSON.parse(localStorage.getItem('recipes') || '[]')
      existingRecipes.push(recipe)
      localStorage.setItem('recipes', JSON.stringify(existingRecipes))

      onRecipeAdded(recipe)
      onOpenChange(false)
      
      // Reset form
      setManualRecipe({
        title: '',
        description: '',
        prepTime: '',
        cookTime: '',
        servings: '4',
        difficulty: 'medium',
        ingredients: [{ id: '1', name: '', amount: '', unit: '', notes: '' }],
        instructions: ['']
      })
      setIsManual(false)
    } catch (error) {
      console.error('Failed to save recipe:', error)
      alert('Failed to save recipe. Please try again.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Recipe</DialogTitle>
        </DialogHeader>

        {!isManual ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Recipe URL</Label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="url"
                    placeholder="https://example.com/recipe"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={extractFromUrl} disabled={isExtracting || !url.trim()}>
                  {isExtracting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Extract'
                  )}
                </Button>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">or</p>
              <Button variant="outline" onClick={() => setIsManual(true)}>
                Add Recipe Manually
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Recipe Title *</Label>
                <Input
                  id="title"
                  value={manualRecipe.title}
                  onChange={(e) => setManualRecipe(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Delicious Pasta"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="servings">Servings</Label>
                <Input
                  id="servings"
                  type="number"
                  value={manualRecipe.servings}
                  onChange={(e) => setManualRecipe(prev => ({ ...prev, servings: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={manualRecipe.description}
                onChange={(e) => setManualRecipe(prev => ({ ...prev, description: e.target.value }))}
                placeholder="A brief description of the recipe..."
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prepTime">Prep Time (min)</Label>
                <Input
                  id="prepTime"
                  type="number"
                  value={manualRecipe.prepTime}
                  onChange={(e) => setManualRecipe(prev => ({ ...prev, prepTime: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cookTime">Cook Time (min)</Label>
                <Input
                  id="cookTime"
                  type="number"
                  value={manualRecipe.cookTime}
                  onChange={(e) => setManualRecipe(prev => ({ ...prev, cookTime: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <select
                  id="difficulty"
                  value={manualRecipe.difficulty}
                  onChange={(e) => setManualRecipe(prev => ({ ...prev, difficulty: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-input rounded-md"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Ingredients</Label>
                <Button type="button" size="sm" onClick={addIngredient}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              {manualRecipe.ingredients.map((ingredient, index) => (
                <div key={ingredient.id} className="flex space-x-2">
                  <Input
                    placeholder="Amount"
                    value={ingredient.amount}
                    onChange={(e) => {
                      const newIngredients = [...manualRecipe.ingredients]
                      newIngredients[index].amount = e.target.value
                      setManualRecipe(prev => ({ ...prev, ingredients: newIngredients }))
                    }}
                    className="w-20"
                  />
                  <Input
                    placeholder="Unit"
                    value={ingredient.unit}
                    onChange={(e) => {
                      const newIngredients = [...manualRecipe.ingredients]
                      newIngredients[index].unit = e.target.value
                      setManualRecipe(prev => ({ ...prev, ingredients: newIngredients }))
                    }}
                    className="w-20"
                  />
                  <Input
                    placeholder="Ingredient name"
                    value={ingredient.name}
                    onChange={(e) => {
                      const newIngredients = [...manualRecipe.ingredients]
                      newIngredients[index].name = e.target.value
                      setManualRecipe(prev => ({ ...prev, ingredients: newIngredients }))
                    }}
                    className="flex-1"
                  />
                  {manualRecipe.ingredients.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => removeIngredient(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Instructions</Label>
                <Button type="button" size="sm" onClick={addInstruction}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              {manualRecipe.instructions.map((instruction, index) => (
                <div key={index} className="flex space-x-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <Textarea
                    placeholder="Describe this step..."
                    value={instruction}
                    onChange={(e) => {
                      const newInstructions = [...manualRecipe.instructions]
                      newInstructions[index] = e.target.value
                      setManualRecipe(prev => ({ ...prev, instructions: newInstructions }))
                    }}
                    className="flex-1"
                  />
                  {manualRecipe.instructions.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => removeInstruction(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsManual(false)} className="flex-1">
                Back to URL
              </Button>
              <Button onClick={saveManualRecipe} className="flex-1">
                Save Recipe
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}