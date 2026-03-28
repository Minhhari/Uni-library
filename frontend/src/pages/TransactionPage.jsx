import React, { useEffect, useState, useCallback } from "react";
import { fineAPI, paymentAPI } from "../services/api";

// ─── Helpers ────────────────────────────────────────────────────────────
const reasonLabel = (reason) => {
  const map = {
    late: "TRẢ TRỄ",
    lost: "MẤT SÁCH",
    damaged: "SÁCH HƯ HỎNG",
    late_and_damaged: "TRỄ + HƯ HỎNG",
    lost_and_late: "MẤT + TRỄ",
  };
  return map[reason] || reason?.toUpperCase();
};

const reasonBadgeClass = (reason) => {
  if (reason === "late" || reason === "lost_and_late")
    return "bg-amber-100 text-amber-700 border border-amber-300";
  if (reason === "lost")
    return "bg-red-100 text-red-700 border border-red-300";
  if (reason === "damaged")
    return "bg-blue-100 text-blue-700 border border-blue-300";
  if (reason === "late_and_damaged")
    return "bg-orange-100 text-orange-700 border border-orange-300";
  return "bg-gray-100 text-gray-600 border border-gray-300";
};

const conditionLabel = (cond) => {
  const map = { damaged: "Hư hỏng do nước (Bìa)", lost: "Đã mất — Không hoàn trả", good: "Tình trạng tốt" };
  return map[cond] || cond;
};

const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN", { month: "short", day: "numeric", year: "numeric" });
};

const formatVND = (amount) => {
  return (amount || 0).toLocaleString("vi-VN") + " VND";
};

const PAYMENT_METHODS = [
  { id: "payos", label: "VNPay QR", icon: "qr_code_2", badge: "Khuyên dùng" },
  { id: "cash", label: "Tiền mặt tại quầy", icon: "payments", badge: null },
];

// ─── Book Cover ──────────────────────────────────────────────────────────
const BookCover = ({ src, title }) => {
  const palettes = [
    "from-emerald-500 to-teal-700",
    "from-amber-500 to-orange-700",
    "from-blue-500 to-indigo-700",
    "from-rose-500 to-pink-700",
    "from-violet-500 to-purple-700",
    "from-cyan-500 to-sky-700",
  ];
  const idx = title ? title.charCodeAt(0) % palettes.length : 0;
  if (src) {
    return (
      <img src={src} alt={title}
        className="w-14 h-20 object-cover rounded-xl shadow flex-shrink-0"
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
    );
  }
  return (
    <div className={`w-14 h-20 rounded-xl bg-gradient-to-br ${palettes[idx]} flex items-center justify-center flex-shrink-0 shadow`}>
      <span className="material-symbols-outlined text-white/80 text-2xl">menu_book</span>
    </div>
  );
};

// ─── Toast ───────────────────────────────────────────────────────────────
const Toast = ({ toast }) => {
  if (!toast) return null;
  const styles = {
    success: "bg-emerald-50 border-emerald-300 text-emerald-800",
    error: "bg-red-50 border-red-300 text-red-800",
    info: "bg-blue-50 border-blue-300 text-blue-800",
  };
  const icons = { success: "check_circle", error: "error", info: "info" };
  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg border text-sm font-semibold ${styles[toast.type] || styles.info}`}>
      <span className="material-symbols-outlined text-lg">{icons[toast.type] || "info"}</span>
      {toast.msg}
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────
const TransactionPage = () => {
  const [loading, setLoading] = useState(true);
  const [fines, setFines] = useState([]);
  const [summary, setSummary] = useState({ totalOutstanding: 0, pendingCount: 0, totalPaid: 0, paidCount: 0 });
  const [selectedMethod, setSelectedMethod] = useState("payos");
  const [payingId, setPayingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchFines = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fineAPI.getMyFines();
      const { fines: list, summary: sum } = res.data.data;
      setFines(list);
      setSummary(sum);
    } catch {
      showToast("Không thể tải danh sách tiền phạt. Vui lòng thử lại.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFines(); }, [fetchFines]);

  const pendingFines = fines.filter((f) => f.status === "pending");
  const paidFines = fines.filter((f) => f.status === "paid");
  const displayed = activeTab === "pending" ? pendingFines : paidFines;

  const handlePayItem = async (fine) => {
    if (selectedMethod !== "payos") {
      showToast(`Vui lòng đến quầy để thanh toán ${formatVND(fine.amount)}.`, "info");
      return;
    }
    try {
      setPayingId(fine._id);
      const res = await paymentAPI.createPayment(fine._id);
      if (res.data?.checkoutUrl) {
        window.open(res.data.checkoutUrl, "_blank");
        showToast("Liên kết thanh toán đã mở — vui lòng hoàn tất thanh toán ở tab mới.", "success");
      }
    } catch (err) {
      showToast(err?.response?.data?.message || "Không thể tạo giao dịch thanh toán.", "error");
    } finally {
      setPayingId(null);
    }
  };

  const handleConfirmAll = () => {
    if (!pendingFines.length) return;
    if (selectedMethod !== "payos") {
      showToast("Vui lòng đến quầy để thanh toán tất cả các khoản phạt.", "info");
      return;
    }
    handlePayItem(pendingFines[0]);
  };

  return (
    <div className="min-h-screen font-body text-on-surface">
      <Toast toast={toast} />

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs font-bold tracking-[0.18em] uppercase text-on-surface-variant mb-1">
            Tổng quan tài khoản
          </p>
          <h1 className="text-4xl font-black tracking-tight text-on-surface leading-tight">
            Khoản phạt của tôi
          </h1>
          <p className="text-on-surface-variant text-sm mt-2 max-w-md leading-relaxed">
            Xem và quản lý các khoản phạt thư viện chưa thanh toán. Thanh toán được xử lý
            an toàn qua cổng thông tin của trường.
          </p>
        </div>

        {/* Outstanding Balance Card */}
        <div className="bg-red-50 border border-red-200 rounded-2xl px-8 py-5 text-right min-w-[200px] shadow-sm">
          <p className="text-[10px] font-black tracking-[0.2em] uppercase text-red-500 mb-1">
            Số dư nợ
          </p>
          {loading ? (
            <div className="h-10 w-32 bg-red-100 rounded-lg animate-pulse ml-auto" />
          ) : (
            <p className="text-4xl font-black text-red-500">
              {formatVND(summary.totalOutstanding)}
            </p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex gap-8 items-start">

        {/* Left panel */}
        <div className="flex-1 min-w-0">

          {/* Tabs */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex gap-1 bg-surface-container-low p-1 rounded-xl border border-surface-dim">
              {[
                { id: "pending", label: "Khoản phạt chờ xử lý", count: summary.pendingCount },
                { id: "paid", label: "Đã thanh toán", count: summary.paidCount },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === tab.id
                    ? "bg-primary text-white shadow"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                    }`}
                >
                  {tab.label}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-black ${activeTab === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-surface-container-high text-on-surface-variant"
                    }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
            <span className="text-xs text-on-surface-variant font-semibold">
              Tìm thấy {displayed.length} mục
            </span>
          </div>

          {/* Cards */}
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white border border-surface-dim rounded-2xl p-5 h-28 animate-pulse" />
              ))
            ) : displayed.length === 0 ? (
              <div className="bg-white border border-surface-dim rounded-2xl p-14 text-center shadow-sm">
                <span className="material-symbols-outlined text-5xl text-outline mb-3 block">
                  {activeTab === "pending" ? "check_circle" : "receipt_long"}
                </span>
                <p className="text-on-surface-variant font-semibold">
                  {activeTab === "pending" ? "Không có khoản phạt nào — Bạn đã hoàn tất! 🎉" : "Chưa có khoản phạt nào đã thanh toán."}
                </p>
              </div>
            ) : (
              displayed.map((fine) => (
                <div
                  key={fine._id}
                  className="bg-white border border-surface-dim rounded-2xl p-5 flex items-start gap-5 hover:border-outline/40 hover:shadow-md transition-all"
                >
                  <BookCover src={fine.book?.coverImage} title={fine.book?.title} />

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-on-surface text-sm leading-tight mb-1 line-clamp-1">
                      {fine.book?.title || "Sách không xác định"}
                    </h3>

                    {fine.reason === "damaged" || fine.reason === "lost" ? (
                      <p className="text-xs text-on-surface-variant mb-2.5">
                        Tình trạng trả sách:{" "}
                        <span className="text-amber-600 font-semibold">{conditionLabel(fine.bookCondition)}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-on-surface-variant mb-2.5">
                        Hạn trả: {formatDate(fine.dueDate)}
                        {fine.daysOverdue > 0 && (
                          <span className="text-orange-500 font-bold ml-2">
                            • {fine.daysOverdue} ngày quá hạn
                          </span>
                        )}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <span className={`text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-lg ${reasonBadgeClass(fine.reason)}`}>
                        {reasonLabel(fine.reason)}
                      </span>
                      {fine.book?.author && (
                        <span className="text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-lg bg-surface-container text-on-surface-variant border border-surface-dim">
                          {fine.book.author}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 flex flex-col items-end">
                    <p className="text-2xl font-black text-on-surface">{formatVND(fine.amount)}</p>
                    <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mb-3">
                      {fine.reason === "damaged" || fine.reason === "lost" ? "Phạt cố định" : "5.000 VND/Ngày"}
                    </p>
                    {fine.status === "pending" ? (
                      <button
                        onClick={() => handlePayItem(fine)}
                        disabled={payingId === fine._id}
                        className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-xs font-black px-4 py-2 rounded-xl transition-all shadow hover:shadow-md flex items-center gap-1.5"
                      >
                        {payingId === fine._id ? (
                          <>
                            <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                            Đang xử lý...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-sm">payments</span>
                            Thanh toán
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-2 rounded-xl">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Đã trả
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Past Settlements Table */}
          {paidFines.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-black text-on-surface mb-5 tracking-tight">Lịch sử thanh toán</h2>
              <div className="bg-white border border-surface-dim rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="border-b border-surface-dim bg-surface-container-low">
                    <tr>
                      {["Ngày", "Mô tả", "Phương thức", "Số tiền", "Biên lai"].map((h) => (
                        <th key={h} className="text-left text-[10px] font-black tracking-[0.15em] uppercase text-on-surface-variant px-6 py-4">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paidFines.map((fine, i) => (
                      <tr
                        key={fine._id}
                        className={`hover:bg-surface-container-low transition-colors ${i < paidFines.length - 1 ? "border-b border-surface-dim" : ""}`}
                      >
                        <td className="px-6 py-4 text-on-surface-variant font-semibold">{formatDate(fine.dueDate)}</td>
                        <td className="px-6 py-4 text-on-surface font-semibold">
                          {fine.reason === "late" ? "Trả trễ" : reasonLabel(fine.reason)}: {fine.book?.title || "Không xác định"}
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-surface-container text-on-surface-variant border border-surface-dim text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-lg">
                            {fine.orderCode ? "VNPAY" : "TIỀN MẶT"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-on-surface font-black">{formatVND(fine.amount)}</td>
                        <td className="px-6 py-4">
                          <button className="flex items-center gap-1.5 text-primary text-xs font-bold hover:underline">
                            <span className="material-symbols-outlined text-sm">download</span>
                            PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right: Settlement Panel */}
        <div className="w-72 flex-shrink-0 sticky top-6">
          <div className="bg-white border border-surface-dim rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary text-xl">account_balance</span>
              <h2 className="text-xl font-black text-on-surface">Thanh toán</h2>
            </div>

            <div className="space-y-2.5 pb-5 border-b border-surface-dim mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Tổng tiền phạt ({summary.pendingCount} mục)</span>
                {loading ? (
                  <div className="h-4 w-16 bg-surface-container rounded animate-pulse" />
                ) : (
                  <span className="text-on-surface font-bold">{formatVND(summary.totalOutstanding)}</span>
                )}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Phí xử lý</span>
                <span className="text-primary font-bold">{formatVND(0)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-surface-dim mt-2">
                <span className="font-black text-on-surface">Tổng cộng</span>
                {loading ? (
                  <div className="h-7 w-20 bg-surface-container rounded animate-pulse" />
                ) : (
                  <span className="text-2xl font-black text-on-surface">{formatVND(summary.totalOutstanding)}</span>
                )}
              </div>
            </div>

            <p className="text-[10px] font-black tracking-[0.2em] uppercase text-on-surface-variant mb-3">
              Chọn phương thức thanh toán
            </p>
            <div className="space-y-2 mb-5">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMethod(m.id)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${selectedMethod === m.id
                    ? "border-primary/40 bg-primary/5 shadow-sm"
                    : "border-surface-dim bg-surface-container-low hover:border-outline/30 hover:bg-surface-container"
                    }`}
                >
                  <span className={`material-symbols-outlined text-xl ${selectedMethod === m.id ? "text-primary" : "text-on-surface-variant"}`}>
                    {m.icon}
                  </span>
                  <span className={`text-sm font-bold flex-1 ${selectedMethod === m.id ? "text-on-surface" : "text-on-surface-variant"}`}>
                    {m.label}
                  </span>
                  {m.badge && (
                    <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {m.badge}
                    </span>
                  )}
                  {selectedMethod === m.id && (
                    <span className="material-symbols-outlined text-primary text-lg">radio_button_checked</span>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={handleConfirmAll}
              disabled={summary.pendingCount === 0 || loading}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-xl transition-all shadow hover:shadow-md flex items-center justify-center gap-2 text-sm"
            >
              Xác nhận thanh toán
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>

            <p className="text-[11px] text-on-surface-variant text-center mt-4 leading-relaxed">
              Bằng cách nhấn xác nhận, bạn đồng ý với các điều khoản thanh toán và chính sách thư viện của LibraFlow.
              Biên lai sẽ được gửi qua email ngay lập tức.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TransactionPage;