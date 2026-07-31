import { BlogArticle } from "../../components/BlogArticle";
export default async function BlogDetailPage({ params }: { params:Promise<{ id:string }> }) { const { id } = await params; return <BlogArticle id={id} />; }
