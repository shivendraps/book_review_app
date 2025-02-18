# book_review_app
A react app with mongodb for book reviews


Used React's useState for local state management to track:

books: Array of book data
loading: Boolean for loading states
error: Error message handling
page: Current page number for pagination
totalPages: Total number of pages available

Used useSearchParams for URL-based filtering, making filters shareable and bookmarkable


Data Fetching

Used useEffect to fetch books when page or search parameters change
Implemented error handling with try/catch
Set loading states to show UI feedback
Extracts search parameters from URL for filtering
Search updates URL parameters for shareable filters
Genre filter allows easy categorization
Resets to page 1 when filters change to avoid empty results

MongoDB Schema Design

Designed schemas with necessary fields and validations
Added timestamps for data tracking
Included defaults where appropriate
Used references between collections (e.g., bookId in reviews)

Error Handling

Added global error handling middleware
Logs errors for debugging
Returns user-friendly error messages