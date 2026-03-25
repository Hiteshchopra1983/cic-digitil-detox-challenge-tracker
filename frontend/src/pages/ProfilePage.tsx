import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { apiRequest } from "../lib/api";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const id = localStorage.getItem("participant_id");
    const data = await apiRequest(`/api/profile/${id}`);
    setProfile(data);
  }

  async function update() {
    await apiRequest("/api/profile/update", "POST", profile);
    alert("Profile updated");
  }

  async function deleteAccount() {
    const confirmDelete = confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );
    if (!confirmDelete) return;

    const id = localStorage.getItem("participant_id");
    await apiRequest(`/api/account/${id}`, "DELETE");
    localStorage.clear();
    alert("Account deleted");
    window.location.href = "/";
  }

  return (
    <Layout>
      <div className="mx-auto max-w-2xl">
        <header className="mb-4">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Profile</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Update your details. Email is fixed to your login.
          </p>
        </header>

        {profile && (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Full name</label>
                <input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Email</label>
                <input value={profile.email} disabled className="input cursor-not-allowed bg-slate-100" />
              </div>

              <div>
                <label className="label">Country</label>
                <input
                  value={profile.country}
                  onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">City</label>
                <input
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  className="input"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="label">Cohort</label>
                <input
                  value={profile.cohort}
                  onChange={(e) => setProfile({ ...profile, cohort: e.target.value })}
                  className="input"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-3">
              <button
                type="button"
                onClick={update}
                className="rounded-xl bg-[#064e3b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#053d2f]"
              >
                Save changes
              </button>

              <button
                type="button"
                onClick={deleteAccount}
                className="rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
              >
                Delete account
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
