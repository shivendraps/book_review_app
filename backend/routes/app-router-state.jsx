import React from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { createContext, useContext, useReducer } from 'react';

// Create auth context
const AuthContext = createContext(null);

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return { user: action.payload };
    case 'LOGOUT':
      return { user: null };
    default:
      return state;
  }
};

// Auth provider component
const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, { user: null });

  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Root layout with navigation
const RootLayout = () => {
  const { state, dispatch } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold">BookReview</Link>
          <div className="flex gap-4">
            {state.user ? (
              <>
                <Link to="/profile" className="text-gray-600 hover:text-gray-900">
                  Profile
                </Link>
                <button 
                  onClick={() => dispatch({ type: 'LOGOUT' })}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="text-gray-600 hover:text-gray-900">
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};

// Router configuration
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { path: '/', element: <BookListing /> },
      { path: '/books/:id', element: <BookDetail /> },
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      { 
        path: '/profile', 
        element: <Profile />,
        loader: ({ request }) => {
          // Check auth status before loading profile
          const auth = useAuth();
          if (!auth.state.user) {
            return redirect('/login?redirect=/profile');
          }
          return null;
        }
      }
    ]
  }
]);

// App component
const App = () => {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
};

export default App;
