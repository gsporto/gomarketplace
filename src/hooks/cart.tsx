import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const cartProducts = await AsyncStorage.getItem(
        '@GoMarketplace:cartProducts',
      );

      if (cartProducts) {
        setProducts([...JSON.parse(cartProducts)]);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productExists = products.find(
        currentProduct => currentProduct.id === product.id,
      );

      if (productExists) {
        setProducts(
          products.map(currentProduct =>
            currentProduct.id !== product.id
              ? currentProduct
              : { ...product, quantity: currentProduct.quantity + 1 },
          ),
        );
      } else {
        setProducts([...products, { ...product, quantity: 1 }]);
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:cartProducts',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      setProducts(
        products.map(currentProduct =>
          id !== currentProduct.id
            ? currentProduct
            : { ...currentProduct, quantity: currentProduct.quantity + 1 },
        ),
      );

      await AsyncStorage.setItem(
        '@GoMarketplace:cartProducts',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productExists = products.find(
        currentProduct => currentProduct.id === id,
      );

      if (productExists && productExists.quantity > 1) {
        setProducts(
          products.map(currentProduct =>
            id !== currentProduct.id
              ? currentProduct
              : { ...currentProduct, quantity: currentProduct.quantity - 1 },
          ),
        );
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:cartProducts',
        JSON.stringify(products),
      );
    },
    [products, setProducts],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
