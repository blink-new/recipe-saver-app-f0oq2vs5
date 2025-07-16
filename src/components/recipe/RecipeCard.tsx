import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Users, ChefHat, ExternalLink } from 'lucide-react'
import type { Recipe } from '@/types/recipe'

interface RecipeCardProps {
  recipe: Recipe
  onClick: () => void
}

export function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0)

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1" onClick={onClick}>
      <div className="aspect-video relative overflow-hidden rounded-t-lg">
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <ChefHat className="h-12 w-12 text-primary/40" />
          </div>
        )}
        
        {recipe.url && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-white/90 text-gray-700">
              <ExternalLink className="h-3 w-3 mr-1" />
              URL
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {recipe.title}
        </h3>
        
        {recipe.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {recipe.description}
          </p>
        )}

        <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
          {totalTime > 0 && (
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {totalTime}m
            </div>
          )}
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            {recipe.servings}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Badge className={getDifficultyColor(recipe.difficulty)}>
            {recipe.difficulty}
          </Badge>
          
          {recipe.tags.length > 0 && (
            <div className="flex space-x-1">
              {recipe.tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {recipe.tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{recipe.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          View Recipe
        </Button>
      </CardFooter>
    </Card>
  )
}