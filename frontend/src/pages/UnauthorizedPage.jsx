import React from 'react';
import { Link } from 'react-router-dom';

const UnauthorizedPage = () => (
  <div className="min-h-screen flex items-center justify-center p-6 relative">
    <div className="floating-bg">
      <span className="material-symbols-outlined book-silhouette text-8xl" style={{ top: '10%', left: '5%' }}>menu_book</span>
      <span className="material-symbols-outlined book-silhouette text-9xl" style={{ top: '40%', left: '80%' }}>block</span>
    </div>

    <div className="bg-white p-12 rounded-3xl shadow-2xl text-center max-w-md relative z-10 border border-surface-container-low">
      <div className="w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="material-symbols-outlined text-5xl">lock_person</span>
      </div>
      <h1 className="text-3xl font-black text-on-surface mb-3 tracking-tighter">Access Denied</h1>
      <p className="text-on-surface-variant mb-8">
        You don't have the required permissions to access this gallery.
        Please contact the librarian if you believe this is an error.
      </p>
      <Link to="/" className="btn-primary py-3 px-8 inline-flex">
        Return to Dashboard
      </Link>
    </div>
  </div>
);

export default UnauthorizedPage;
