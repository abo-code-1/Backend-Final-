import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import AppRoutes from "./routes/AppRoutes";
import { loadProfileThunk } from "./store/authSlice";
import AppLayout from "./components/layout/AppLayout";

function App() {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    if (token) {
      dispatch(loadProfileThunk());
    }
  }, [dispatch, token]);

  return (
    <AppLayout>
      <AppRoutes />
    </AppLayout>
  );
}

export default App;
