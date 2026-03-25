import { useEffect,useState } from "react";
import { getParticipantStats } from "../lib/api";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function ParticipantDashboardPage(){

  const [co2,setCo2] = useState(0);
  const [gb,setGb] = useState(0);
  const [baselineGb,setBaselineGb] = useState(0);
  const [storagePct,setStoragePct] = useState<number | null>(null);
  const [rank,setRank] = useState<number|null>(null);
  const [score,setScore] = useState(0);

  const [chart,setChart] = useState<any[]>([]);

  const [impact,setImpact] = useState({
    car_km:0,
    trees:0,
    phone_charges:0
  });

  useEffect(()=>{

    async function load(){

      const stats = await getParticipantStats();

      setCo2(Number(stats.co2_saved));
      setGb(Number(stats.gb_deleted));
      setBaselineGb(Number(stats.baseline_storage_gb ?? 0));
      setStoragePct(
        stats.storage_reduction_percent === null || stats.storage_reduction_percent === undefined
          ? null
          : Number(stats.storage_reduction_percent)
      );
      setRank(stats.rank);
      setScore(stats.detox_score);

      setImpact(stats.impact);
      setChart(stats.weeklyChart);

    }

    load();

  },[]);

  return(

    <div className="min-h-screen bg-gray-50 p-10">

      <h1 className="text-3xl font-bold mb-8">
        My Digital Detox Impact
      </h1>

      {/* TOP METRICS */}

      <div className="grid grid-cols-4 gap-6 mb-10">

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">

          <h2 className="text-gray-600">
            CO₂ Saved
          </h2>

          <p className="text-3xl font-bold">
            {co2.toFixed(2)} kg
          </p>

        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">

          <h2 className="text-gray-600">
            Storage reduced
          </h2>

          <p className="text-3xl font-bold tabular-nums">
            {Number(gb).toFixed(1)} GB
          </p>
          {storagePct !== null && baselineGb > 0 ? (
            <p className="text-sm text-gray-600 mt-2 tabular-nums">
              {storagePct.toFixed(2)}% of baseline footprint ({baselineGb.toFixed(1)} GB)
            </p>
          ) : (
            <p className="text-sm text-gray-500 mt-2">vs baseline device + cloud storage</p>
          )}

        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">

          <h2 className="text-gray-600">
            Leaderboard Rank
          </h2>

          <p className="text-3xl font-bold">
            {rank ?? "-"}
          </p>

        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">

          <h2 className="text-gray-600">
            Detox Score
          </h2>

          <p className="text-3xl font-bold">
            {score}/100
          </p>

        </div>

      </div>

      {/* IMPACT */}

      <div className="grid grid-cols-3 gap-6 mb-10">

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">

          <h2>Driving Avoided</h2>

          <p className="text-2xl">
            {impact.car_km} km
          </p>

        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">

          <h2>Trees Equivalent</h2>

          <p className="text-2xl">
            {impact.trees}
          </p>

        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">

          <h2>Phone Charges Avoided</h2>

          <p className="text-2xl">
            {impact.phone_charges}
          </p>

        </div>

      </div>

      {/* PROGRESS GRAPH */}

      <h2 className="text-2xl mb-4">
        Weekly CO₂ Reduction
      </h2>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">

        <ResponsiveContainer width="100%" height="100%">

          <LineChart data={chart}>

            <XAxis dataKey="week"/>

            <YAxis/>

            <Tooltip/>

            <Line
              type="monotone"
              dataKey="co2"
              stroke="#16a34a"
              strokeWidth={3}
            />

          </LineChart>

        </ResponsiveContainer>

      </div>

    </div>

  );

}