import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const TermsModal = ({ isOpen, onClose }) => {
  const { user, acceptTerms } = useAuth();
  const isStudent = user?.role === 'student' || !user?.role || user?.role === 'user';
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAccept = async () => {
    if (!agreed) return;
    setLoading(true);
    try {
      await acceptTerms();
      toast.success('Cảm ơn bạn đã chấp nhận điều khoản sử dụng!');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-900/60 backdrop-blur-md transition-all duration-300 px-4">
      <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-primary/5 px-8 pt-8 pb-6 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-2xl">verified_user</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Điều khoản & Chính sách</h2>
              <p className="text-zinc-500 text-sm font-medium">Vui lòng đọc kỹ trước khi sử dụng dịch vụ thư viện</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-zinc-200/50 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-all"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          <section>
            <h3 className="text-lg font-bold text-zinc-900 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-primary rounded-full"></span>
              1. Quy định chung
            </h3>
            <p className="text-zinc-600 leading-relaxed text-sm">
              Người dùng có trách nhiệm bảo quản sách và các tài sản của thư viện. Mọi hành vi phá hoại, làm hư hỏng hoặc làm mất tài sản của thư viện đều phải bồi thường theo quy định.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-zinc-900 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-primary rounded-full"></span>
              2. Mượn và trả sách
            </h3>
            <ul className="list-disc list-inside text-zinc-600 space-y-2 text-sm ml-2">
              <li>Thời gian mượn sách tối đa là 10 tuần kể từ ngày được duyệt.</li>
              <li>Mỗi lần chỉ được mượn tối đa số lượng sách theo quy định của từng đối tượng (Sinh viên/Giảng viên).</li>
              <li>Phải trả sách đúng hạn. Nếu quá hạn sẽ bị tính phí phạt 5,000đ/ngày.</li>
            </ul>
          </section>

          {isStudent && (
            <section className="bg-error/5 p-5 rounded-2xl border border-error/10">
              <h3 className="text-lg font-bold text-error mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined">warning</span>
                3. Ràng buộc quan trọng
              </h3>
              <p className="text-zinc-700 leading-relaxed text-sm font-medium">
                Nếu người dùng không hoàn trả sách cho thư viện hoặc còn nợ các khoản phí phạt, thư viện sẽ <span className="text-error font-bold">KHÔNG</span> đóng dấu xác nhận "Không có khoản nợ nào tại thư viện". Điều này sẽ dẫn đến việc người dùng <span className="text-error font-bold underline">KHÔNG ĐỦ ĐIỀU KIỆN NHẬN BẰNG TỐT NGHIỆP</span> khi ra trường.
              </p>
            </section>
          )}

          {!isStudent && (
             <section className="bg-primary/5 p-5 rounded-2xl border border-primary/10">
               <h3 className="text-lg font-bold text-primary mb-2 flex items-center gap-2">
                 <span className="material-symbols-outlined">info</span>
                 3. Trách nhiệm của Giảng viên
               </h3>
               <p className="text-zinc-700 leading-relaxed text-sm font-medium">
                 Giảng viên có trách nhiệm hoàn trả sách đúng hạn để không ảnh hưởng đến việc luân chuyển tài liệu phục vụ giảng dạy. Các khoản phí trễ hạn (nếu có) cần được thanh toán trước khi kết thúc mỗi học kỳ.
               </p>
             </section>
          )}

          <section>
            <h3 className="text-lg font-bold text-zinc-900 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-primary rounded-full"></span>
              4. Bảo mật thông tin
            </h3>
            <p className="text-zinc-600 leading-relaxed text-sm">
              Thư viện cam kết bảo mật thông tin cá nhân của người dùng và chỉ sử dụng cho các mục đích quản lý hoạt động mượn trả tại trường.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-8 bg-zinc-50 border-t border-zinc-100">
          <label className="flex items-center gap-3 cursor-pointer group mb-6">
            <div className="relative">
              <input 
                type="checkbox" 
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="peer sr-only"
              />
              <div className="w-6 h-6 border-2 border-zinc-300 rounded-lg bg-white peer-checked:bg-primary peer-checked:border-primary transition-all duration-200"></div>
              <span className="material-symbols-outlined absolute inset-0 text-white text-[16px] flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity">check</span>
            </div>
            <span className="text-zinc-700 text-sm font-semibold select-none group-hover:text-primary transition-colors">
              Tôi đã đọc và hoàn toàn đồng ý với điều khoản trên.
            </span>
          </label>

          <button
            onClick={handleAccept}
            disabled={!agreed || loading}
            className={`w-full h-14 rounded-2xl flex items-center justify-center gap-2 text-base font-bold transition-all
              ${agreed && !loading 
                ? 'bg-primary text-white shadow-xl shadow-primary/25 hover:translate-y-[-2px] hover:shadow-primary/40 active:translate-y-0' 
                : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'}`}
          >
            {loading ? (
              <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                Tiếp tục vào Thư viện
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
