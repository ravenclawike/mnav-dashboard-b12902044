"use client";

const BTC_HOLDINGS = 190000; // approx
const SHARES_OUTSTANDING = 17000000;

import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

// Register required components
ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
);

export default function Home() {

  const [btcPrices, setBtcPrices] = useState<number[][]>([]);
  const [stockPrices, setStockPrices] = useState<any[]>([]);

  useEffect(() => {
    // BTC
    fetch("https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30")
      .then(res => res.json())
      .then((data: any) => setBtcPrices(data.prices));

    // MSTR stock
    fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=MSTR&apikey=${process.env.API_KEY}`)
      .then(res => res.json())
      .then((data: any) => {
        if (!data || !data["Time Series (Daily)"]) {
          console.error("Alpha Vantage error:", data);
          return;
        }

        const series = data["Time Series (Daily)"];
        const parsed = Object.keys(series).map(date => ({
          date,
          price: parseFloat(series[date]["4. close"]),
        }));
        setStockPrices(parsed.reverse());
      });
  }, []);


  const mnavData = btcPrices.map((btc, i) => {
    const btcPrice = btc[1];
    const stock = stockPrices[i];

    if (!stock) return null;

    const marketCap = stock.price * SHARES_OUTSTANDING;
    const nav = BTC_HOLDINGS * btcPrice;
    const mnav = marketCap / nav;

    return {
      date: new Date(btc[0]).toLocaleDateString(),
      value: mnav,
    };
  }).filter(Boolean);
  const latest = mnavData.at(-1)?.value;
  // Prepare chart data
  const chartData = {
    labels: mnavData.map((d) => d.date),
    datasets: [
      {
        label: "MSTR mNAV",
        data: mnavData.map((d) => d.value),
      },
      {
        label: "BTC Price",
        data: btcPrices.slice(0, mnavData.length).map(p => p[1]),
        yAxisID: "y1",
      },
    ],
  };
  const options = {
    scales: {
      y: { type: "linear", position: "left" },
      y1: { type: "linear", position: "right" },
    },
  };

  return (
    <div style={{ width: "900px", margin: "auto", fontFamily: "Arial" }}>
      <h1>MicroStrategy mNAV Dashboard</h1>
      <p>Indicator: Modified Net Asset Value (mNAV)</p>
      <Line data={chartData} options={options} />
      <h2>Latest mNAV: {latest?.toFixed(2)}</h2>
      <p>
        {latest && latest > 1.5
          ? "Market is pricing a strong premium (potential overvaluation)"
          : latest && latest < 1
          ? "Trading at discount (possible undervaluation)"
          : "Near fair value"}
      </p>
      <h3>What is mNAV?</h3>
      <p>
        mNAV measures the ratio between a company's market value and the value of its Bitcoin holdings.
      </p>

      <h3>Why it matters</h3>
      <p>
        It shows whether the market values the company at a premium or discount relative to its BTC assets.
      </p>
    </div>
  );
}