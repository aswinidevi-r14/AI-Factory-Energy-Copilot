import { useEffect, useState } from "react";

import {
  Zap,
  Factory,
  Activity,
  AlertTriangle,
  TrendingUp,
  IndianRupee,
  Bot,
  Settings,
} from "lucide-react";

import axios from "axios";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceDot,
} from "recharts";

import "./App.css";
const API_URL = "https://ai-factory-energy-copilot.onrender.com";
// Works locally and also supports deployment.
// For deployment, set VITE_API_URL to your deployed backend URL.
const API_BASE =
  import.meta.env.VITE_API_URL || "https://ai-factory-energy-copilot.onrender.com";

function StatCard({ icon: Icon, title, value, subtitle }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        <Icon size={22} />
      </div>

      <div>
        <p className="stat-title">{title}</p>
        <h2>{value}</h2>
        <p className="stat-subtitle">{subtitle}</p>
      </div>
    </div>
  );
}

function App() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [energyData, setEnergyData] = useState([]);
  const [period, setPeriod] = useState("hour");
  const [efficiency, setEfficiency] = useState(null);

  const [machineData, setMachineData] = useState([]);
  const [insights, setInsights] = useState(null);
  const [anomalies, setAnomalies] = useState([]);

  const [question, setQuestion] = useState("");
  const [chatAnswer, setChatAnswer] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const [selectedMachine, setSelectedMachine] = useState(null);

  // Scroll helper
  const scrollToSection = (id) => {
    const element = document.getElementById(id);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(
          `${API_BASE}/api/dashboard`
        );

        setDashboard(response.data);

        // Energy data
        const energyResponse = await axios.get(
          `${API_BASE}/api/energy?period=${period}`
        );

        setEnergyData(energyResponse.data);

        const totalEnergy = energyResponse.data.reduce(
          (sum, item) =>
            sum + Number(item.energy_kwh || 0),
          0
        );

        const totalProduction = energyResponse.data.reduce(
          (sum, item) =>
            sum + Number(item.production_units || 0),
          0
        );

        if (totalProduction > 0) {
          setEfficiency(totalEnergy / totalProduction);
        } else {
          setEfficiency(null);
        }

        // Machine data
        const machineResponse = await axios.get(
          `${API_BASE}/api/machines`
        );

        setMachineData(machineResponse.data);

        // Insights
        const insightResponse = await axios.get(
          `${API_BASE}/api/insights`
        );

        setInsights(insightResponse.data);

        // Anomalies
        const anomalyResponse = await axios.get(
          `${API_BASE}/api/anomalies`
        );

        setAnomalies(anomalyResponse.data);
      } catch (err) {
        console.error("Dashboard error:", err);
        setError(
          "Unable to connect to the factory backend."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [period]);

  // Ask AI Copilot
  const askCopilotWithQuestion = async (q) => {
    if (!q || !q.trim()) return;

    try {
      setChatLoading(true);
      setChatAnswer("");

      const response = await axios.get(
        `${API_BASE}/api/copilot/ask`,
        {
          params: {
            question: q,
          },
        }
      );

      setChatAnswer(
        response.data?.answer ||
          "No analysis was returned."
      );
    } catch (err) {
      console.error("Copilot error:", err);

      setChatAnswer(
        "Unable to analyze the factory data right now."
      );
    } finally {
      setChatLoading(false);
    }
  };

  const askCopilot = () => {
    if (!question.trim()) return;

    askCopilotWithQuestion(question);
  };

  const handleSuggestion = (q) => {
    setQuestion(q);
    askCopilotWithQuestion(q);
  };

  return (
    <div className="app">

      {/* ================= SIDEBAR ================= */}
      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">
            <Zap size={24} />
          </div>

          <div>
            <h2>Energy Copilot</h2>
            <span>Smart Manufacturing</span>
          </div>
        </div>

        <nav className="navigation">

          <div
            className="nav-item active"
            onClick={() =>
              scrollToSection("dashboard-section")
            }
          >
            <Activity size={19} />
            Dashboard
          </div>

          <div
            className="nav-item"
            onClick={() =>
              scrollToSection("machines-section")
            }
          >
            <Factory size={19} />
            Machines
          </div>

          <div
            className="nav-item"
            onClick={() =>
              scrollToSection("analytics-section")
            }
          >
            <TrendingUp size={19} />
            Analytics
          </div>

          <div
            className="nav-item"
            onClick={() =>
              scrollToSection("copilot-section")
            }
          >
            <Bot size={19} />
            AI Copilot
          </div>

          <div
            className="nav-item"
            onClick={() =>
              scrollToSection("alerts-section")
            }
          >
            <AlertTriangle size={19} />
            Alerts
          </div>

        </nav>

        <div className="sidebar-bottom">

          <div
            className="nav-item"
            onClick={() =>
              scrollToSection("settings-section")
            }
          >
            <Settings size={19} />
            Settings
          </div>

        </div>

      </aside>


      {/* ================= MAIN ================= */}
      <main className="main">

        {/* ================= HEADER ================= */}
        <header
          className="header"
          id="dashboard-section"
        >

          <div>
            <p className="eyebrow">
              FACTORY OPERATIONS
            </p>

            <h1>Energy Overview</h1>

            <p className="header-subtitle">
              Monitor energy, production and machine
              efficiency.
            </p>
          </div>

          <div className="factory-selector">

            <Factory size={18} />

            <span>
              Chennai Factory
            </span>

            <span
              style={{
                color: error
                  ? "#c0392b"
                  : "#19a974",
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              {error
                ? "● OFFLINE"
                : "● ONLINE"}
            </span>

          </div>

        </header>


        {/* ================= KPI CARDS ================= */}
        <section className="stats-grid">

          <StatCard
            icon={Zap}
            title="Today's Energy"
            value={
              loading
                ? "Loading..."
                : `${dashboard?.energy_kwh?.toLocaleString() || 0} kWh`
            }
            subtitle="From factory energy data"
          />

          <StatCard
            icon={Factory}
            title="Production"
            value={
              loading
                ? "Loading..."
                : `${dashboard?.production_units?.toLocaleString() || 0} units`
            }
            subtitle="Current factory output"
          />

          <StatCard
            icon={IndianRupee}
            title="Energy Cost"
            value={
              loading
                ? "Loading..."
                : `₹${dashboard?.energy_cost_inr?.toLocaleString() || 0}`
            }
            subtitle="Estimated energy cost"
          />

          <StatCard
            icon={Activity}
            title="Efficiency"
            value={
              loading
                ? "Loading..."
                : `${dashboard?.efficiency_units_per_kwh || 0} units/kWh`
            }
            subtitle="Production per kWh"
          />

        </section>


        {/* ================= EFFICIENCY ================= */}
        <section className="efficiency-card">

          <div className="efficiency-title">
            Energy Efficiency
          </div>

          <div className="efficiency-value">
            {efficiency !== null
              ? `${efficiency.toFixed(2)} kWh/unit`
              : "N/A"}
          </div>

          <div className="efficiency-subtitle">
            Energy consumed per production unit
          </div>

        </section>


        {/* ================= ANALYTICS GRID ================= */}
        <section
          className="content-grid"
          id="analytics-section"
        >

          {/* ENERGY CHART */}
          <div className="panel energy-panel">

            <div className="panel-header">

              <div>
                <h2>Energy Consumption</h2>

                <p>
                  Factory energy usage
                </p>
              </div>

              <span className="live-badge">
                ● LIVE
              </span>

            </div>


            {/* FILTERS */}
            <div className="chart-filters">

              <button
                className={
                  period === "hour"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setPeriod("hour")
                }
              >
                Hour
              </button>

              <button
                className={
                  period === "day"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setPeriod("day")
                }
              >
                Day
              </button>

              <button
                className={
                  period === "week"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setPeriod("week")
                }
              >
                Week
              </button>

            </div>


            <div className="chart-placeholder">

              <div className="chart-value">
                {loading
                  ? "Loading..."
                  : `${dashboard?.energy_kwh?.toLocaleString() || 0} kWh`}
              </div>

              <ResponsiveContainer
                width="100%"
                height={280}
              >

                <LineChart
                  data={energyData}
                  margin={{
                    top: 10,
                    right: 15,
                    left: 0,
                    bottom: 10,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="timestamp"
                    tick={{
                      fontSize: 10,
                    }}
                  />

                  <YAxis
                    tick={{
                      fontSize: 10,
                    }}
                  />

                  <Tooltip />

                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="energy_kwh"
                    name="Energy (kWh)"
                    strokeWidth={3}
                    dot={false}
                  />

                  <Line
                    type="monotone"
                    dataKey="production_units"
                    name="Production"
                    strokeWidth={3}
                    dot={false}
                  />

                  {anomalies
                    .slice(0, 20)
                    .map(
                      (
                        anomaly,
                        index
                      ) => (
                        <ReferenceDot
                          key={index}
                          x={
                            anomaly.timestamp
                          }
                          y={Number(
                            anomaly.energy_kwh
                          )}
                          r={6}
                          ifOverflow="visible"
                        />
                      )
                    )}

                </LineChart>

              </ResponsiveContainer>

            </div>

          </div>


          {/* AI INSIGHTS PANEL */}
          <div
            className="panel"
            id="alerts-section"
          >

            <div className="panel-header">

              <div>
                <h2>AI Insights</h2>

                <p>
                  Automated factory
                  intelligence
                </p>
              </div>

              <Bot size={24} />

            </div>


            <div className="insight warning">

              <AlertTriangle size={20} />

              <div>

                <strong>
                  {loading
                    ? "Analyzing factory..."
                    : `${anomalies.length} energy anomalies detected`}
                </strong>

                <p>
                  {anomalies.length > 0
                    ? `Latest anomaly detected on ${anomalies[0].machine_id} at ${Number(
                        anomalies[0]
                          .energy_kwh
                      ).toFixed(2)} kWh.`
                    : "No unusual energy patterns detected."}
                </p>

              </div>

            </div>


            <div className="insight success">

              <TrendingUp size={20} />

              <div>

                <strong>
                  Efficiency opportunity
                </strong>

                <p>
                  Production scheduling
                  could potentially reduce
                  unnecessary energy usage.
                </p>

              </div>

            </div>


            <button
              className="copilot-button"
              onClick={() =>
                scrollToSection(
                  "copilot-section"
                )
              }
            >
              <Bot size={18} />
              Ask Energy Copilot
            </button>

          </div>

        </section>


        {/* ================= MACHINE ANALYTICS ================= */}
        <section
          className="machine-section"
          id="machines-section"
        >

          <div className="section-title">
            Machine Analytics
          </div>

          <div className="machine-table">

            <div className="machine-row machine-header">

              <div>Machine</div>
              <div>Energy</div>
              <div>Production</div>
              <div>Efficiency</div>

            </div>


            {machineData.length === 0 ? (

              <div className="empty-state">
                No machine data available.
              </div>

            ) : (

              machineData.map(
                (machine) => (

                  <div
                    className={`machine-row ${
                      selectedMachine?.machine_id ===
                      machine.machine_id
                        ? "selected-machine"
                        : ""
                    }`}
                    key={
                      machine.machine_id
                    }
                    onClick={() =>
                      setSelectedMachine(
                        machine
                      )
                    }
                  >

                    <div>
                      {machine.machine_id}
                    </div>

                    <div>
                      {Number(
                        machine.energy_kwh
                      ).toLocaleString()}{" "}
                      kWh
                    </div>

                    <div>
                      {Number(
                        machine.production_units
                      ).toLocaleString()}
                    </div>

                    <div>
                      {Number(
                        machine.efficiency
                      ).toFixed(2)}{" "}
                      kWh/unit
                    </div>

                  </div>

                )
              )

            )}

          </div>

        </section>


        {/* ================= MACHINE DETAILS ================= */}
        {selectedMachine && (

          <section className="machine-detail-section">

            <div className="section-title">
              Machine Details
            </div>

            <div className="machine-detail-header">

              <div>

                <h2>
                  {selectedMachine.machine_id}
                </h2>

                <p>
                  {selectedMachine.machine_type ||
                    "Factory Machine"}
                </p>

              </div>

              <button
                className="close-machine"
                onClick={() =>
                  setSelectedMachine(null)
                }
              >
                Close
              </button>

            </div>


            <div className="machine-detail-grid">

              <div className="detail-card">

                <span>
                  Energy Consumption
                </span>

                <strong>
                  {Number(
                    selectedMachine.energy_kwh
                  ).toLocaleString()}{" "}
                  kWh
                </strong>

              </div>


              <div className="detail-card">

                <span>
                  Production
                </span>

                <strong>
                  {Number(
                    selectedMachine.production_units
                  ).toLocaleString()}{" "}
                  units
                </strong>

              </div>


              <div className="detail-card">

                <span>
                  Efficiency
                </span>

                <strong>
                  {Number(
                    selectedMachine.efficiency
                  ).toFixed(2)}{" "}
                  kWh/unit
                </strong>

              </div>


              <div className="detail-card">

                <span>
                  Status
                </span>

                <strong>
                  {selectedMachine.machine_status ||
                    "Running"}
                </strong>

              </div>

            </div>

          </section>

        )}


        {/* ================= FACTORY INSIGHTS ================= */}
        <section className="insights-section">

          <div className="section-title">
            Factory Insights
          </div>


          {insights && (

            <div className="insight-grid">

              {/* Highest energy */}
              <div className="insight-card warning">

                <div className="insight-icon">
                  ⚡
                </div>

                <div className="insight-content">

                  <div className="insight-label">
                    Highest Energy
                    Consumption
                  </div>

                  <div className="insight-value">
                    {
                      insights
                        ?.highest_energy_machine
                        ?.machine_id
                    }
                  </div>

                  <div className="insight-description">
                    Consumed{" "}
                    {Number(
                      insights
                        ?.highest_energy_machine
                        ?.energy_kwh || 0
                    ).toLocaleString()}{" "}
                    kWh.
                  </div>

                </div>

              </div>


              {/* Least efficient */}
              <div className="insight-card alert">

                <div className="insight-icon">
                  ⚠
                </div>

                <div className="insight-content">

                  <div className="insight-label">
                    Lowest Energy
                    Efficiency
                  </div>

                  <div className="insight-value">
                    {
                      insights
                        ?.least_efficient_machine
                        ?.machine_id
                    }
                  </div>

                  <div className="insight-description">
                    Uses{" "}
                    {Number(
                      insights
                        ?.least_efficient_machine
                        ?.efficiency || 0
                    ).toFixed(2)}{" "}
                    kWh per production
                    unit.
                  </div>

                </div>

              </div>


              {/* Overall */}
              <div className="insight-card">

                <div className="insight-icon">
                  📊
                </div>

                <div className="insight-content">

                  <div className="insight-label">
                    Overall Factory
                    Efficiency
                  </div>

                  <div className="insight-value">
                    {Number(
                      insights?.overall_efficiency ||
                        0
                    ).toFixed(2)}{" "}
                    kWh/unit
                  </div>

                  <div className="insight-description">
                    Average energy
                    consumption per
                    production unit.
                  </div>

                </div>

              </div>

            </div>

          )}

        </section>


        {/* ================= ANOMALIES ================= */}
        <section className="anomaly-section">

          <div className="section-title">
            Recent Energy Anomalies
          </div>


          {anomalies.length === 0 ? (

            <div className="no-anomalies">
              ✓ No anomalies detected
            </div>

          ) : (

            <div className="anomaly-list">

              {anomalies
                .slice(0, 5)
                .map(
                  (
                    anomaly,
                    index
                  ) => (

                    <div
                      className="anomaly-card"
                      key={`${anomaly.timestamp}-${anomaly.machine_id}-${index}`}
                    >

                      <div className="anomaly-icon">
                        <AlertTriangle
                          size={20}
                        />
                      </div>


                      <div className="anomaly-info">

                        <strong>
                          {
                            anomaly.machine_id
                          }
                        </strong>

                        <span>
                          {
                            anomaly.machine_type ||
                            "Factory Machine"
                          }
                        </span>

                        <p>
                          Energy:{" "}
                          {Number(
                            anomaly.energy_kwh
                          ).toFixed(2)}{" "}
                          kWh
                          {" • "}
                          Production:{" "}
                          {Number(
                            anomaly.production_units
                          ).toFixed(2)}{" "}
                          units
                        </p>

                      </div>


                      <div className="anomaly-time">

                        {new Date(
                          anomaly.timestamp
                        ).toLocaleString()}

                      </div>

                    </div>

                  )
                )}

            </div>

          )}

        </section>


        {/* ================= AI COPILOT ================= */}
        <section
          className="copilot-section"
          id="copilot-section"
        >

          <div className="copilot-header">

            <div>

              <div className="section-title">
                AI Factory Copilot
              </div>

              <div className="copilot-subtitle">
                Ask questions about your
                factory data
              </div>

            </div>

            <div className="copilot-badge">
              AI
            </div>

          </div>


          <div className="copilot-card">

            <div className="copilot-question">
              💬 Ask the Factory Copilot
            </div>


            <div className="copilot-input-row">

              <input
                type="text"
                value={question}
                onChange={(e) =>
                  setQuestion(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {

                  if (
                    e.key === "Enter" &&
                    !chatLoading
                  ) {
                    askCopilot();
                  }

                }}
                placeholder="Ask about energy, production or efficiency..."
              />


              <button
                onClick={askCopilot}
                disabled={chatLoading}
              >
                {chatLoading
                  ? "Analyzing..."
                  : "Ask"}
              </button>

            </div>


            {chatAnswer && (

              <div className="copilot-answer">

                <strong>
                  Copilot:
                </strong>

                <p>
                  {chatAnswer}
                </p>

              </div>

            )}


            <div className="copilot-suggestions">

              <button
                onClick={() =>
                  handleSuggestion(
                    "Which machine uses the most energy?"
                  )
                }
              >
                Highest energy
              </button>


              <button
                onClick={() =>
                  handleSuggestion(
                    "Which machine is least efficient?"
                  )
                }
              >
                Least efficient
              </button>


              <button
                onClick={() =>
                  handleSuggestion(
                    "How can we improve efficiency?"
                  )
                }
              >
                Improve efficiency
              </button>

            </div>

          </div>

        </section>


        {/* ================= MACHINE STATUS ================= */}
        <section className="panel machine-panel">

          <div className="panel-header">

            <div>

              <h2>
                Machine Status
              </h2>

              <p>
                Current machine energy
                performance
              </p>

            </div>


            <button
              className="view-button"
              onClick={() =>
                scrollToSection(
                  "machines-section"
                )
              }
            >
              View all machines
            </button>

          </div>


          <div className="machine-table">

            <div className="table-header">

              <span>Machine</span>
              <span>Status</span>
              <span>Energy</span>
              <span>Efficiency</span>

            </div>


            {machineData.length === 0 ? (

              <div className="empty-state">
                No machine data available.
              </div>

            ) : (

              machineData
                .slice(0, 4)
                .map((machine) => (

                  <div
                    className="machine-row"
                    key={`status-${machine.machine_id}`}
                  >

                    <span className="machine-name">

                      <Factory size={17} />

                      {machine.machine_id}

                    </span>


                    <span
                      className={`status ${
                        machine.machine_status ===
                        "Attention"
                          ? "warning-status"
                          : "normal"
                      }`}
                    >
                      {machine.machine_status ||
                        "Normal"}
                    </span>


                    <span>
                      {Number(
                        machine.energy_kwh
                      ).toLocaleString()}{" "}
                      kWh
                    </span>


                    <span>
                      {Number(
                        machine.efficiency
                      ).toFixed(2)}{" "}
                      kWh/unit
                    </span>

                  </div>

                ))

            )}

          </div>

        </section>


        {/* ================= BOTTOM COPILOT ================= */}
        <section className="copilot-banner">

          <div className="copilot-icon">
            <Bot size={26} />
          </div>


          <div>

            <h3>
              Ask your Energy Copilot
            </h3>

            <p>
              Ask questions about energy
              consumption, production,
              machines or optimization.
            </p>

          </div>


          <button
            onClick={() =>
              scrollToSection(
                "copilot-section"
              )
            }
          >
            Open Copilot →
          </button>

        </section>


        {/* ================= SETTINGS ANCHOR ================= */}
        <div
          id="settings-section"
          style={{
            height: "1px",
          }}
        />

      </main>

    </div>
  );
}

export default App;

