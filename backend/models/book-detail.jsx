import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewContent, setReviewContent] = useState('');
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchBookAndReviews = async () => {
      try {
        setLoading(true);
        const [bookResponse, reviewsResponse] = await Promise.all([
          fetch(`/api/books/${id}`),
          fetch(`/api/reviews?bookId=${id}`)
        ]);

        if (!bookResponse.ok || !reviewsResponse.ok) {
          throw new Error('Failed to fetch book data');
        }

        const [bookData, reviewsData] = await Promise.all([
          bookResponse.json(),
          reviewsResponse.json()
        ]);

        setBook(bookData);
        setReviews(reviewsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookAndReviews();
  }, [id]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!authState.user) {
      navigate('/login', { state: { redirect: `/books/${id}` } });
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.user.token}`
        },
        body: JSON.stringify({
          bookId: id,
          rating,
          content: reviewContent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      const newReview = await response.json();
      setReviews(prev => [newReview, ...prev]);
      setReviewContent('');
      setRating(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      {/* Book Details */}
      <Card>
        <CardHeader>
          <CardTitle>{book.title}</CardTitle>
          <div className="text-sm text-gray-500">by {book.author}</div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= book.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">
              ({book.reviewCount} reviews)
            </span>
          </div>
          <p className="text-gray-700">{book.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="px-2 py-1 text-sm bg-gray-100 rounded">
              {book.genre}
            </span>
            <span className="px-2 py-1 text-sm bg-gray-100 rounded">
              {new Date(book.publishedDate).getFullYear()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Review Form */}
      <Card>
        <CardHeader>
          <CardTitle>Write a Review</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value)}
              placeholder="Share your thoughts about this book..."
              rows={4}
              required
            />
            <Button type="submit" disabled={submitting || !rating}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Reviews</h3>
        {reviews.map((review) => (
          <Card key={review._id}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500">
                  by {review.userId.username}
                </span>
                <span className="text-sm text-gray-500">
                  • {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-700">{review.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BookDetail;
