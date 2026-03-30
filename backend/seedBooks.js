const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const Book = require('./src/models/Book');
const Category = require('./src/models/Category');

// --- DỮ LIỆU SÁCH MẪU ---
const heroBooks = [
    {
        title: "Clean Code: A Handbook of Agile Software Craftsmanship",
        author: "Robert C. Martin",
        major: "Công nghệ thông tin",
        publisher: "Prentice Hall",
        preview_images: [
            "https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg",
            "https://placehold.co/600x800/1e1e1e/FFF?text=Muc+Luc+Clean+Code+Trang+1",
            "https://placehold.co/600x800/1e1e1e/FFF?text=Muc+Luc+Clean+Code+Trang+2"
        ]
    },
    {
        title: "Đắc Nhân Tâm (How to Win Friends and Influence People)",
        author: "Dale Carnegie",
        major: "Kỹ năng mềm",
        publisher: "NXB Tổng hợp TP.HCM",
        preview_images: [
            "https://nxbhcm.com.vn/Image/Biasach/dacnhantam86.jpg",
            "https://placehold.co/600x800/1e1e1e/FFF?text=Muc+Luc+Dac+Nhan+Tam+1",
            "https://placehold.co/600x800/1e1e1e/FFF?text=Muc+Luc+Dac+Nhan+Tam+2"
        ]
    },
    {
        title: "Design Patterns: Elements of Reusable Object-Oriented Software",
        author: "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides",
        major: "Công nghệ thông tin",
        publisher: "Addison-Wesley",
        preview_images: [
            "https://covers.openlibrary.org/b/isbn/9780201633610-L.jpg",
            "https://placehold.co/600x800/1e1e1e/FFF?text=Table+of+Contents+Part+1",
            "https://placehold.co/600x800/1e1e1e/FFF?text=Table+of+Contents+Part+2"
        ]
    },
    {
        title: "Tư Duy Nhanh Và Chậm (Thinking, Fast and Slow)",
        author: "Daniel Kahneman",
        major: "Tâm lý học",
        publisher: "NXB Thế Giới",
        preview_images: [
            "https://covers.openlibrary.org/b/isbn/9780374275631-L.jpg",
            "https://placehold.co/600x800/1e1e1e/FFF?text=Muc+Luc+Tu+Duy+Nhanh+Cham"
        ]
    },
    {
        title: "Introduction to Algorithms",
        author: "Thomas H. Cormen, Charles E. Leiserson",
        major: "Công nghệ thông tin",
        publisher: "MIT Press",
        preview_images: [
            "https://covers.openlibrary.org/b/isbn/9780262033848-L.jpg",
            "https://placehold.co/600x800/1e1e1e/FFF?text=Algorithms+TOC+Chapter+1",
            "https://placehold.co/600x800/1e1e1e/FFF?text=Algorithms+TOC+Chapter+2"
        ]
    },
    {
        title: "Nhà Giả Kim (The Alchemist)",
        author: "Paulo Coelho",
        major: "Văn học",
        publisher: "NXB Văn Học",
        preview_images: [
            "https://covers.openlibrary.org/b/isbn/9780061122415-L.jpg",
            "https://placehold.co/600x800/1e1e1e/FFF?text=Nha+Gia+Kim+Loi+Noi+Dau",
            "https://placehold.co/600x800/1e1e1e/FFF?text=Nha+Gia+Kim+Phan+1"
        ]
    },
    {
        title: "The Pragmatic Programmer",
        author: "Andrew Hunt, David Thomas",
        major: "Công nghệ thông tin",
        publisher: "Addison-Wesley",
        preview_images: [
            "https://covers.openlibrary.org/b/isbn/9780201616224-L.jpg",
            "https://placehold.co/600x800/1e1e1e/FFF?text=Pragmatic+Programmer+TOC"
        ]
    },
    {
        title: "Lược Sử Thời Gian (A Brief History of Time)",
        author: "Stephen Hawking",
        major: "Khoa học cơ bản",
        publisher: "NXB Trẻ",
        preview_images: [
            "https://covers.openlibrary.org/b/isbn/9780553380163-L.jpg",
            "https://cdn1.fahasa.com/media/flashmagazine/images/page_images/luoc_su_thoi_gian/2024_11_12_14_21_15_2-390x510.jpg"
        ]
    },
    {
        title: "Head First Java",
        author: "Kathy Sierra, Bert Bates",
        major: "Công nghệ thông tin",
        publisher: "O'Reilly Media",
        preview_images: [
            "https://covers.openlibrary.org/b/isbn/9780596009205-L.jpg",
            "https://m.media-amazon.com/images/I/71q7cvy6woL._SY385_.jpg",
            "https://placehold.co/600x800/1e1e1e/FFF?text=Head+First+Java+TOC+2"
        ]
    },
    {
        title: "Hoàn Thành Mọi Việc Không Hề Khó (Getting Things Done)",
        author: "David Allen",
        major: "Kỹ năng mềm",
        publisher: "Penguin Books",
        preview_images: [
            "https://covers.openlibrary.org/b/isbn/9780142000281-L.jpg",
            "https://nhasachhaian.com/wp-content/uploads/2025/10/muc-luc-hoan-thanh-moi-viec-khong-he-kho.jpg"
        ]
    }
];

const moreBooks = [
    {
        title: "Refactoring: Improving the Design of Existing Code",
        author: "Martin Fowler",
        major: "Công nghệ thông tin",
        publisher: "Addison-Wesley",
        preview_images: [
            "https://covers.openlibrary.org/b/isbn/9780201485677-L.jpg",
            "https://learning.oreilly.com/library/cover/9780134757681/250w/"
        ]
    },
    {
        title: "Kinh Điển Về Khởi Nghiệp (Disciplined Entrepreneurship)",
        author: "Bill Aulet",
        major: "Kinh tế",
        publisher: "NXB Trẻ",
        preview_images: [
            "https://m.media-amazon.com/images/I/81v7n6X8SML._AC_UF1000,1000_QL80_.jpg",
            "https://www.netabooks.vn/Data/Sites/1/Product/67511/kinh-dien-ve-khoi-nghiep-thuc-hanh.jpg"
        ]
    },
    {
        title: "The Art of Computer Programming",
        author: "Donald Knuth",
        major: "Công nghệ thông tin",
        publisher: "Addison-Wesley",
        preview_images: [
            "https://covers.openlibrary.org/b/isbn/9780201896831-L.jpg",
            "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1348077438i/299643.jpg"
        ]
    },
    {
        title: "Deep Work: Rules for Focused Success",
        author: "Cal Newport",
        major: "Kỹ năng mềm",
        publisher: "Grand Central Publishing",
        preview_images: [
            "https://covers.openlibrary.org/b/isbn/9781455586691-L.jpg",
            "https://m.media-amazon.com/images/I/417pLhIZpWL.jpg"
        ]
    },
    {
        title: "Sapiens: Lược Sử Loài Người",
        author: "Yuval Noah Harari",
        major: "Lịch sử",
        publisher: "NXB Thế Giới",
        preview_images: [
            "https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg",
            "https://salt.tikicdn.com/cache/w1200/ts/product/45/3d/7c/8f0730ca5d70f3799ad7c08c4e13e00a.jpg"
        ]
    },
    {
        title: "Cracking the Coding Interview",
        author: "Gayle Laakmann McDowell",
        major: "Công nghệ thông tin",
        publisher: "CareerCup",
        preview_images: [
            "https://covers.openlibrary.org/b/isbn/9780984782857-L.jpg",
            "https://m.media-amazon.com/images/I/61mIq2iJUXL._AC_UF1000,1000_QL80_.jpg"
        ]
    },
    {
        title: "Bắt Trẻ Đồng Xanh (The Catcher in the Rye)",
        author: "J. D. Salinger",
        major: "Văn học",
        publisher: "NXB Hội Nhà Văn",
        preview_images: [
            "https://covers.openlibrary.org/b/isbn/9780316769488-L.jpg",
            "https://salt.tikicdn.com/ts/product/00/61/8a/802652431792613e5f29d91f4d99c30c.jpg"
        ]
    },
    {
        title: "Python Crash Course",
        author: "Eric Matthes",
        major: "Công nghệ thông tin",
        publisher: "No Starch Press",
        preview_images: [
            "https://covers.openlibrary.org/b/isbn/9781593276034-L.jpg",
            "https://bizweb.dktcdn.net/100/527/077/products/screenshot20221106at1721540efd.png?v=1728468856383"
        ]
    },
    {
        title: "Atomic Habits - Thay Đổi Tí Hon Hiệu Quả Bất Ngờ",
        author: "James Clear",
        major: "Kỹ năng mềm",
        publisher: "NXB Thế Giới",
        preview_images: [
            "https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg",
            "https://m.media-amazon.com/images/I/91bYsX41DVL._AC_UF1000,1000_QL80_.jpg"
        ]
    },
    {
        title: "Soft Skills for Software Engineers",
        author: "Zeno Rocha",
        major: "Công nghệ thông tin",
        publisher: "Independent",
        preview_images: [
            "https://m.media-amazon.com/images/I/61U0t+8fJPL._AC_UF1000,1000_QL80_.jpg",
            "https://m.media-amazon.com/images/I/A1tYa0EpiyL._AC_UF1000,1000_QL80_.jpg"
        ]
    },
    {
        title: "Chiến Tranh Tiền Tệ (Currency Wars)",
        author: "Song Hongbing",
        major: "Kinh tế",
        publisher: "NXB Trẻ",
        preview_images: [
            "https://cdn0.fahasa.com/media/catalog/product/c/h/chien_tranh_tien_te_tai_ban_2016.jpg",
            "https://salt.tikicdn.com/ts/product/5e/54/2e/d0299f074d0e2e50085a210d7a040b2e.jpg"
        ]
    },
    {
        title: "Artificial Intelligence: A Modern Approach",
        author: "Stuart Russell, Peter Norvig",
        major: "Công nghệ thông tin",
        publisher: "Pearson",
        preview_images: [
            "https://covers.openlibrary.org/b/isbn/9780136042594-L.jpg",
            "https://product.hstatic.net/200000239353/product/artificial_intelligence_a_modern_approach__3rd_editio-01_6015dd026d1942a4a3b23a0faf4c4934_master.jpg"
        ]
    },
    {
        title: "Tiếng Anh Cho Người Mới Bắt Đầu",
        author: "The Windy",
        major: "Ngoại ngữ",
        publisher: "NXB Đại Học Quốc Gia",
        preview_images: [
            "https://cdn0.fahasa.com/media/catalog/product/i/m/image_195509_1_18809.jpg",
            "https://cdn1.fahasa.com/media/catalog/product/9/7/9786044013985.jpg"
        ]
    },
    {
        title: "Dám Bị Ghét",
        author: "Kishimi Ichiro, Koga Fumitake",
        major: "Tâm lý học",
        publisher: "NXB Lao Động",
        preview_images: [
            "https://cdn0.fahasa.com/media/catalog/product/i/m/image_180481.jpg",
            "https://nxbdantri.com.vn/wp-content/uploads/2023/03/Dam-bi-ghet-min.jpg,"
        ]
    },
    {
        title: "Microservices Patterns",
        author: "Chris Richardson",
        major: "Công nghệ thông tin",
        publisher: "Manning Publications",
        preview_images: [
            "https://covers.openlibrary.org/b/isbn/9781617294549-L.jpg",
            "https://microservices.io/i/Microservices-Patterns-Cover.png"
        ]
    }
];

// --- TIẾN TRÌNH SEED ---
async function seed() {
    try {
        console.log('--- STARTING SEED PROCESS ---');

        if (!process.env.MONGO_URI) {
            console.error('❌ LỖI: Không tìm thấy MONGO_URI trong .env');
            process.exit(1);
        }
        console.log('📡 Đang kết nối tới Database...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Kết nối thành công!');
        console.log('🧹 Đang xóa sách cũ...');
        await Book.deleteMany({});
        const allBooksToSeed = [...heroBooks, ...moreBooks];
        console.log(`🚀 Đang nạp ${allBooksToSeed.length} cuốn sách...`);
        for (let i = 0; i < allBooksToSeed.length; i++) {
            const data = allBooksToSeed[i];
            let category = await Category.findOne({ name: data.major });
            if (!category) {
                category = await Category.create({ name: data.major, code: 'CAT' + (1000 + i) });
            }
            await Book.create({
                title: data.title,
                author: data.author,
                category: category._id,
                isbn: '9783161' + (10000 + i),
                publisher: data.publisher,
                publish_year: 2024,
                description: 'Dữ liệu mẫu cho ' + data.title,
                cover_image: data.preview_images[0],
                previewImages: data.preview_images,
                quantity: 15,
                available: 15,
                price: 150000,
                location: 'Kệ A' + (i + 1)
            });
        }
        console.log('\n--- KẾT QUẢ TRONG DATABASE ---');
        const finalBooks = await Book.find().populate('category', 'name').limit(5);
        console.table(finalBooks.map(b => ({
            Title: b.title.substring(0, 30) + '...',
            Author: b.author,
            Category: b.category?.name,
            ISBN: b.isbn
        })));
        console.log(`\n✅ TỔNG CỘNG: ${await Book.countDocuments()} cuốn sách đã có trong DB.`);
        console.log('------------------------------');
        process.exit(0);
    } catch (err) {
        console.error('❌ LỖI KHI SEED:', err.message);
        process.exit(1);
    }
}
seed();