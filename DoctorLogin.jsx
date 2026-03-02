import { useState } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate } from "react-router-dom";

export default function DoctorLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    // Check doctor table
    const { data, error } = await supabase
      .from("Doctors")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .single();

    if (error || !data) {
      alert("Invalid Doctor Credentials");
    } else {
      alert("Doctor Login Successful");
      navigate("/doctor-dashboard");
    }
  };

  return (
    <div style={{ padding: "30px" }}>
      <h2>Doctor Login</h2>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Doctor Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <br /><br />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <br /><br />

        <button type="submit">Login</button>
      </form>
    </div>
  );
}