import { Navigate } from "react-router-dom";
import { useParams } from "react-router-dom";

export default function FinancialRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/app/${slug}/financial/dashboard`} replace />;
}