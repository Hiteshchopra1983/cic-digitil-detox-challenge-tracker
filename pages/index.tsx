import Link from "next/link";

export default function Home() {
  return (
    <div style={{padding:"40px",fontFamily:"Arial"}}>
      <h1>CIC Digital Detox Challenge</h1>

      <p>Prototype tracker for the CIC Digital Detox initiative.</p>

      <ul>
        <li><Link href="/register">Register Participant</Link></li>
        <li><Link href="/baseline">Submit Baseline</Link></li>
        <li><Link href="/weekly">Weekly Progress</Link></li>
        <li><Link href="/admin">Admin Dashboard</Link></li>
      </ul>
    </div>
  );
}