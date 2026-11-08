import { useAuth } from "../hooks/useAuth";

function Panel({ titulo }) {
  const { usuario } = useAuth();

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-pink-50 px-4 py-10 text-center">
      <h1 className="text-2xl font-bold text-pink-700">{titulo}</h1>
      <p className="mt-2 text-gray-600">
        Sesión iniciada como {usuario.nombre} {usuario.apellidos} ({usuario.rol})
      </p>
    </main>
  );
}

export default Panel;