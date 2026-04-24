import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/authSlice";

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user, role } = useSelector((state) => state.auth);

  return (
    <main className="page">
      <h1>Профиль</h1>
      <p>
        <strong>Имя:</strong> {user?.fullName}
      </p>
      <p>
        <strong>Email:</strong> {user?.email}
      </p>
      <p>
        <strong>Роль:</strong> {role}
      </p>
      <button className="btn btn-danger" type="button" onClick={() => dispatch(logout())}>
        Выйти
      </button>
    </main>
  );
}
