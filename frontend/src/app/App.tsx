import { RouterProvider } from "react-router";
import { AuthProvider } from "./contexts/AuthContext";
import { router } from "./routes";
// SAHI PATH: utils folder ke andar storage hai
import "./utils/storage";

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
