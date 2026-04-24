export default function PlaceholderPage({ title, description }) {
  return (
    <main className="page">
      <h1>{title}</h1>
      <p>{description || "Страница в разработке."}</p>
    </main>
  );
}
