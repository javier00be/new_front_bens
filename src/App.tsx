import { AppRouter } from './routes';
import { Toaster } from 'sileo';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import 'sileo/styles.css';
import './index.css';

function App() {
  return (
    <AuthProvider>
    <CartProvider>
      <Toaster position="top-center" options={{
        fill: "#171717",
        roundness: 16,
        styles: {
          title: "text-white!",
          description: "text-white/75!",
          badge: "bg-white/10!",
          button: "bg-white/10! hover:bg-white/15!",
        },
      }} />
      <AppRouter />
    </CartProvider>
    </AuthProvider>
  );
}

export default App;
