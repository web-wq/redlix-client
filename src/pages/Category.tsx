import { useParams, Navigate } from "react-router-dom";

export default function Category() {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={`/shop?category=${slug}`} replace />;
}