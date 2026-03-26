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
                        <h1 className="text-2xl font-black text-on-surface mb-2">Verifying Payment…</h1>
                        <p className="text-on-surface-variant text-sm">
                            Please wait while we confirm your payment with PayOS.
                        </p>
                    </>
                )}

                {status === "paid" && (
                    <>
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-50 flex items-center justify-center">
                            <span className="material-symbols-outlined text-5xl text-emerald-500 filled">check_circle</span>
                        </div>
                        <h1 className="text-3xl font-black text-on-surface mb-2">Payment Successful!</h1>
                        <p className="text-on-surface-variant text-sm mb-8">
                            Your fine has been cleared. A receipt has been sent to your registered email.
                        </p>
                        <Link
                            to="/transactions"
                            className="inline-flex items-center gap-2 bg-primary text-white font-black px-8 py-3.5 rounded-2xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl active:scale-95"
                        >
                            <span className="material-symbols-outlined text-lg">receipt_long</span>
                            View My Transactions
                        </Link>
                    </>
                )}

                {(status === "failed" || status === "no-code") && (
                    <>
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
                            <span className="material-symbols-outlined text-5xl text-red-400 filled">cancel</span>
                        </div>
                        <h1 className="text-3xl font-black text-on-surface mb-2">
                            {status === "no-code" ? "Invalid Link" : "Payment Not Confirmed"}
                        </h1>
                        <p className="text-on-surface-variant text-sm mb-8">
                            {status === "no-code"
                                ? "No payment order was found. Please try paying again from the Transactions page."
                                : "We could not confirm your payment. If money was deducted, please contact the library counter. You can also try again."}
                        </p>
                        <div className="flex gap-3 justify-center flex-wrap">
                            <Link
                                to="/transactions"
                                className="inline-flex items-center gap-2 bg-primary text-white font-black px-6 py-3 rounded-2xl hover:bg-primary/90 transition-all shadow active:scale-95 text-sm"
                            >
                                <span className="material-symbols-outlined text-base">arrow_back</span>
                                Back to Transactions
                            </Link>
                            <a
                                href="/"
                                className="inline-flex items-center gap-2 border border-surface-dim text-on-surface-variant font-bold px-6 py-3 rounded-2xl hover:bg-surface-container transition-all text-sm"
                            >
                                Go Home
                            </a>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentSuccessPage;
