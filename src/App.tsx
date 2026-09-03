import { useState } from "react";

const PROVIDERS = ["All Clouds", "AWS", "Azure", "GCP"] as const;
type Provider = (typeof PROVIDERS)[number];

const PROVIDER_COLORS: Record<string, string> = {
  AWS: "#FF9900",
  Azure: "#0089D6",
  GCP: "#4285F4",
};

const riskData: Record<Provider, { score: number; critical: number; high: number; medium: number; low: number; assets: number; compliance: number }> = {
  "All Clouds": { score: 61, critical: 14, high: 37, medium: 82, low: 204, assets: 8412, compliance: 73 },
  AWS: { score: 58, critical: 7, high: 19, medium: 41, low: 98, assets: 4210, compliance: 69 },
  Azure: { score: 67, critical: 4, high: 11, medium: 28, low: 67, assets: 2873, compliance: 78 },
  GCP: { score: 71, critical: 3, high: 7, medium: 13, low: 39, assets: 1329, compliance: 82 },
};

const allFindings = [
  { id: "F-0042", provider: "AWS", service: "S3", resource: "prod-data-backup", severity: "critical", rule: "Public bucket ACL enabled", region: "us-east-1", age: "2d" },
  { id: "F-0043", provider: "Azure", service: "Storage", resource: "stgprodlogs001", severity: "critical", rule: "Storage account allows all networks", region: "eastus", age: "5d" },
  { id: "F-0044", provider: "GCP", service: "IAM", resource: "sa-cicd@prod.iam", severity: "critical", rule: "Service account has owner role", region: "global", age: "1d" },
  { id: "F-0051", provider: "AWS", service: "EC2", resource: "i-0a3f9c2d1e84b5f6a", severity: "high", rule: "Security group allows 0.0.0.0/0 on port 22", region: "eu-west-1", age: "8d" },
  { id: "F-0052", provider: "AWS", service: "RDS", resource: "aurora-prod-cluster", severity: "high", rule: "Automated backups disabled", region: "us-west-2", age: "12d" },
  { id: "F-0053", provider: "Azure", service: "SQL", resource: "sql-prod-westeu", severity: "high", rule: "Transparent data encryption off", region: "westeurope", age: "3d" },
  { id: "F-0061", provider: "GCP", service: "GKE", resource: "prod-k8s-cluster-1", severity: "medium", rule: "Master authorized networks not configured", region: "us-central1", age: "15d" },
  { id: "F-0062", provider: "AWS", service: "CloudTrail", resource: "ct-prod-us-east", severity: "medium", rule: "Log file validation disabled", region: "us-east-1", age: "21d" },
  { id: "F-0063", provider: "Azure", service: "KeyVault", resource: "kv-prod-secrets", severity: "medium", rule: "Soft delete not enabled", region: "eastus", age: "4d" },
  { id: "F-0071", provider: "AWS", service: "IAM", resource: "arn:aws:iam::123:user/svc-deploy", severity: "low", rule: "Access key not rotated in 90+ days", region: "global", age: "33d" },
  { id: "F-0072", provider: "GCP", service: "Logging", resource: "org-sink-prod", severity: "low", rule: "Audit log sink filter too permissive", region: "global", age: "7d" },
];

const complianceFrameworks = [
  { name: "CIS v1.4", aws: 72, azure: 81, gcp: 88 },
  { name: "SOC 2", aws: 65, azure: 74, gcp: 79 },
  { name: "ISO 27001", aws: 70, azure: 77, gcp: 84 },
  { name: "PCI DSS", aws: 58, azure: 69, gcp: 76 },
  { name: "NIST 800-53", aws: 63, azure: 72, gcp: 80 },
];

const threatFeed = [
  { time: "09:14", provider: "AWS", type: "Anomalous API", detail: "237 DescribeInstances calls from IP 185.220.101.x", severity: "high" },
  { time: "09:02", provider: "Azure", type: "Impossible Travel", detail: "Login from US then DE within 4 min for user j.park@acme.io", severity: "critical" },
  { time: "08:51", provider: "GCP", type: "Privilege Escalation", detail: "setIamPolicy called on project prod by sa-cicd", severity: "critical" },
  { time: "08:30", provider: "AWS", type: "Data Exfiltration", detail: "S3 GetObject spike — 18 GB in 12 min from prod-data-backup", severity: "high" },
  { time: "07:44", provider: "Azure", type: "Brute Force", detail: "48 failed logins on admin@acme.io from 91.108.56.x", severity: "medium" },
  { time: "07:12", provider: "GCP", type: "Cryptomining", detail: "Unusual CPU pattern on gke-prod-node-pool-3", severity: "medium" },
];

const inventoryBreakdown = [
  { label: "Compute", count: 1842, pct: 22 },
  { label: "Storage", count: 2310, pct: 27 },
  { label: "Networking", count: 1687, pct: 20 },
  { label: "IAM", count: 956, pct: 11 },
  { label: "Database", count: 743, pct: 9 },
  { label: "Serverless", count: 512, pct: 6 },
  { label: "Other", count: 362, pct: 5 },
];

const inventoryColors = ["#22d3ee", "#818cf8", "#34d399", "#fb923c", "#f472b6", "#a78bfa", "#64748b"];

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-red-500/15 text-red-400 border border-red-500/30",
  high: "bg-orange-500/15 text-orange-400 border border-orange-500/30",
  medium: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  low: "bg-slate-500/15 text-slate-400 border border-slate-500/30",
};

function scoreColor(score: number) {
  if (score >= 80) return "#34d399";
  if (score >= 60) return "#fb923c";
  return "#f87171";
}

function RiskGauge({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const arc = circ * 0.75;
  const filled = arc * (score / 100);
  const color = scoreColor(score);
  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 100 }}>
      <svg width="140" height="110" viewBox="0 0 140 110">
        <circle cx="70" cy="80" r={r} fill="none" stroke="#1e293b" strokeWidth="10"
          strokeDasharray={`${arc} ${circ}`} strokeDashoffset={0}
          strokeLinecap="round" transform="rotate(-225 70 80)" />
        <circle cx="70" cy="80" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${filled} ${circ}`} strokeDashoffset={0}
          strokeLinecap="round" transform="rotate(-225 70 80)"
          style={{ transition: "stroke-dasharray 0.8s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingTop: 24 }}>
        <span className="font-mono text-3xl font-bold" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>{score}</span>
        <span className="text-xs text-slate-500 mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

function DonutChart() {
  const size = 120;
  const r = 42;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const segments = inventoryBreakdown.map((item, i) => {
    const dash = (item.pct / 100) * circ;
    const seg = (
      <circle key={i} cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={inventoryColors[i]} strokeWidth="18"
        strokeDasharray={`${dash - 1.5} ${circ}`}
        strokeDashoffset={-offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
    );
    offset += dash;
    return seg;
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth="18" />
      {segments}
    </svg>
  );
}

function ComplianceBar({ pct, provider }: { pct: number; provider: string }) {
  const color = PROVIDER_COLORS[provider];
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs w-8 text-right" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>{pct}%</span>
    </div>
  );
}

export default function App() {
  const [activeProvider, setActiveProvider] = useState<Provider>("All Clouds");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"findings" | "threats">("findings");

  const data = riskData[activeProvider];

  const filteredFindings = allFindings.filter(f => {
    const providerMatch = activeProvider === "All Clouds" || f.provider === activeProvider;
    const sevMatch = severityFilter === "all" || f.severity === severityFilter;
    return providerMatch && sevMatch;
  });

  return (
    <div className="min-h-full bg-[#080d1a] text-slate-200 flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Top Nav */}
      <header className="border-b border-slate-800/80 px-6 py-3 flex items-center justify-between sticky top-0 z-30 bg-[#080d1a]/95 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" stroke="#22d3ee" strokeWidth="1.2" />
              <path d="M7 5L9.5 6.5V9.5L7 11L4.5 9.5V6.5L7 5Z" fill="#22d3ee" fillOpacity="0.4" />
            </svg>
          </div>
          <span className="font-semibold text-sm tracking-wide text-slate-100" style={{ fontFamily: "'Outfit', sans-serif", letterSpacing: "0.05em" }}>CLOUDSENTINEL</span>
          <span className="text-slate-700 text-xs mx-1">|</span>
          <span className="text-xs text-slate-500">Posture Management</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Provider tabs */}
          <div className="flex items-center bg-slate-900/80 border border-slate-800 rounded-lg p-0.5 gap-0.5">
            {PROVIDERS.map(p => (
              <button key={p}
                onClick={() => setActiveProvider(p)}
                className={`px-3 py-1 text-xs rounded-md transition-all duration-200 font-medium ${activeProvider === p ? "bg-slate-700 text-slate-100" : "text-slate-500 hover:text-slate-300"}`}
                style={{ fontFamily: p !== "All Clouds" ? "'JetBrains Mono', monospace" : "inherit" }}>
                {p !== "All Clouds" && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: PROVIDER_COLORS[p] }} />
                )}
                {p}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-xs text-red-400 font-medium">Live · {data.critical} Critical</span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-5 overflow-auto space-y-4">

        {/* KPI Row */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {/* Risk Score */}
          <div className="col-span-2 lg:col-span-1 bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <RiskGauge score={data.score} />
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Risk Score</div>
              <div className="text-sm font-medium" style={{ color: scoreColor(data.score) }}>
                {data.score >= 80 ? "Healthy" : data.score >= 60 ? "Moderate Risk" : "High Risk"}
              </div>
              <div className="text-xs text-slate-600 mt-1">Updated 2 min ago</div>
            </div>
          </div>

          {/* Findings breakdown */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-500 uppercase tracking-widest mb-3">Findings</div>
            <div className="space-y-2">
              {[
                { label: "Critical", val: data.critical, color: "#f87171" },
                { label: "High", val: data.high, color: "#fb923c" },
                { label: "Medium", val: data.medium, color: "#fbbf24" },
                { label: "Low", val: data.low, color: "#64748b" },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-xs text-slate-400">{label}</span>
                  </div>
                  <span className="font-mono text-sm font-semibold" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Assets */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-500 uppercase tracking-widest mb-3">Assets Monitored</div>
            <div className="text-3xl font-bold text-slate-100 mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {data.assets.toLocaleString()}
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {(activeProvider === "All Clouds" ? ["AWS", "Azure", "GCP"] : [activeProvider]).map(p => (
                <span key={p} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: PROVIDER_COLORS[p] + "20", color: PROVIDER_COLORS[p], fontFamily: "'JetBrains Mono', monospace" }}>{p}</span>
              ))}
            </div>
          </div>

          {/* Compliance */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">Avg. Compliance</div>
            <div className="text-3xl font-bold mb-1" style={{ fontFamily: "'JetBrains Mono', monospace", color: scoreColor(data.compliance) }}>
              {data.compliance}%
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${data.compliance}%`, backgroundColor: scoreColor(data.compliance) }} />
            </div>
            <div className="text-xs text-slate-600 mt-1.5">across 5 frameworks</div>
          </div>
        </div>

        {/* Main content row */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">

          {/* Findings / Threats tabs — 2/3 width */}
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 pt-3 pb-0">
              <div className="flex gap-1">
                {(["findings", "threats"] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`text-xs px-3 py-2 capitalize font-medium transition-colors border-b-2 ${activeTab === tab ? "border-cyan-500 text-cyan-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
                    {tab === "findings" ? "Misconfigurations" : "Threat Signals"}
                  </button>
                ))}
              </div>
              {activeTab === "findings" && (
                <div className="flex items-center gap-1 pb-2">
                  {["all", "critical", "high", "medium", "low"].map(s => (
                    <button key={s} onClick={() => setSeverityFilter(s)}
                      className={`text-xs px-2 py-0.5 rounded-md capitalize transition-colors ${severityFilter === s ? "bg-slate-700 text-slate-200" : "text-slate-600 hover:text-slate-400"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {activeTab === "findings" ? (
              <div className="overflow-auto flex-1" style={{ maxHeight: 340 }}>
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-900/95 backdrop-blur">
                    <tr className="border-b border-slate-800">
                      {["ID", "Provider", "Service", "Resource", "Rule", "Severity", "Region", "Age"].map(h => (
                        <th key={h} className="text-left text-slate-600 font-medium px-4 py-2 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFindings.map((f, i) => (
                      <tr key={f.id} className={`border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors cursor-pointer ${i % 2 === 0 ? "" : "bg-slate-900/30"}`}>
                        <td className="px-4 py-2.5 font-mono text-cyan-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{f.id}</td>
                        <td className="px-4 py-2.5">
                          <span className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: PROVIDER_COLORS[f.provider] + "20", color: PROVIDER_COLORS[f.provider], fontFamily: "'JetBrains Mono', monospace" }}>{f.provider}</span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-400">{f.service}</td>
                        <td className="px-4 py-2.5 text-slate-300 font-mono max-w-[140px] truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{f.resource}</td>
                        <td className="px-4 py-2.5 text-slate-400 max-w-[180px] truncate">{f.rule}</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${SEVERITY_STYLES[f.severity]}`}>{f.severity}</span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{f.region}</td>
                        <td className="px-4 py-2.5 text-slate-600 font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{f.age}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredFindings.length === 0 && (
                  <div className="flex items-center justify-center py-12 text-slate-600 text-sm">No findings match current filters</div>
                )}
              </div>
            ) : (
              <div className="overflow-auto flex-1 divide-y divide-slate-800/60" style={{ maxHeight: 340 }}>
                {threatFeed.filter(t => activeProvider === "All Clouds" || t.provider === activeProvider).map((t, i) => (
                  <div key={i} className="px-4 py-3 flex items-start gap-3 hover:bg-slate-800/30 transition-colors cursor-pointer">
                    <span className="text-slate-600 font-mono text-xs mt-0.5 shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{t.time}</span>
                    <span className="px-1.5 py-0.5 rounded text-xs font-mono shrink-0" style={{ backgroundColor: PROVIDER_COLORS[t.provider] + "20", color: PROVIDER_COLORS[t.provider], fontFamily: "'JetBrains Mono', monospace" }}>{t.provider}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-300 text-xs font-medium">{t.type}</div>
                      <div className="text-slate-500 text-xs mt-0.5 truncate">{t.detail}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs capitalize shrink-0 ${SEVERITY_STYLES[t.severity]}`}>{t.severity}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-slate-800 px-4 py-2 flex items-center justify-between">
              <span className="text-xs text-slate-600">
                {activeTab === "findings" ? `${filteredFindings.length} findings` : `${threatFeed.filter(t => activeProvider === "All Clouds" || t.provider === activeProvider).length} signals in last 2h`}
              </span>
              <button className="text-xs text-cyan-600 hover:text-cyan-400 transition-colors">View all →</button>
            </div>
          </div>

          {/* Right column: inventory + compliance */}
          <div className="flex flex-col gap-3">

            {/* Resource Inventory */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-500 uppercase tracking-widest mb-3">Resource Inventory</div>
              <div className="flex items-center gap-4">
                <DonutChart />
                <div className="flex-1 space-y-1.5">
                  {inventoryBreakdown.map((item, i) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: inventoryColors[i] }} />
                        <span className="text-xs text-slate-400">{item.label}</span>
                      </div>
                      <span className="text-xs font-mono text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{item.count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Compliance by framework */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex-1">
              <div className="text-xs text-slate-500 uppercase tracking-widest mb-3">Compliance Coverage</div>
              <div className="flex items-center gap-3 mb-3">
                {["AWS", "Azure", "GCP"].map(p => (
                  <div key={p} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PROVIDER_COLORS[p] }} />
                    <span className="text-xs text-slate-500">{p}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {complianceFrameworks.filter(f => {
                  if (activeProvider === "All Clouds") return true;
                  return true; // show all frameworks, values filtered below
                }).map(f => (
                  <div key={f.name}>
                    <div className="text-xs text-slate-400 mb-1.5">{f.name}</div>
                    <div className="space-y-1">
                      {(activeProvider === "All Clouds" ? ["AWS", "Azure", "GCP"] : [activeProvider]).map(p => (
                        <ComplianceBar key={p} pct={f[p.toLowerCase() as "aws" | "azure" | "gcp"]} provider={p} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Provider posture cards */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {["AWS", "Azure", "GCP"].filter(p => activeProvider === "All Clouds" || p === activeProvider).map(p => {
            const d = riskData[p as Provider];
            const total = d.critical + d.high + d.medium + d.low;
            return (
              <div key={p} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PROVIDER_COLORS[p] }} />
                    <span className="text-sm font-semibold text-slate-200" style={{ fontFamily: "'Outfit', sans-serif" }}>{p}</span>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: scoreColor(d.score) + "20", color: scoreColor(d.score), fontFamily: "'JetBrains Mono', monospace" }}>Score: {d.score}</span>
                </div>

                {/* Stacked bar */}
                <div className="flex rounded-full overflow-hidden h-1.5 mb-2 gap-px">
                  {[
                    { val: d.critical, color: "#f87171" },
                    { val: d.high, color: "#fb923c" },
                    { val: d.medium, color: "#fbbf24" },
                    { val: d.low, color: "#334155" },
                  ].map(({ val, color }, i) => (
                    <div key={i} style={{ width: `${(val / total) * 100}%`, backgroundColor: color }} />
                  ))}
                </div>

                <div className="grid grid-cols-4 gap-1 mt-3">
                  {[
                    { label: "Critical", val: d.critical, color: "#f87171" },
                    { label: "High", val: d.high, color: "#fb923c" },
                    { label: "Medium", val: d.medium, color: "#fbbf24" },
                    { label: "Low", val: d.low, color: "#64748b" },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="text-center">
                      <div className="text-base font-bold font-mono" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>{val}</div>
                      <div className="text-[10px] text-slate-600">{label}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-500">{d.assets.toLocaleString()} assets</span>
                  <span className="text-xs text-slate-500">Compliance <span className="font-mono" style={{ color: scoreColor(d.compliance), fontFamily: "'JetBrains Mono', monospace" }}>{d.compliance}%</span></span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 px-6 py-2 flex items-center justify-between text-xs text-slate-700">
        <span>CloudSentinel v2.4.1 · Data refreshed 2 min ago</span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          All collectors healthy
        </span>
      </footer>
    </div>
  );
}
