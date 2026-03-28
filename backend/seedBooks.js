require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('./src/models/Book');
const Category = require('./src/models/Category');

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
            "https://placehold.co/600x800/1e1e1e/FFF?text=Muc+Luc+Luoc+Su+Thoi+Gian"
        ]
    },
    {
        title: "Head First Java",
        author: "Kathy Sierra, Bert Bates",
        major: "Công nghệ thông tin",
        publisher: "O'Reilly Media",
        preview_images: [
            "https://covers.openlibrary.org/b/isbn/9780596009205-L.jpg",
            "https://placehold.co/600x800/1e1e1e/FFF?text=Head+First+Java+TOC+1",
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
            "https://placehold.co/600x800/1e1e1e/FFF?text=Muc+Luc+Getting+Things+Done"
        ]
    }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        for (let i = 0; i < heroBooks.length; i++) {
            const data = heroBooks[i];

            // Get or create category
            let category = await Category.findOne({ name: data.major });
            if (!category) {
                category = await Category.create({ name: data.major, code: 'CAT' + String(Date.now() + i).slice(-4) });
            }

            const isbn = '978' + String(Date.now() + i).slice(-10);

            const bookObj = {
                title: data.title,
                author: data.author,
                category: category._id,
                isbn: isbn,
                publisher: data.publisher,
                publish_year: 2024,
                description: 'Mô tả nội dung cuốn sách ' + data.title + ' để bạn có thể nắm bắt ý chính.',
                cover_image: data.preview_images[0],
                previewImages: data.preview_images,
                quantity: 15,
                available: 15,
                price: 150000,
                location: 'Kệ Hằng Ngày ' + (i + 1)
            };

            await Book.create(bookObj);
            console.log('Seeded:', data.title);
        }

        console.log('Finished seeding');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();
