import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { paymentAPI } from "../services/api";

const PaymentSuccessPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const orderCode = searchParams.get("orderCode");

    const [status, setStatus] = useState("verifying"); // "verifying" | "paid" | "failed" | "no-code"

    useEffect(() => {
        if (!orderCode) {
            setStatus("no-code");
            return;
        }

        const verify = async () => {
            try {
                const res = await paymentAPI.verifyPayment(orderCode);
                if (res.data?.success && res.data?.status === "paid") {
                    setStatus("paid");
                } else {
                    setStatus("failed");
                }
            } catch (err) {
                console.error("Verify payment failed:", err);
                setStatus("failed");
            }
        };

        verify();
    }, [orderCode]);

    return (
        <div className="min-h-screen flex items-center justify-center font-body bg-white">
            <div className="max-w-md w-full text-center px-8 py-16 bg-white rounded-[40px] shadow-2xl border border-surface-dim">

                {status === "verifying" && (
                    <>
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-50 flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl text-blue-500 animate-spin">progress_activity</span>
                        </div>
                        <h1 className="text-2xl font-black text-on-surface mb-2">Đang xác minh thanh toán…</h1>
                        <p className="text-on-surface-variant text-sm">
                            Vui lòng đợi trong khi chúng tôi xác nhận thanh toán của bạn với PayOS.
                        </p>
                    </>
                )}

                {status === "paid" && (
                    <>
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-50 flex items-center justify-center">
                            <span className="material-symbols-outlined text-5xl text-emerald-500 filled">check_circle</span>
                        </div>
                        <h1 className="text-3xl font-black text-on-surface mb-2">Thanh toán thành công!</h1>
                        <p className="text-on-surface-variant text-sm mb-8">
                            Khoản phạt của bạn đã được xóa. Biên lai đã được gửi đến email đã đăng ký của bạn.
                        </p>
                        <Link
                            to="/transactions"
                            className="inline-flex items-center gap-2 bg-primary text-white font-black px-8 py-3.5 rounded-2xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl active:scale-95"
                        >
                            <span className="material-symbols-outlined text-lg">receipt_long</span>
                            Xem các giao dịch của tôi
                        </Link>
                    </>
                )}

                {(status === "failed" || status === "no-code") && (
                    <>
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
                            <span className="material-symbols-outlined text-5xl text-red-400 filled">cancel</span>
                        </div>
                        <h1 className="text-3xl font-black text-on-surface mb-2">
                            {status === "no-code" ? "Liên kết không hợp lệ" : "Thanh toán chưa được xác nhận"}
                        </h1>
                        <p className="text-on-surface-variant text-sm mb-8">
                            {status === "no-code"
                                ? "Không tìm thấy đơn hàng thanh toán nào. Vui lòng thử thanh toán lại từ trang Giao dịch."
                                : "Chúng tôi không thể xác nhận thanh toán của bạn. Nếu tiền đã bị trừ, vui lòng liên hệ quầy thư viện. Bạn cũng có thể thử lại."}
                        </p>
                        <div className="flex gap-3 justify-center flex-wrap">
                            <Link
                                to="/transactions"
                                className="inline-flex items-center gap-2 bg-primary text-white font-black px-6 py-3 rounded-2xl hover:bg-primary/90 transition-all shadow active:scale-95 text-sm"
                            >
                                <span className="material-symbols-outlined text-base">arrow_back</span>
                                Quay lại Giao dịch
                            </Link>
                            <a
                                href="/"
                                className="inline-flex items-center gap-2 border border-surface-dim text-on-surface-variant font-bold px-6 py-3 rounded-2xl hover:bg-surface-container transition-all text-sm"
                            >
                                Về trang chủ
                            </a>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentSuccessPage;
