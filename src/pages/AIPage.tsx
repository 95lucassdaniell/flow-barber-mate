import React from 'react';
import { Navigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';

const AIPage: React.FC = () => {
  const { slug } = useParams();
  
  // Redirect to insights page as the main AI dashboard
  return <Navigate to={`/app/${slug}/ai/insights`} replace />;
};

export default AIPage;