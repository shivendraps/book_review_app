import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const BookListing = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const genres = ['All', 'Fiction', 'Non-Fiction', 'Science Fiction', 'Mystery', 'Romance'];

  useEffect(() => {
    fetchBooks();
  }, [page, searchParams]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const search = searchParams.get('search') || '';
      const genre = searchParams.get('genre') || 'All';
      
      // In a real app, this would be an API call
      const response = await fetch(
        `/api/books?page=${page}&search=${search}&genre=${genre}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch books');
      
      const data = await response.json();
      setBooks(data.books);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const search = e.target.value;
    setSearchParams(prev => {
      if (search) prev.set('search', search);
      else prev.delete('search');
      return prev;
    });
    setPage(1);
  };

  const handleGenreFilter = (genre) => {
    setSearchParams(prev => {
      if (genre !== 'All') prev.set('genre', genre);
      else prev.delete('genre');
      return prev;
    });
    setPage(1);
  };

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search books..."
            className="pl-8"
            onChange={handleSearch}
            value={searchParams.get('search') || ''}
          />
        </div>
        <Select
          value={searchParams.get('genre') || 'All'}
          onValueChange={handleGenreFilter}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Genre" />
          </SelectTrigger>
          <SelectContent>
            {genres.map(genre => (
              <SelectItem key={genre} value={genre}>
                {genre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {books.map(book => (
              <Card key={book.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="line-clamp-1">{book.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-gray-500">by {book.author}</p>
                  <p className="mt-2 line-clamp-2">{book.description}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-yellow-500">★</span>
                    <span>{book.rating.toFixed(1)}</span>
                    <span className="text-gray-500">({book.reviewCount} reviews)</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="flex items-center px-4">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default BookListing;
