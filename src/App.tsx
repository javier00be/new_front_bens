import { AppRouter } from './routes';
import { Toaster } from 'sileo';
import { AuthProvider } from './contexts/AuthContext';
import 'sileo/styles.css';
import './index.css';

function App() {
  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}

export default App;
