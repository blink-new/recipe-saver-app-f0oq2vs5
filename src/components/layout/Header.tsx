import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, User, LogOut } from 'lucide-react'
import { blink } from '@/blink/client'

interface HeaderProps {
  onAddRecipe: () => void
  onSearch: (query: string) => void
}

export function Header({ onAddRecipe, onSearch }: HeaderProps) {
  const [user, setUser] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
    })
    return unsubscribe
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchQuery)
  }

  const handleLogout = () => {
    blink.auth.logout()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-primary">Recipe Saver</h1>
        </div>

        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>

        <div className="flex items-center space-x-2">
          <Button onClick={onAddRecipe} size="sm" className="hidden sm:flex">
            <Plus className="h-4 w-4 mr-2" />
            Add Recipe
          </Button>
          
          <Button onClick={onAddRecipe} size="sm" variant="outline" className="sm:hidden">
            <Plus className="h-4 w-4" />
          </Button>

          {user && (
            <div className="flex items-center space-x-2">
              <div className="hidden sm:flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="text-sm text-muted-foreground">{user.email}</span>
              </div>
              <Button onClick={handleLogout} size="sm" variant="ghost">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile search */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>
      </div>
    </header>
  )
}