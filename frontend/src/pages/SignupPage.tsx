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

      setError("You must consent to participate.");

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

    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-700 p-4">

      <div className="bg-white/95 backdrop-blur shadow-2xl rounded-2xl p-6 md:p-10 w-full max-w-lg border border-white/70">

        <h1 className="text-2xl md:text-3xl font-bold text-center text-emerald-900 mb-8">
          Join Digital Detox Challenge
        </h1>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Full Name */}
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Full Name
            </label>

            <input
              className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 focus:ring-2 focus:ring-green-400"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Email Address
            </label>

            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 focus:ring-2 focus:ring-green-400"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Password
            </label>

            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 focus:ring-2 focus:ring-green-400"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
            />

            <p className="text-xs text-gray-500 mt-1">
              Must contain uppercase, lowercase, number and special character (min 8)
            </p>
          </div>

          {/* Country */}
          <div>

            <label className="text-sm font-semibold text-gray-700">
              Country
            </label>

            {form.country && (

              <div className="flex items-center space-x-2 mt-2">

                <img
                  src={`https://flagcdn.com/w40/${form.country.toLowerCase()}.png`}
                  alt="flag"
                  className="w-6 h-4 rounded"
                />

                <span className="text-sm text-gray-600">
                  Selected Country
                </span>

              </div>

            )}

            <select
              className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 focus:ring-2 focus:ring-green-400"
              value={form.country}
              onChange={(e) => handleCountryChange(e.target.value)}
            >

              <option value="">Select Country</option>

              {countries.map((c) => (

                <option key={c.isoCode} value={c.isoCode}>
                  {c.name}
                </option>

              ))}

            </select>

          </div>

          {/* City */}
          <div>

            <label className="text-sm font-semibold text-gray-700">
              City
            </label>

            <select
              className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 focus:ring-2 focus:ring-green-400"
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

          {/* Cohort */}
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Cohort (optional)
            </label>

            <input
              className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 focus:ring-2 focus:ring-green-400"
              value={form.cohort}
              onChange={(e) => update("cohort", e.target.value)}
            />
          </div>

          {/* Consent */}
          <label className="flex items-start space-x-2 text-sm text-gray-700">

            <input
              type="checkbox"
              checked={form.consent}
              onChange={(e) => update("consent", e.target.checked)}
            />

            <span>
              I consent to data processing for the Digital Detox Challenge
            </span>

          </label>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-primary hover:bg-green-700 transition text-white font-semibold py-3 rounded-lg shadow-md"
          >
            Create Account
          </button>

        </form>

        <p className="text-center mt-6 text-sm text-gray-600">

          Already have an account?

          <span
            className="text-green-600 cursor-pointer ml-1 font-semibold"
            onClick={() => navigate("/")}
          >
            Login
          </span>

        </p>

      </div>

    </div>
  );
}