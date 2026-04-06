import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const BorrowCartContext = createContext();

export const BorrowCartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        const saved = localStorage.getItem('lms_borrow_cart');
        try {
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('lms_borrow_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (book, requestedDueDate) => {
        if (cartItems.find(item => item._id === book._id)) {
            toast.info('Sách này đã có trong danh sách mượn.');
            return false;
        }
        if (cartItems.length >= 5) {
            toast.warning('Mỗi phiếu mượn tối đa 5 quyển sách.');
            return false;
        }
        
        let finalDate = requestedDueDate;
        if (!finalDate) {
            const defaultDate = new Date();
            defaultDate.setDate(defaultDate.getDate() + 70); // Default to 70 days
            finalDate = defaultDate.toISOString().split('T')[0];
        }
        
        const newItem = {
            _id: book._id,
            title: book.title,
            author: book.author,
            cover_image: book.cover_image,
            requestedDueDate: finalDate
        };

        setCartItems([...cartItems, newItem]);
        toast.success(`Đã thêm "${book.title}" vào danh sách.`);
        return true;
    };

    const removeFromCart = (bookId) => {
        setCartItems(cartItems.filter(item => item._id !== bookId));
    };

    const updateItemDate = (bookId, date) => {
        setCartItems(cartItems.map(item => 
            item._id === bookId ? { ...item, requestedDueDate: date } : item
        ));
    };

    const clearCart = () => {
        setCartItems([]);
    };

    return (
        <BorrowCartContext.Provider value={{ 
            cartItems, 
            addToCart, 
            removeFromCart, 
            updateItemDate,
            clearCart,
            count: cartItems.length 
        }}>
            {children}
        </BorrowCartContext.Provider>
    );
};

export const useBorrowCart = () => useContext(BorrowCartContext);