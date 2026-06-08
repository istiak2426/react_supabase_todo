import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

function App() {
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [task, setTask] = useState("");
  const [todos, setTodos] = useState([]);

  const [loading, setLoading] = useState(false);

  // ================= SESSION =================
  useEffect(() => {
    const setUserData = (u) => {
      setUser(u);

      if (!u) {
        setDisplayName("");
        return;
      }

      // Google name → fallback email
      const name =
        u.user_metadata?.full_name ||
        u.user_metadata?.name ||
        u.email;

      setDisplayName(name);
    };

    supabase.auth.getSession().then(({ data }) => {
      setUserData(data.session?.user || null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_e, session) => {
        setUserData(session?.user || null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // ================= AUTH =================
  const login = async () => {
    setLoading(true);
    await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
  };

  const signUp = async () => {
    setLoading(true);
    await supabase.auth.signUp({ email, password });
    setLoading(false);
  };

const loginWithGoogle = async () => {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "https://react-supabase-todo-lemon.vercel.app",
    },
  });
};

  const logout = async () => {
    await supabase.auth.signOut();
  };

  // ================= TODOS =================
  const fetchTodos = async (u) => {
    const { data } = await supabase
      .from("todos")
      .select("*")
      .eq("user_id", u.id)
      .order("id", { ascending: false });

    setTodos(data || []);
  };

  useEffect(() => {
    if (user) fetchTodos(user);
  }, [user]);

  const addTodo = async () => {
    if (!task.trim()) return;

    await supabase.from("todos").insert([
      { task, user_id: user.id },
    ]);

    setTask("");
    fetchTodos(user);
  };

  const deleteTodo = async (id) => {
    await supabase.from("todos").delete().eq("id", id);
    fetchTodos(user);
  };

  // ================= LOGIN UI =================
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-96">
          <h1 className="text-3xl font-bold text-center mb-2">
            Welcome 👋
          </h1>

          <p className="text-center text-gray-500 mb-6">
            Login to continue
          </p>

          <input
            className="w-full p-3 border rounded-lg mb-3"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="w-full p-3 border rounded-lg mb-4"
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            className="w-full bg-blue-500 text-white p-3 rounded-lg mb-2"
            onClick={login}
          >
            Login
          </button>

          <button
            className="w-full bg-green-500 text-white p-3 rounded-lg mb-2"
            onClick={signUp}
          >
            Sign Up
          </button>

          <button
            className="w-full bg-red-500 text-white p-3 rounded-lg"
            onClick={loginWithGoogle}
          >
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  // ================= TODO UI =================
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">

      {/* HEADER */}
      <div className="w-full max-w-2xl flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Todo App</h1>

          {/* 👇 GOOGLE NAME SHOW */}
          <p className="text-gray-600 text-sm">
            👋 Hello, {displayName}
          </p>
        </div>

        <button
          className="bg-gray-900 text-white px-4 py-2 rounded-lg"
          onClick={logout}
        >
          Logout
        </button>
      </div>

      {/* INPUT */}
      <div className="bg-white p-4 rounded-xl shadow w-full max-w-2xl flex gap-2">
        <input
          className="flex-1 p-3 border rounded"
          placeholder="Write a task..."
          value={task}
          onChange={(e) => setTask(e.target.value)}
        />

        <button
          className="bg-blue-500 text-white px-5 rounded hover:bg-blue-600"
          onClick={addTodo}
        >
          Add
        </button>
      </div>

      {/* TODO LIST */}
      <div className="mt-6 w-full max-w-2xl space-y-2">
        {todos.map((t) => (
          <div
            key={t.id}
            className="bg-white p-3 rounded-lg shadow flex justify-between items-center"
          >
            <span>{t.task}</span>

            <button
              className="text-red-500 hover:text-red-700"
              onClick={() => deleteTodo(t.id)}
            >
              ❌
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
