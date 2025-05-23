import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? children : <Navigate to="/signin" />;
};

export default PrivateRoute;
