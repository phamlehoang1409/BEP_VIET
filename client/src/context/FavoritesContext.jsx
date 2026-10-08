import React, { createContext, useContext, useState, useEffect } from 'react';

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('bepviet_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('bepviet_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.error('Failed to save favorites to localStorage:', e);
    }
  }, [favorites]);

  const toggleFavorite = (food) => {
    if (!food || !food.id) return false;
    let isAdded = false;
    setFavorites((prev) => {
      const exists = prev.some((item) => item.id === food.id);
      if (exists) {
        isAdded = false;
        return prev.filter((item) => item.id !== food.id);
      } else {
        isAdded = true;
        return [...prev, {
          id: food.id,
          name: food.name,
          price: food.price,
          original_price: food.original_price,
          image: food.image,
          rating: food.rating,
          prep_time: food.prep_time,
          spicy_level: food.spicy_level,
          category_name: food.category_name,
          category_slug: food.category_slug,
          is_available: food.is_available
        }];
      }
    });
    return isAdded;
  };

  const isFavorite = (foodId) => {
    return favorites.some((item) => item.id === foodId);
  };

  const clearFavorites = () => {
    setFavorites([]);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        favoritesCount: favorites.length,
        toggleFavorite,
        isFavorite,
        clearFavorites
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
