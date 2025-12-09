import { router } from "expo-router"

const navigate = {
  toHome: () => router.push("/screens/HomeScreen"),
  toOrders: () => router.push("/screens/OrdersScreen"),
  toOrderDetails: (orderId: string) => router.push(`/screens/OrderDetailsScreen?id=${orderId}`),
  //toSignIn: () => router.push("/screens/SignInScreen"),
  // Add more navigation helpers
}

// Use in your components:
// navigate.toHome()
// navigate.toOrderDetails("123")

export default navigate