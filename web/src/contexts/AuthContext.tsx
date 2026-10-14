import { createContext, useContext, useState, type ReactNode } from 'react'


interface User {
    id: string;
    email: string;
    name: string;
}

interface AuthContextData {
    user: User | null;
    isAuthenticated: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        const token = localStorage.getItem('@sentinel:token');
        const savedUser = localStorage.getItem('@sentinel:user')

        if (token && savedUser) {
            try {
                const usuario = JSON.parse(savedUser)
                return usuario
            }
            catch (e) {
                return null
            }
        }
        return null
    })

    const login = (token: string, userData: User) => {

        localStorage.setItem('@sentinel:token', token)

        localStorage.setItem('@sentinel:user', JSON.stringify(userData))
        setUser(userData)
    }

    const logout = () => {
        localStorage.removeItem('@sentinel:token')
        localStorage.removeItem('@sentinel:user')
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext);
}