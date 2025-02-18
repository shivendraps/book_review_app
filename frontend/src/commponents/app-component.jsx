import React from 'react';
import { AuthProvider } from './components/auth-components';
import BookListing from './components/book-listing';
import BookDetail from './components/book-detail';
import AuthComponents from './components/auth-components';

const App = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-3">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold">BookReview</h1>
              <AuthComponents />
            </div>
          </div>
        </nav>
        <main className="container mx-auto px-4 py-8">
          <BookListing />
        </main>
      </div>
    </AuthProvider>
  );
};

export default App;
