import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout/Header'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import { RecipeDetail } from '@/components/recipe/RecipeDetail'
import { AddRecipeDialog } from '@/components/recipe/AddRecipeDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChefHat, Plus } from 'lucide-react'
import { blink } from '@/blink/client'
import type { Recipe } from '@/types/recipe'

function App() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setIsLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const loadRecipes = useCallback(async () => {
    if (!user?.id) return
    
    try {
      // Try to load from database first
      const dbRecipes = await blink.db.recipes.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      
      // Convert database format back to Recipe objects
      const recipes = dbRecipes.map((dbRecipe: any) => ({
        id: dbRecipe.id,
        userId: dbRecipe.userId,
        title: dbRecipe.title,
        description: dbRecipe.description,
        url: dbRecipe.url,
        imageUrl: dbRecipe.imageUrl,
        prepTime: dbRecipe.prepTime,
        cookTime: dbRecipe.cookTime,
        servings: dbRecipe.servings,
        difficulty: dbRecipe.difficulty,
        ingredients: JSON.parse(dbRecipe.ingredients || '[]'),
        instructions: JSON.parse(dbRecipe.instructions || '[]'),
        notes: dbRecipe.notes,
        tags: JSON.parse(dbRecipe.tags || '[]'),
        createdAt: dbRecipe.createdAt,
        updatedAt: dbRecipe.updatedAt
      }))
      
      setRecipes(recipes)
    } catch (dbError) {
      console.warn('Database load failed, falling back to localStorage:', dbError)
      // Fallback to localStorage
      try {
        const savedRecipes = JSON.parse(localStorage.getItem('recipes') || '[]')
        const userRecipes = savedRecipes.filter((recipe: Recipe) => recipe.userId === user.id)
        setRecipes(userRecipes)
      } catch (error) {
        console.error('Failed to load recipes from localStorage:', error)
        setRecipes([])
      }
    }
  }, [user?.id])

  const filterRecipes = useCallback(() => {
    if (!searchQuery.trim()) {
      setFilteredRecipes(recipes)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = recipes.filter(recipe =>
      recipe.title.toLowerCase().includes(query) ||
      recipe.description?.toLowerCase().includes(query) ||
      recipe.ingredients.some(ing => ing.name.toLowerCase().includes(query)) ||
      recipe.tags.some(tag => tag.toLowerCase().includes(query))
    )
    setFilteredRecipes(filtered)
  }, [recipes, searchQuery])

  useEffect(() => {
    loadRecipes()
  }, [loadRecipes])

  useEffect(() => {
    filterRecipes()
  }, [filterRecipes])

  const handleRecipeAdded = (recipe: Recipe) => {
    setRecipes(prev => [recipe, ...prev])
  }

  const handleRecipeUpdate = (updatedRecipe: Recipe) => {
    setRecipes(prev => prev.map(recipe => 
      recipe.id === updatedRecipe.id ? updatedRecipe : recipe
    ))
    setSelectedRecipe(updatedRecipe)
  }

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe)
    setIsDetailOpen(true)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading Recipe Saver...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <ChefHat className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-foreground mb-4">Recipe Saver</h1>
          <p className="text-muted-foreground mb-6">
            Save and organize your favorite recipes from any website. 
            Multiply ingredients, add personal notes, and never lose a recipe again.
          </p>
          <Button onClick={() => blink.auth.login()} size="lg" className="w-full">
            Sign In to Get Started
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onAddRecipe={() => setIsAddDialogOpen(true)}
        onSearch={handleSearch}
      />

      <main className="container mx-auto px-4 py-8">
        {recipes.length === 0 ? (
          <div className="text-center py-16">
            <ChefHat className="h-16 w-16 text-primary/40 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold mb-4">No recipes yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Start building your recipe collection by adding your first recipe from a URL or manually.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Add Your First Recipe
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold">
                  {searchQuery ? 'Search Results' : 'Your Recipes'}
                </h2>
                <p className="text-muted-foreground">
                  {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''} found
                </p>
              </div>
              
              {searchQuery && (
                <Badge variant="outline" className="text-sm">
                  Searching: "{searchQuery}"
                </Badge>
              )}
            </div>

            {filteredRecipes.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground mb-4">
                  No recipes match your search "{searchQuery}"
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onClick={() => handleRecipeClick(recipe)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <AddRecipeDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onRecipeAdded={handleRecipeAdded}
      />

      <RecipeDetail
        recipe={selectedRecipe}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onRecipeUpdate={handleRecipeUpdate}
      />
    </div>
  )
}

export default App