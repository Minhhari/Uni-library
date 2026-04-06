import React from 'react';
import LibraryMap from '../components/LibraryMap';

const LibrarianMapPage = () => {
    return (
        <div className="h-[calc(100vh-120px)] w-full flex flex-col items-center justify-center animate-in fade-in duration-500">
            <div className="w-full h-full bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                <div className="p-8 border-b border-slate-50">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Sơ đồ kho (Space Management)</h3>
                    <p className="text-slate-400 text-sm font-bold mt-1 tracking-widest">Quản lý không gian thư viện và kiểm kê vị trí sách trực quan</p>
                </div>

                <div className="flex-1 overflow-auto p-4 md:p-8 bg-slate-50/50 flex justify-center">
                    <div className="w-full max-w-5xl my-auto bg-white p-6 md:p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                        <LibraryMap />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LibrarianMapPage;
