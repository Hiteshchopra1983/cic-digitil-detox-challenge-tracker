import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Country, City } from "country-state-city";
import { apiRequest } from "../lib/api";

export default function SignupPage() {

  const navigate = useNavigate();

  const countries = Country.getAllCountries();

  const [cities, setCities] = useState<any[]>([]);

  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    country: "",
    city: "",
    cohort: "",
    consent: false
  });

  function update(field: string, value: any) {

    setForm({
      ...form,
      [field]: value
    });

  }

  function handleCountryChange(code: string) {

    update("country", code);

    const cityList = City.getCitiesOfCountry(code) || [];

    setCities(cityList);

  }

  function validatePassword(password: string) {

    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    return regex.test(password);

  }

  async function handleSubmit(e: any) {

    e.preventDefault();

    setError("");

    if (!validatePassword(form.password)) {

      setError(
        "Password must contain uppercase, lowercase, number, special character and minimum 8 characters."
      );

      return;

    }

    if (!form.consent) {

      setError("You must provide consent to participate.");

      return;

    }

    try {

      await apiRequest("/api/register", "POST", form);

      alert("Account created successfully");

      navigate("/");

    } catch (err) {

      console.error(err);

      setError("Signup failed");

    }

  }

  return (

    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <div className="bg-white shadow-xl rounded-xl p-10 w-full max-w-md">

        <h1 className="text-2xl font-bold text-center mb-6">
          Join Digital Detox Challenge
        </h1>

        {error && (
          <div className="text-red-500 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="text-sm font-medium">Full Name</label>
            <input
              className="w-full border rounded-lg px-4 py-2 mt-1"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Email Address</label>
            <input
              type="email"
              className="w-full border rounded-lg px-4 py-2 mt-1"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              className="w-full border rounded-lg px-4 py-2 mt-1"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
            />

            <p className="text-xs text-gray-500 mt-1">
              Must contain uppercase, lowercase, number and special character (min 8)
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">Country</label>

            <select
              className="w-full border rounded-lg px-4 py-2 mt-1"
              value={form.country}
              onChange={(e) => handleCountryChange(e.target.value)}
            >

              <option value="">Select Country</option>

              {countries.map((c) => (
                <option key={c.isoCode} value={c.isoCode}>
                  {c.flag} {c.name}
                </option>
              ))}

            </select>
          </div>

          <div>
            <label className="text-sm font-medium">City</label>

            <select
              className="w-full border rounded-lg px-4 py-2 mt-1"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
            >

              <option value="">Select City</option>

              {cities.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}

            </select>
          </div>

          <div>
            <label className="text-sm font-medium">
              Cohort (optional)
            </label>

            <input
              className="w-full border rounded-lg px-4 py-2 mt-1"
              value={form.cohort}
              onChange={(e) => update("cohort", e.target.value)}
            />
          </div>

          <label className="flex items-center space-x-2 text-sm">

            <input
              type="checkbox"
              checked={form.consent}
              onChange={(e) => update("consent", e.target.checked)}
            />

            <span>
              I consent to data processing for the Digital Detox Challenge
            </span>

          </label>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
          >
            Create Account
          </button>

        </form>

        <p className="text-center mt-4 text-sm">

          Already have an account?

          <span
            className="text-blue-500 cursor-pointer ml-1"
            onClick={() => navigate("/")}
          >
            Login
          </span>

        </p>

      </div>

    </div>

  );

}