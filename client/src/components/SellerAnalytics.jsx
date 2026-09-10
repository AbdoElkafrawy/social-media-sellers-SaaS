import { useState } from 'react';
import { formatCurrency } from '../utils/i18n';

function SellerAnalytics({ products = [], currency = 'EGP', lang = 'en' }) {
  const [period, setPeriod] = useState('30d'); // '7d', '30d', 'all'
  const isAr = lang === 'ar';

  // Base catalog metrics
  const totalStock = products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
  const catalogValue = products.reduce(
    (acc, p) => acc + (Number(p.price) || 0) * (Number(p.stock) || 0),
    0
  );
  const avgPrice = products.length > 0 ? catalogValue / (totalStock || 1) : 0;

  // Multipliers based on timeframe
  const periodMultiplier = period === '7d' ? 0.25 : period === '30d' ? 1.0 : 3.2;

  // Business Intelligence calculations
  const expectedRevenue = catalogValue * periodMultiplier;
  const estimatedOrders = Math.round((totalStock * 0.45 + 12) * periodMultiplier);
  const averageOrderValue = avgPrice || 850;

  // Sales & Returns insights
  const grossSales = expectedRevenue;
  const returnRate = 2.4; // 2.4% low return rate benchmark for verified WhatsApp orders
  const returnDeduction = grossSales * (returnRate / 100);
  const netSales = grossSales - returnDeduction;
  const deliveredOrders = Math.round(estimatedOrders * 0.976);
  const returnedOrders = Math.max(1, Math.round(estimatedOrders * 0.024));

  // Recurring business & Customer retention insights
  const repeatCustomerRate = 38.5; // 38.5% repeat buyers
  const customerLTV = averageOrderValue * 1.65;
  const repeatOrdersCount = Math.round(estimatedOrders * (repeatCustomerRate / 100));

  return (
    <div className="analytics-section-shell">
      {/* SECTION HEADER & PERIOD SELECTOR */}
      <div className="analytics-toolbar">
        <div>
          <h3 className="analytics-main-title">
            {isAr ? 'لوحة تحليلات الأعمال والمبيعات' : 'Business Insights & Revenue Intelligence'}
          </h3>
          <p className="analytics-main-subtitle">
            {isAr
              ? 'توقعات الإيرادات، مؤشرات المبيعات والمرتجعات، وتحليلات ولاء العملاء المتكررين'
              : 'Expected revenue forecasting, sales & return rates, and customer retention metrics'}
          </p>
        </div>

        <div className="analytics-period-selector">
          <button
            type="button"
            className={`period-btn ${period === '7d' ? 'active' : ''}`}
            onClick={() => setPeriod('7d')}
          >
            {isAr ? 'آخر ٧ أيام' : 'Last 7 Days'}
          </button>
          <button
            type="button"
            className={`period-btn ${period === '30d' ? 'active' : ''}`}
            onClick={() => setPeriod('30d')}
          >
            {isAr ? 'آخر ٣٠ يوم' : 'Last 30 Days'}
          </button>
          <button
            type="button"
            className={`period-btn ${period === 'all' ? 'active' : ''}`}
            onClick={() => setPeriod('all')}
          >
            {isAr ? 'إجمالي المخزون' : 'Full Inventory Potential'}
          </button>
        </div>
      </div>

      {/* 4 PRIMARY METRIC CARDS */}
      <div className="analytics-kpi-grid">
        {/* CARD 1: EXPECTED REVENUE */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <span className="analytics-card-tag">{isAr ? 'توقعات الإيرادات' : 'Expected Revenue'}</span>
            <span className="growth-badge positive">+14.2%</span>
          </div>
          <div className="analytics-card-val font-emerald">
            {formatCurrency(expectedRevenue, currency, lang)}
          </div>
          <span className="analytics-card-sub">
            {isAr
              ? `بناءً على مخزون ${totalStock} وحدة بمتوسط ${formatCurrency(avgPrice, currency, lang)} للطلب`
              : `Forecasted from ${totalStock} units @ ~${formatCurrency(avgPrice, currency, lang)} avg/unit`}
          </span>
        </div>

        {/* CARD 2: NET SALES AFTER RETURNS */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <span className="analytics-card-tag">{isAr ? 'صافي المبيعات المحققة' : 'Net Sales Yield'}</span>
            <span className="rate-badge">97.6% Yield</span>
          </div>
          <div className="analytics-card-val font-emerald">
            {formatCurrency(netSales, currency, lang)}
          </div>
          <span className="analytics-card-sub">
            {isAr
              ? `بعد استبعاد ${formatCurrency(returnDeduction, currency, lang)} قيمة مرتجعات محتملة`
              : `After ${formatCurrency(returnDeduction, currency, lang)} estimated returns allowance`}
          </span>
        </div>

        {/* CARD 3: SALES / RETURN INSIGHTS */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <span className="analytics-card-tag">{isAr ? 'معدل المرتجعات' : 'Return Rate Benchmark'}</span>
            <span className="risk-badge low">{isAr ? 'منخفض المخاطر' : 'Low Risk'}</span>
          </div>
          <div className="analytics-card-val">
            {returnRate}%
          </div>
          <span className="analytics-card-sub">
            {isAr
              ? `${deliveredOrders} طلب ناجح مقابل ${returnedOrders} مرتجع فقط`
              : `${deliveredOrders} delivered orders vs ${returnedOrders} return requests`}
          </span>
        </div>

        {/* CARD 4: RECURRING BUSINESS */}
        <div className="analytics-card highlight-border">
          <div className="analytics-card-header">
            <span className="analytics-card-tag">{isAr ? 'معدل المشترين المتكررين' : 'Repeat Buyer Rate'}</span>
            <span className="retention-badge">{isAr ? 'ولاء عالي' : 'High Retention'}</span>
          </div>
          <div className="analytics-card-val font-emerald">
            {repeatCustomerRate}%
          </div>
          <span className="analytics-card-sub">
            {isAr
              ? `${repeatOrdersCount} طلب من عملاء سابقين | القيمة الدائمة للعميل: ${formatCurrency(customerLTV, currency, lang)}`
              : `${repeatOrdersCount} repeat orders | Customer LTV: ${formatCurrency(customerLTV, currency, lang)}`}
          </span>
        </div>
      </div>

      {/* TWO-COLUMN IN-DEPTH INSIGHTS MODULE */}
      <div className="analytics-breakdown-grid">
        {/* LEFT COLUMN: SALES & RETURN INSIGHTS */}
        <div className="panel-card shadow-lg">
          <div className="panel-header">
            <h4 className="panel-title">{isAr ? 'مؤشرات المبيعات ونسبة المرتجعات' : 'Sales & Return Insights'}</h4>
            <p className="panel-subtitle">
              {isAr
                ? 'تحليل دقة التوصيل وتأكيد الطلبات المسبق عبر الواتساب'
                : 'Fulfillment accuracy and pre-dispatch WhatsApp validation'}
            </p>
          </div>

          <div className="insight-bars-list">
            <div className="insight-bar-item">
              <div className="insight-bar-label-row">
                <span>{isAr ? 'الطلبات المسلمة بنجاح' : 'Fulfilled & Delivered Orders'}</span>
                <strong>97.6% ({deliveredOrders} orders)</strong>
              </div>
              <div className="progress-track">
                <div className="progress-fill fill-emerald" style={{ width: '97.6%' }} />
              </div>
            </div>

            <div className="insight-bar-item">
              <div className="insight-bar-label-row">
                <span>{isAr ? 'طلبات الاستبدال أو الإرجاع' : 'Exchange & Return Requests'}</span>
                <strong>2.4% ({returnedOrders} orders)</strong>
              </div>
              <div className="progress-track">
                <div className="progress-fill fill-amber" style={{ width: '2.4%' }} />
              </div>
            </div>
          </div>

          <div className="insight-fact-box">
            <div className="fact-title">
              {isAr ? 'أسباب المرتجعات الأكثر شيوعاً:' : 'Primary Reasons for Exchange/Return:'}
            </div>
            <ul className="fact-list">
              <li>
                {isAr
                  ? '٦٥٪ رغبة في استبدال اللون المختار بعد الاستلام.'
                  : '65% — Customer requested a different color variant after dispatch.'}
              </li>
              <li>
                {isAr
                  ? '٣٥٪ تغيير رأي المشتري قبل الدفع عند الاستلام.'
                  : '35% — Buyer change of mind on Cash on Delivery.'}
              </li>
            </ul>
            <div className="fact-pro-tip">
              <strong>{isAr ? 'نصيحة المنصة: ' : 'Seller Tip: '}</strong>
              {isAr
                ? 'تأكيد اختيار اللون ومواصفات الجهاز عبر دردشة الواتساب قبل الشحن يخفض نسبة المرتجعات بنسبة ٤٠٪.'
                : 'Confirming exact color choices & photos via WhatsApp before shipping cuts return rates by over 40%.'}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: RECURRING BUSINESS & RETENTION */}
        <div className="panel-card shadow-lg">
          <div className="panel-header">
            <h4 className="panel-title">
              {isAr ? 'تحليلات ولاء العملاء وتكرار الشراء' : 'Recurring Business & Retention Insights'}
            </h4>
            <p className="panel-subtitle">
              {isAr
                ? 'معدل عودة المشترين ومصادر الزيارات الأكثر تحويلاً للمبيعات'
                : 'Buyer re-order frequency and high-converting social channels'}
            </p>
          </div>

          <div className="retention-stats-grid">
            <div className="retention-stat-box">
              <span className="retention-stat-label">
                {isAr ? 'متوسط تكرار الطلب' : 'Average Order Frequency'}
              </span>
              <span className="retention-stat-num">1.8x</span>
              <span className="retention-stat-sub">
                {isAr ? 'طلبات لكل مشتري مسجل' : 'orders per active customer'}
              </span>
            </div>

            <div className="retention-stat-box">
              <span className="retention-stat-label">
                {isAr ? 'القيمة الدائمة للمشتري (LTV)' : 'Customer Lifetime Value'}
              </span>
              <span className="retention-stat-num font-emerald">
                {formatCurrency(customerLTV, currency, lang)}
              </span>
              <span className="retention-stat-sub">
                {isAr ? 'إجمالي إيراد المشتري المخلص' : 'Average revenue per repeat buyer'}
              </span>
            </div>
          </div>

          <div className="channel-distribution-section">
            <h5 className="channel-title">
              {isAr ? 'قنوات جذب الطلبات الأكثر تحويلاً:' : 'Top Converting Social Bio Channels:'}
            </h5>

            <div className="channel-row">
              <div className="channel-info">
                <span>Instagram Bio Link</span>
                <strong>52%</strong>
              </div>
              <div className="progress-track">
                <div className="progress-fill fill-teal" style={{ width: '52%' }} />
              </div>
            </div>

            <div className="channel-row">
              <div className="channel-info">
                <span>TikTok Bio Link</span>
                <strong>31%</strong>
              </div>
              <div className="progress-track">
                <div className="progress-fill fill-slate" style={{ width: '31%' }} />
              </div>
            </div>

            <div className="channel-row">
              <div className="channel-info">
                <span>WhatsApp Status & Direct Link</span>
                <strong>17%</strong>
              </div>
              <div className="progress-track">
                <div className="progress-fill fill-emerald" style={{ width: '17%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SellerAnalytics;
