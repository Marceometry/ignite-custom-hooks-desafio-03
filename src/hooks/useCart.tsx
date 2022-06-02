import { createContext, ReactNode, useContext, useState } from 'react'
import { toast } from 'react-toastify'
import { api } from '../services/api'
import { Product, Stock } from '../types'

interface CartProviderProps {
  children: ReactNode
}

interface UpdateProductAmount {
  productId: number
  amount: number
}

interface CartContextData {
  cart: Product[]
  addProduct: (productId: number) => Promise<void>
  removeProduct: (productId: number) => void
  updateProductAmount: (params: UpdateProductAmount) => void
}

const CartContext = createContext<CartContextData>({} as CartContextData)

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')
    if (storagedCart) return JSON.parse(storagedCart)
    return []
  })

  const updateCart = (list: Product[]) => {
    localStorage.setItem('@RocketShoes:cart', JSON.stringify(list))
    setCart(list)
  }

  const addProduct = async (productId: number) => {
    try {
      const alreadyInCart = cart.find((item) => item.id === productId)
      if (alreadyInCart) {
        const amount = alreadyInCart.amount + 1
        updateProductAmount({ productId, amount })
        return
      }

      const { data } = await api.get<Product>('products/' + productId)
      const newItem = {
        ...data,
        amount: 1,
      }
      const newCart = [...cart, newItem]
      updateCart(newCart)
    } catch {
      toast.error('Erro na adição do produto')
    }
  }

  const removeProduct = (productId: number) => {
    try {
      const itemToRemove = cart.find((item) => item.id === productId)
      if (!itemToRemove) throw new Error()

      const newCart = cart.filter((item) => item.id !== productId)
      updateCart(newCart)
    } catch {
      toast.error('Erro na remoção do produto')
    }
  }

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const { data } = await api.get<Stock>('stock/' + productId)
      if (amount > data.amount) {
        return toast.error('Quantidade solicitada fora de estoque')
      } else if (amount <= 0) {
        throw new Error()
      }

      const newCart = cart.map((item) => {
        if (item.id !== productId) return item
        return {
          ...item,
          amount,
        }
      })
      updateCart(newCart)
    } catch {
      toast.error('Erro na alteração de quantidade do produto')
    }
  }

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextData {
  const context = useContext(CartContext)

  return context
}
