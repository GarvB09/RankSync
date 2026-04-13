import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-valo-dark flex items-center justify-center p-6">
      <div className="text-center">
        <div className="font-display font-bold text-8xl text-valo-red mb-4 opacity-80">404</div>
        <h1 className="font-display font-bold text-2xl text-white mb-3">PAGE NOT FOUND</h1>
        <p className="text-gray-500 mb-8">This page has been eliminated from the map.</p>
        <Link to="/" className="btn-primary">Back to Home</Link>
      </div>
    </div>
  );
}
