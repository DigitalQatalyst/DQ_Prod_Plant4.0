import { Navigate, useParams } from "react-router-dom";

export function Asset360Redirect() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <Navigate to="/assets/portfolio/overview" replace />;
  }

  return <Navigate to={`/assets/detail/360/${id}`} replace />;
}