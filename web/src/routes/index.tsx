import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import Register from '../pages/Register'
import AuthSuccess from '../pages/AuthSuccess'


export const router = createBrowserRouter([
    {
        path: '/login',
        element: <Login />,
    },
    {
        path: '/register',
        element: <Register />,
    },
    {
        path: 'auth/success',
        element: <AuthSuccess />,
    },
    {
        path: '/',
        element: <ProtectedRoute />,
        children: [
            {
                index: true,
                element: <Dashboard />,
            }
        ],
    }
])