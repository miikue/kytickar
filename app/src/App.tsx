import DevPage from './pages/DevPage';
import MainPage from './pages/MainPage';

export default function App() {
  if (window.location.pathname === '/dev') {
    return <DevPage />;
  }

  return <MainPage />;
}
