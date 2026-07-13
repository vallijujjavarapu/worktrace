import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import api from "../../api/axios";

export default function BenchTeams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/teams/bench")
      .then((res) => setTeams(res.data))
      .catch((err) => console.error("Failed to load bench teams:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Teams on Bench</h2>
        <p className="text-gray-500 mb-6">
          Teams not currently assigned to any active project
        </p>

        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-100">
            No teams currently on bench — everyone's staffed.
          </div>
        ) : (
          <div className="space-y-3">
            {teams.map((team) => (
              <div
                key={team.id}
                className="bg-white rounded-xl px-6 py-4 shadow-sm border border-gray-100 transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                <p className="font-medium text-gray-900">{team.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {team.department_name || "No department"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}