import { WorkArticle } from "../../components/WorkArticle";

export default async function WorkDetailPage({ params }:{ params:Promise<{ id:string }> }) {
  const { id } = await params;
  return <WorkArticle id={id} />;
}
